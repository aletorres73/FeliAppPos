import {
    collection,
    doc,
    getDocs,
    getDoc,
    runTransaction,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../services/FirebaseService';
import type { Supplier } from '../../domain/types/supplierTypes';

const supplierCollection = collection(db, 'suppliers');

export const supplierRepository = {
    async getAll(): Promise<Supplier[]> {
        const snapshot = await getDocs(supplierCollection);
        return snapshot.docs.map((supplierDoc) => ({
            id: supplierDoc.id,
            ...supplierDoc.data(),
        })) as Supplier[];
    },

    async save(supplier: Omit<Supplier, 'id'>): Promise<string> {
        const supplierRef = doc(supplierCollection);
        await setDoc(supplierRef, supplier);
        return supplierRef.id;
    },

    async update(id: string, data: Partial<Omit<Supplier, 'id'>>): Promise<void> {
        await updateDoc(doc(db, 'suppliers', id), data);
    },

    async registerPayment(id: string, name: string, amount: number): Promise<void> {
        if (amount <= 0) throw new Error('El pago debe ser mayor a cero.');

        await runTransaction(db, async (transaction) => {
            const supplierRef = doc(db, 'suppliers', id);
            const expenseRef = doc(collection(db, 'expenses'));
            const supplierSnapshot = await transaction.get(supplierRef);
            if (!supplierSnapshot.exists()) throw new Error('Proveedor no encontrado.');

            const currentBalance = Number(supplierSnapshot.data().currentBalance || 0);
            const appliedAmount = Math.min(amount, currentBalance);
            transaction.update(supplierRef, { currentBalance: Math.max(0, currentBalance - appliedAmount) });
            transaction.set(expenseRef, {
                category: 'SUPPLIER',
                amount: appliedAmount,
                paymentMethod: [],
                createdAt: Date.now(),
                note: `Pago de deuda al proveedor ${name}`,
            });
        });
    },

    async getById(id: string): Promise<Supplier | null> {
        const snapshot = await getDoc(doc(db, 'suppliers', id));
        return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Supplier) : null;
    },
};
