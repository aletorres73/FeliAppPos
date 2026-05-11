import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { type OrderModel } from '../../domain/types/orderTypes';
import { type DateRange } from '../../domain/types/salesTypes';
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
    // FECHA DE REFERENCIA: El "pivote" para movernos entre periodos
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
            console.log(`Cargando ventas desde ${startDate} hasta ${endDate}...`);
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

    // Se dispara cuando cambia el rango O la fecha de referencia
    useEffect(() => {
        fetchSales(range, referenceDate);
    }, [range, referenceDate, fetchSales]);

    // Handlers para la UI
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

    // --- Lógica de Stats (Se mantiene igual, optimizada con useMemo) ---
    const stats = useMemo(() => {
        if (orders.length === 0) return null;
        let periodTotal = 0;
        let periodCash = 0;
        let periodTransfer = 0;
        let pendingCollect = 0;
        const productMap: Record<string, any> = {};

        orders.forEach((order) => {
            // console.log("Procesando orden:", order);
            periodTotal += order.total;
            pendingCollect += (order.total - (order.payed || 0));
            /*  if (order.paymentMethod.type === "CASH") periodCash += (order.payed || 0);
             if (order.paymentMethod.type === "TRANSFER") periodTransfer += (order.payed || 0); */
            // Nueva lógica para procesar el array de métodos de pago
            console.log("Procesando métodos de pago para orden:", order.docId, order.paymentMethod);
            if (Array.isArray(order.paymentMethod)) {
                order.paymentMethod.forEach(method => {
                    if (method.type === "CASH") periodCash += method.amount;
                    if (method.type === "TRANSFER") periodTransfer += method.amount;
                });
            }
            else{

            }

            order.items.forEach((item) => {
                if (!productMap[item.productId]) {
                    productMap[item.productId] = { branch: item.branch, article: item.article, quantity: 0, total: 0 };
                }
                productMap[item.productId].quantity += item.quantity;
                productMap[item.productId].total += item.subtotal;
            });
        });

        const sortedProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);

        return {
            periodTotal, periodCash, periodTransfer, pendingCollect,
            topProducts: sortedProducts.slice(0, 10),
            bottomProducts: sortedProducts.filter(p => p.quantity > 0).reverse().slice(0, 10)
        };
    }, [orders]);

    return {
        stats, isLoading, range, setRange,
        referenceDate, handleNext, handlePrev, resetToToday
    };
};