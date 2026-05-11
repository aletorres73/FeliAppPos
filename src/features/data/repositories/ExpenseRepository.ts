// src/data/repositories/ExpenseRepository.ts
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    // Timestamp 
} from "firebase/firestore";
import { db } from "../services/FirebaseService"; 
import { type Expense } from "../../domain/types/expenseTypes";

class ExpenseRepository {
    private collectionName = "expenses";

    // Guardar un nuevo egreso
    async save(expense: Omit<Expense, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...expense,
            createdAt: expense.createdAt || Date.now()
        });
        return docRef.id;
    }

    // Obtener gastos por rango de fecha para el Cash Flow
    async getByRange(startDate: number, endDate: number): Promise<Expense[]> {
        const q = query(
            collection(db, this.collectionName),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Expense[];
    }
}

export const expenseRepository = new ExpenseRepository();