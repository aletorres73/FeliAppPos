import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { type OrderModel } from '../../orders/types/orderTypes';
import { startOfDay, startOfMonth, subDays } from 'date-fns';

// Solución al error: "Cannot find name 'DateRange'"
export type DateRange = 'today' | 'week' | 'month' | 'custom';

export const useSalesReports = () => {
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState<DateRange>('today');

    // Usamos useCallback para que la función no se recree en cada render
    const fetchSales = useCallback(async (selectedRange: DateRange) => {
        setIsLoading(true);
        let startDate: Date;
        const endDate = new Date(); 

        switch (selectedRange) {
            case 'today':
                startDate = startOfDay(new Date());
                break;
            case 'week':
                startDate = subDays(new Date(), 7);
                break;
            case 'month':
            default:
                startDate = startOfMonth(new Date());
                break;
        }

        try {
            const data = await salesRepository.getOrdersByDateRange(startDate.getTime(), endDate.getTime());
            setOrders(data);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependencias vacías para que sea estable

    useEffect(() => {
        fetchSales(range);
    }, [range, fetchSales]);

    const stats = useMemo(() => {
        if (orders.length === 0) return null;

        let periodTotal = 0;
        let periodCash = 0;
        let periodTransfer = 0;
        let pendingCollect = 0;

        const productMap: Record<string, { branch: string, article: string; quantity: number; total: number }> = {};

        orders.forEach((order) => {
            periodTotal += order.total;
            pendingCollect += (order.total - (order.payed || 0));
            console.log(`Order ${order.docId}: total=${order.total}, payed=${order.payed}, pending=${order.total - (order.payed || 0)}`);

            if (order.paymentMethod === "CASH") periodCash += (order.payed || 0);
            if (order.paymentMethod === "TRANSFER") periodTransfer += (order.payed || 0);

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
        console.log("Ordenes: ", orders);
        console.log("Stats calculados: ", { periodTotal, periodCash, periodTransfer, pendingCollect });
        console.log("Productos acumulados: ", productMap);

        const sortedProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);

        return {
            periodTotal,
            periodCash,
            periodTransfer,
            pendingCollect,
            topProducts: sortedProducts.slice(0, 10),
            bottomProducts: sortedProducts.filter(p => p.quantity > 0).reverse().slice(0, 10)
        };
    }, [orders]);

    return {
        stats,
        isLoading,
        range,
        setRange,
        refetch: () => fetchSales(range)
    };
};