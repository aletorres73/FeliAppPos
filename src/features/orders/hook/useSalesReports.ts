import { useState, useEffect, useMemo } from 'react';
import { salesRepository } from '../../data/repositories/SalesRepository';
import { type OrderModel } from '../../orders/types/orderTypes';

export const useSalesReports = () => {
    // 1. ESTADO: Guardamos la "data cruda" y el estado de carga
    const [orders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 2. ACCIÓN: Ir a buscar los datos al repositorio
    const fetchMonthSales = async () => {
        setIsLoading(true);
        try {
            const data = await salesRepository.getCurrentMonthOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. EFECTO: Disparar la carga apenas se abre la pestaña de reportes
    useEffect(() => {
        fetchMonthSales();
    }, []);

    // 4. LÓGICA DE PROCESAMIENTO (El "Cerebro" del hook)
    // Usamos useMemo para que no recalcule todo cada vez que el componente se renderiza,
    // solo lo hará si el array 'orders' cambia.
    const stats = useMemo(() => {
        if (orders.length === 0) return null;

        // Variables temporales para acumular valores
        let periodTotal = 0;
        let periodCash = 0;
        let periodTransfer = 0;
        let pendingCollect = 0;

        // Mapa para agrupar ventas por producto (clave = productId)
        const productMap: Record<string, { branch: string, article: string; quantity: number; total: number }> = {};

        // Recorremos las órdenes UNA sola vez (O(n))
        orders.forEach((order) => {
            periodTotal += order.total;
            console.log("Procesando orden", order.docId, "con total", order.total, "y pagado", order.payed);
            pendingCollect += (order.total - (order.payed || 0));

            // Clasificamos por método de pago
            if (order.paymentMethod === "CASH") periodCash += order.payed;
            if (order.paymentMethod === "TRANSFER") periodTransfer += order.payed;

            // Desglosamos los productos dentro de la orden
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

        // Convertimos el mapa a una lista para poder ordenarla
        const sortedProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
        console.log("Productos ordenados por cantidad vendida:", sortedProducts);

        return {
            periodTotal,
            periodCash,
            periodTransfer,
            pendingCollect,
            topProducts: sortedProducts.slice(0, 10), // Los 10 más vendidos
            bottomProducts: sortedProducts.filter(p => p.quantity > 0).reverse().slice(0, 10) // Los 10 menos vendidos
        };
    }, [orders]);

    // 5. RETORNO: Lo que usará tu componente SalesDashboard
    return { 
        orders,      // Las 900 órdenes por si necesitas listar algo
        stats,       // Los cálculos listos para mostrar en tarjetas (KPIs)
        isLoading,   // Para mostrar un spinner mientras Firebase responde
        refetch: fetchMonthSales // Por si quieres un botón de "Actualizar"
    };
};