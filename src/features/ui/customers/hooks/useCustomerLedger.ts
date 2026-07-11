import { useState, useCallback } from 'react';
import { salesRepository } from '../../../data/repositories/SalesRepository';
import { type OrderModel } from '../../../domain/types/orderTypes';
import { type Customer } from '../../../domain/types/customersTypes';

export const useCustomerLedger = () => {
    /**
     * Hook para gestionar el historial de un cliente específico.
     */
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerOrders, setOrders] = useState<OrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const selectCustomer = useCallback(async (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsLoading(true);
        try {
            const orders = await salesRepository.getOrdersByCustomerId(customer.id!);
            setOrders(orders);
        } catch (error) {
            console.error("Error cargando historial:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearSelection = () => {
        setSelectedCustomer(null);
        setOrders([]);
    };

    return { selectedCustomer, customerOrders, isLoading, selectCustomer, clearSelection };
};