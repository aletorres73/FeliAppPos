// src/domain/types/expenseTypes.ts
export type ExpenseCategory = 'SUPPLIER' | 'SUPPLIES' | 'SALARY' | 'SERVICES' | 'OTHER';

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    paymentMethod: 'CASH' | 'TRANSFER';
    createdAt: number; // Timestamp en ms
    note: string;
}