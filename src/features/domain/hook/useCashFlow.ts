// src/domain/hook/useCashFlow.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { expenseRepository } from '../../data/repositories/ExpenseRepository';
import { type DateRange } from '../types/salesTypes';
import { startOfDay, endOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { type OrderModel, type PaymentMethod } from '../types/orderTypes';
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
        if (orders.length === 0 && expenses.length === 0) return null;

        // 1. Cálculo de Ingresos Reales (solo lo efectivamente cobrado)
        let cashIn = 0;
        let transferIn = 0;

        orders.forEach(order => {
            order.paymentMethod?.forEach((method: PaymentMethod) => {
                if (method.type === "CASH") cashIn += method.amount;
                if (method.type === "TRANSFER") transferIn += method.amount;
            });
        });

        // 2. Cálculo de Egresos por Categoría
        const cashOut = expenses.filter(e => e.paymentMethod === 'CASH')
                                .reduce((acc, e) => acc + e.amount, 0);
        const transferOut = expenses.filter(e => e.paymentMethod === 'TRANSFER')
                                    .reduce((acc, e) => acc + e.amount, 0);

        const supplierOut = expenses.filter(e => e.category === 'SUPPLIER')
                                    .reduce((acc, e) => acc + e.amount, 0);
        const salaryOut = expenses.filter(e => e.category === 'SALARY')
                                    .reduce((acc, e) => acc + e.amount, 0);

        return {
            totalIncome: cashIn + transferIn,
            totalExpense: cashOut + transferOut,
            netBalance: (cashIn + transferIn) - (cashOut + transferOut),
            availableCash: cashIn - cashOut,
            availableBank: transferIn - transferOut,
            byCategory: { supplierOut, salaryOut },
            pendingToCollect: orders.reduce((acc, o) => acc + (o.total - (o.payed || 0)), 0)
        };
    }, [orders, expenses]);

    return { isLoading, stats, range, setRange, refetch: fetchData };
};