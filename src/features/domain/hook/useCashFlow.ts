// src/domain/hook/useCashFlow.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { expenseRepository } from '../../data/repositories/ExpenseRepository';
import { type DateRange } from '../types/salesTypes';
import { startOfDay, endOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { type OrderModel, type PaymentMethod, type PaymentType } from '../types/orderTypes';
import { type Expense } from '../types/expenseTypes';

export const useCashflow = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [range, setRange] = useState<DateRange>('today');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const now = new Date();
        let start: Date;
        const end = endOfDay(now);

        // Definición de rangos temporales consistentes con Feli App
        switch (range) {
            case 'today': start = startOfDay(now); break;
            case 'week': start = startOfWeek(now, { weekStartsOn: 1 }); break;
            case 'month': start = startOfMonth(now); break;
            default: start = startOfMonth(now);
        }

        try {
            console.log(`Fetching Cash Flow data for range: ${range} (${start} - ${end})`);
            // Consultas en paralelo para optimizar performance
            const [salesData, expensesData] = await Promise.all([
                salesRepository.getOrdersByDateRange(start.getTime(), end.getTime()),
                expenseRepository.getByRange(start.getTime(), end.getTime())
            ]);

            setOrders(salesData);
            setExpenses(expensesData);
        } catch (error) {
            console.error("Error consolidando Cash Flow:", error);
        } finally {
            setIsLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        // Permitimos que calcule aunque una de las dos listas esté vacía
        if (orders.length === 0 && expenses.length === 0) return null;

        let cashIn = 0;
        let transferIn = 0;
        let cashOut = 0;
        let transferOut = 0;

        // Totales por categoría inicializados en 0
        const categories = {
            supplierOut: 0,
            salaryOut: 0,
            suppliesOut: 0,
            servicesOut: 0,
            otherOut: 0
        };

        // 1. Cálculo de INGRESOS (Ventas)
        orders.forEach(order => {
            // Normalización defensiva para paymentMethod
            const methods = Array.isArray(order.paymentMethod) ? order.paymentMethod : [];
            methods.forEach((m: PaymentMethod) => {
                if (m.type === "CASH") cashIn += m.amount;
                if (m.type === "TRANSFER") transferIn += m.amount;
            });
        });

        // 2. Cálculo de EGRESOS (Gastos) - Un solo bucle para todo
        expenses.forEach(expense => {
            // NORMALIZACIÓN CRÍTICA: Manejamos Array o String (Legacy)
            const methods: PaymentMethod[] = Array.isArray(expense.paymentMethod)
                ? expense.paymentMethod
                : (typeof expense.paymentMethod === 'string')
                    ? [{ type: expense.paymentMethod as PaymentType, amount: expense.amount || 0 }]
                    : [];

            methods.forEach((m: PaymentMethod) => {
                const amt = Number(m.amount) || 0;
                if (m.type === 'CASH') cashOut += amt;
                if (m.type === 'TRANSFER') transferOut += amt;
            });

            // Acumulamos por categoría usando el amount global del gasto
            const expenseAmt = Number(expense.amount) || 0;
            switch (expense.category) {
                case 'SUPPLIER': categories.supplierOut += expenseAmt; break;
                case 'SALARY':   categories.salaryOut += expenseAmt; break;
                case 'SUPPLIES': categories.suppliesOut += expenseAmt; break;
                case 'SERVICES': categories.servicesOut += expenseAmt; break;
                case 'OTHER':    categories.otherOut += expenseAmt; break;
            }
        });

        const totalIn = cashIn + transferIn;
        const totalOut = cashOut + transferOut;

        console.log("CASH FLOW STATS CALCULATED:", {
            totalIn, totalOut, netBalance: totalIn - totalOut, availableCash: cashIn - cashOut, availableBank: transferIn - transferOut, categories
        });

        return {
            totalIncome: totalIn,
            totalExpense: totalOut,
            // CÁLCULO NETO: Ingreso real cobrado menos Egreso real pagado
            netBalance: totalIn - totalOut, 
            availableCash: cashIn /* - cashOut */,
            availableBank: transferIn /* - transferOut */,
            byCategory: categories,
            pendingToCollect: orders.reduce((acc, o) => acc + (o.total - (o.payed || 0)), 0)
        };
    }, [orders, expenses]);

    return { isLoading, stats, range, setRange, refetch: fetchData };
};