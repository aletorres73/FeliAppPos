import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../../data/repositories/SalesRepository';
import { type OrderModel } from '../../../domain/types/orderTypes';
import { type DateRange } from '../../../domain/types/salesTypes';
import {
    startOfDay, endOfDay,
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
    addDays, subDays,
    addWeeks, subWeeks,
    addMonths, subMonths
} from 'date-fns';

export const useSalesReports = () => {
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState<DateRange>('today');
    const [referenceDate, setReferenceDate] = useState(new Date());

    const fetchSales = useCallback(async (selectedRange: DateRange, refDate: Date) => {
        setIsLoading(true);
        let startDate: Date;
        let endDate: Date;

        switch (selectedRange) {
            case 'today':
                startDate = startOfDay(refDate);
                endDate = endOfDay(refDate);
                break;
            case 'week':
                startDate = startOfWeek(refDate, { weekStartsOn: 1 });
                endDate = endOfWeek(refDate, { weekStartsOn: 1 });
                break;
            case 'month':
                startDate = startOfMonth(refDate);
                endDate = endOfMonth(refDate);
                break;
            default:
                startDate = startOfDay(refDate);
                endDate = endOfDay(refDate);
        }

        try {
            const data = await salesRepository.getOrdersByDateRange(
                startDate.getTime(),
                endDate.getTime()
            );
            setOrders(data);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales(range, referenceDate);
    }, [range, referenceDate, fetchSales]);

    const stats = useMemo(() => {
        if (orders.length === 0) return null;
        let periodTotal = 0;
        let periodCash = 0;
        let periodTransfer = 0;
        let pendingCollect = 0;
        const productMap: Record<string, any> = {};

        orders.forEach((order) => {
            pendingCollect += (order.total - (order.payed || 0));

            if (Array.isArray(order.paymentMethod)) {
                order.paymentMethod.forEach(method => {
                    if (method.type === "CASH") periodCash += method.amount;
                    if (method.type === "TRANSFER") periodTransfer += method.amount;
                });
            }

            order.items.forEach((item) => {
                if (!productMap[item.productId]) {
                    productMap[item.productId] = {
                        branch: item.branch,
                        article: item.article,
                        quantity: 0,
                        total: 0
                    };
                }
                productMap[item.productId].quantity += item.quantity;
                productMap[item.productId].total += item.subtotal;
            });
        });

        periodTotal += periodCash + periodTransfer + pendingCollect;

        let totalRevenue = 0;
        const allProducts = Object.values(productMap);

        // 1. Calcular el ingreso total general
        allProducts.forEach(p => totalRevenue += p.total);

        // 2. Ordenar de mayor a menor para aplicar Pareto
        const sortedProducts = [...allProducts].sort((a, b) => b.total - a.total);

        // 3. Identificar los productos que suman el 80%
        let runningTotal = 0;
        const productsWithPareto = sortedProducts.map(p => {
            runningTotal += p.total;
            return {
                ...p,
                isPareto: (runningTotal / totalRevenue) <= 0.80 // true si es parte del 80% superior
            };
        });

        return {
            periodTotal, periodCash, periodTransfer, pendingCollect,
            products: productsWithPareto
        };
    }, [orders]);

    return {
        stats, isLoading, range, setRange,
        referenceDate, handleNext: () => {
            if (range === 'today') setReferenceDate(d => addDays(d, 1));
            if (range === 'week') setReferenceDate(d => addWeeks(d, 1));
            if (range === 'month') setReferenceDate(d => addMonths(d, 1));
        }, handlePrev: () => {
            if (range === 'today') setReferenceDate(d => subDays(d, 1));
            if (range === 'week') setReferenceDate(d => subWeeks(d, 1));
            if (range === 'month') setReferenceDate(d => subMonths(d, 1));
        }, resetToToday: () => setReferenceDate(new Date())
    };
};