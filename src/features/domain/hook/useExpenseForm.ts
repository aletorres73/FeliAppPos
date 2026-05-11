// src/features/expenses/hooks/useExpenseForm.ts
import { useState } from 'react';
import { expenseRepository } from '../../data/repositories/ExpenseRepository';
import type { Expense } from '../../domain/types/expenseTypes';

export const useExpenseForm = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        category: 'OTHER',
        amount: 0,
        paymentMethod: 'CASH',
        createdAt: Date.now(),
        note: ''
    });

    const saveExpense = async () => {
        if (formData.amount <= 0) {
            alert("El monto debe ser mayor a 0");
            return;
        }
        setIsLoading(true);
        try {
            await expenseRepository.save(formData);
            onSuccess?.();
        } catch (error) {
            console.error("Error al guardar egreso:", error);
            alert("Error al registrar el gasto");
        } finally {
            setIsLoading(false);
        }
    };

    return { formData, setFormData, saveExpense, isLoading };
};