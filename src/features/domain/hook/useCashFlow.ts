import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { expenseRepository } from '../../data/repositories/ExpenseRepository';
import { customerRepository } from '../../data/repositories/CustomerRepository';
import { type DateRange } from '../types/salesTypes';
import {
    startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addDays, subDays, addWeeks, subWeeks, addMonths, subMonths
} from 'date-fns';
import { type OrderModel } from '../types/orderTypes';
import { type Expense } from '../types/expenseTypes';

export const useCashflow = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [customersMap, setCustomersMap] = useState<Record<string, string>>({});
    const [range, setRange] = useState<DateRange>('today');

    // El pivote central para la navegación
    const [referenceDate, setReferenceDate] = useState(new Date());

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        let start: Date;
        let end: Date;

        // Definición de rangos dinámicos basados en la fecha de referencia
        switch (range) {
            case 'today':
                start = startOfDay(referenceDate);
                end = endOfDay(referenceDate);
                break;
            case 'week':
                start = startOfWeek(referenceDate, { weekStartsOn: 1 });
                end = endOfWeek(referenceDate, { weekStartsOn: 1 });
                break;
            case 'month':
                start = startOfMonth(referenceDate);
                end = endOfMonth(referenceDate);
                break;
            default:
                start = startOfDay(referenceDate);
                end = endOfDay(referenceDate);
        }

        try {
            const [salesData, expensesData] = await Promise.all([
                salesRepository.getOrdersByDateRange(start.getTime(), end.getTime()),
                expenseRepository.getByRange(start.getTime(), end.getTime())
            ]);

            // Hidratación de nombres de clientes
            const uniqueClientIds = Array.from(new Set(
                salesData.map(o => o.client).filter(id => id && id !== null)
            )) as string[];

            const customerProfiles = await Promise.all(
                uniqueClientIds.map(id => customerRepository.getById(id))
            );

            const cMap: Record<string, string> = {};
            customerProfiles.forEach(c => {
                if (c) cMap[c.id!] = c.name + ' ' + c.lastname;
            });

            setCustomersMap(cMap);
            setOrders(salesData);
            setExpenses(expensesData);
        } catch (error) {
            console.error("Error consolidando Cash Flow:", error);
        } finally {
            setIsLoading(false);
        }
    }, [range, referenceDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Manejadores de Navegación (Handle Next/Prev) ---
    const handleNext = () => {
        if (range === 'today') setReferenceDate(prev => addDays(prev, 1));
        if (range === 'week') setReferenceDate(prev => addWeeks(prev, 1));
        if (range === 'month') setReferenceDate(prev => addMonths(prev, 1));
    };

    const handlePrev = () => {
        if (range === 'today') setReferenceDate(prev => subDays(prev, 1));
        if (range === 'week') setReferenceDate(prev => subWeeks(prev, 1));
        if (range === 'month') setReferenceDate(prev => subMonths(prev, 1));
    };

    const resetToToday = () => setReferenceDate(new Date());

    // --- Procesamiento de Estadísticas ---
    const stats = useMemo(() => {
        if (orders.length === 0 && expenses.length === 0) return null;

        let cashIn = 0; let transferIn = 0;
        let cashOut = 0; let transferOut = 0;

        // Totales por categoría inicializados en 0
        const categories = {
            supplierOut: 0,
            salaryOut: 0,
            suppliesOut: 0,
            servicesOut: 0,
            otherOut: 0
        };

        const enrichedOrders = orders.map(order => ({
            ...order,
            clientName: order.client && customersMap[order.client]
                ? customersMap[order.client]
                : "Consumidor Final"
        }));

        const incomeOrders = enrichedOrders.filter(o => o.status === 'CONFIRMED');
        const debtOrders = enrichedOrders.filter(o => (o.total - (o.payed || 0)) > 0);

        incomeOrders.forEach(order => {
            const methods = Array.isArray(order.paymentMethod) ? order.paymentMethod : [];
            methods.forEach(m => {
                if (m.type === "CASH") cashIn += m.amount;
                if (m.type === "TRANSFER") transferIn += m.amount;
            });
        });

        expenses.forEach(expense => {
            const methods = Array.isArray(expense.paymentMethod) ? expense.paymentMethod : [];
            methods.forEach(m => {
                const amt = Number(m.amount) || 0;
                if (m.type === 'CASH') cashOut += amt;
                if (m.type === 'TRANSFER') transferOut += amt;
            });

            // Acumulamos por categoría usando el amount global del gasto
            const expenseAmt = Number(expense.amount) || 0;
            switch (expense.category) {
                case 'SUPPLIER': categories.supplierOut += expenseAmt; break;
                case 'SALARY': categories.salaryOut += expenseAmt; break;
                case 'SUPPLIES': categories.suppliesOut += expenseAmt; break;
                case 'SERVICES': categories.servicesOut += expenseAmt; break;
                case 'OTHER': categories.otherOut += expenseAmt; break;
            }
        });

        const totalIn = cashIn + transferIn;
        const totalOut = cashOut + transferOut;

        console.log("CASH FLOW STATS CALCULATED:", {
            totalIn, totalOut, netBalance: totalIn - totalOut, availableCash: cashIn - cashOut, availableBank: transferIn - transferOut, categories
        });

        return {
            totalIncome: cashIn + transferIn,
            totalExpense: cashOut + transferOut,
            netBalance: (cashIn + transferIn) - (cashOut + transferOut),
            availableCash: cashIn,
            availableBank: transferIn,
            pendingToCollect: debtOrders.reduce((acc, o) => acc + (o.total - (o.payed || 0)), 0),
            lists: {
                incomes: incomeOrders,
                expenses: expenses,
                debts: debtOrders
            },
            categories
        };
    }, [orders, expenses, customersMap]);

    return {
        isLoading, stats, range, setRange,
        referenceDate, handleNext, handlePrev, resetToToday,
        refetch: fetchData
    };
};