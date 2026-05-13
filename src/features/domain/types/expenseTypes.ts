import type { PaymentMethod } from "./orderTypes";

// src/domain/types/expenseTypes.ts
export type ExpenseCategory = 'SUPPLIER' | 'SUPPLIES' | 'SALARY' | 'SERVICES' | 'OTHER';

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    paymentMethod: PaymentMethod[];
    createdAt: number; // Timestamp en ms
    note: string;
}