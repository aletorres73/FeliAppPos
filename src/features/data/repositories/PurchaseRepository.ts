import {
    collection,
    doc,
    getDocs,
    increment,
    query,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../services/FirebaseService';
import type { Product } from '../../domain/types/productTypes';
import type { Purchase } from '../../domain/types/purchaseTypes';
import type { Supplier } from '../../domain/types/supplierTypes';

export interface PurchaseConfirmation {
    purchase: Purchase;
    supplier: Supplier;
    products: Product[];
}

export const purchaseRepository = {
    async getBySupplier(supplierId: string): Promise<Purchase[]> {
        const snapshot = await getDocs(query(collection(db, 'purchases'), where('supplierId', '==', supplierId)));
        return snapshot.docs
            .map((purchaseDoc) => ({ docId: purchaseDoc.id, ...purchaseDoc.data() }) as Purchase)
            .sort((a, b) => b.createdAt - a.createdAt);
    },

    async confirm({ purchase, supplier, products }: PurchaseConfirmation): Promise<void> {
        if (!purchase.items.length) throw new Error('La compra no tiene artículos.');
        if (purchase.payed < 0 || purchase.payed > purchase.total) throw new Error('El pago no es válido.');

        const batch = writeBatch(db);
        const purchaseRef = doc(db, 'purchases', purchase.docId);
        const supplierRef = doc(db, 'suppliers', supplier.id);
        const expenseRef = purchase.payed > 0 ? doc(collection(db, 'expenses')) : null;

        batch.set(purchaseRef, purchase);
        if (purchase.debt > 0) {
            batch.update(supplierRef, {
                currentBalance: Number(supplier.currentBalance || 0) + purchase.debt,
            });
        }

        // Dentro de tu función confirm() en el repositorio:
        for (const item of purchase.items) {
            const originalProduct = products.find((p) => p.id === item.productId);
            if (!originalProduct) continue;

            // Preparamos SOLO los campos que queremos actualizar
            const productUpdates: Record<string, unknown> = {
                costo: item.unitCost,
                updatedAt: Date.now(),
                lastSupplierId: purchase.supplierId, // Usamos el proveedor de la compra
            };

            if (item.unitsPerBulk) {
                productUpdates.unitsPerBulk = item.unitsPerBulk;
            }

            // Usamos increment() para que sea 100% seguro contra ventas simultáneas
            if (originalProduct.saleWeight) {
                productUpdates.peso = increment(item.quantity);
            } else {
                productUpdates.stock = increment(item.quantity);
            }

            // Actualizamos solo esa porción del documento
            batch.update(doc(db, 'products', item.productId), productUpdates);
        }

        if (expenseRef) {
            batch.set(expenseRef, {
                category: 'SUPPLIER',
                amount: purchase.payed,
                paymentMethod: purchase.paymentMethod || [],
                createdAt: purchase.createdAt,
                note: `Compra ${purchase.docId}`,
            });
        }

        await batch.commit();
    },
};
