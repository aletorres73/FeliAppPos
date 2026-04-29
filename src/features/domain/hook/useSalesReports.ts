import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { type OrderModel } from '../../domain/types/orderTypes';
import { startOfDay, startOfMonth, startOfWeek } from 'date-fns';

// Solución al error: "Cannot find name 'DateRange'"
export type DateRange = 'today' | 'week' | 'month' | 'custom';

export const useSalesReports = () => {
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState<DateRange>('today');

    // Usamos useCallback para que la función no se recree en cada render
    const fetchSales = useCallback(async (selectedRange: DateRange) => {
        setIsLoading(true);
        const now = new Date();
        let startDate: Date;
        const endDate = now; // Hasta el momento actual

        switch (selectedRange) {
            case 'today':
                startDate = startOfDay(now);
                break;
            case 'week':
                // startOfWeek por defecto usa el domingo (0). 
                // Pasamos { weekStartsOn: 1 } para que sea Lunes.
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'month':
                startDate = startOfMonth(now);
                break;
            default:
                startDate = startOfMonth(now);
                break;
        }

        try {
            // Mantenemos la lógica de repositorio con Timestamps
            console.log("Rango de fechas:", startDate, endDate)
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