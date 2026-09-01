import {
    collection,
    doc,
    getDocs,
    increment,
    query,
    runTransaction,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../services/FirebaseService';
import type { Product } from '../../domain/types/productTypes';
import type { Purchase } from '../../domain/types/purchaseTypes';
import type { Supplier } from '../../domain/types/supplierTypes';
import type { PaymentMethod } from '../../domain/types/orderTypes';

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

            const costChanged = Number(originalProduct.cost || 0) !== Number(item.unitCost || 0);
            if (costChanged) {
                // productUpdates.previousCost = originalProduct.cost || 0;
                // productUpdates.suggestedPrice = Number((item.unitCost * (1 + (originalProduct.gains || 0) / 100)).toFixed(2));
                // productUpdates.pricingReviewPending = true;
                // productUpdates.costUpdatedAt = Date.now();
                productUpdates.cost = item.unitCost;
            }

            if (item.unitsPerBulk) {
                productUpdates.unitsPerBulk = item.unitsPerBulk;
            }

            if (item.purchaseType === 'BULK' && item.bulkCost) {
                productUpdates.bulkCost = item.bulkCost;
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
                note: `Compra ${purchase.docId} - proveedor ${supplier.name}`,
            });
        }

        await batch.commit();
    },

    async registerPayment(
        purchaseId: string,
        supplierId: string,
        amount: number,
        paymentMethod: PaymentMethod[]
    ): Promise<void> {
        const normalizedMethods = paymentMethod.filter((method) => method.amount > 0);
        const paymentAmount = normalizedMethods.reduce((sum, method) => sum + method.amount, 0);
        if (paymentAmount <= 0 || amount !== paymentAmount) {
            throw new Error('El importe y los medios de pago no coinciden.');
        }

        await runTransaction(db, async (transaction) => {
            const purchaseRef = doc(db, 'purchases', purchaseId);
            const supplierRef = doc(db, 'suppliers', supplierId);
            const expenseRef = doc(collection(db, 'expenses'));
            const purchaseSnapshot = await transaction.get(purchaseRef);
            const supplierSnapshot = await transaction.get(supplierRef);

            if (!purchaseSnapshot.exists()) throw new Error('Compra no encontrada.');
            if (!supplierSnapshot.exists()) throw new Error('Proveedor no encontrado.');

            const purchase = purchaseSnapshot.data() as Purchase;
            const currentDebt = Number(purchase.debt ?? purchase.total - purchase.payed);
            if (purchase.supplierId !== supplierId) throw new Error('La compra no pertenece a este proveedor.');
            if (purchase.payStatus === 'PAID' || currentDebt <= 0) throw new Error('La compra ya está pagada.');
            if (paymentAmount > currentDebt) throw new Error('El pago supera el saldo de la compra.');

            const currentSupplierBalance = Number(supplierSnapshot.data().currentBalance || 0);
            if (paymentAmount > currentSupplierBalance) throw new Error('El pago supera el saldo del proveedor.');

            const newPayed = Number(purchase.payed || 0) + paymentAmount;
            const newDebt = Number((purchase.total - newPayed).toFixed(2));
            const previousMethods = purchase.paymentMethod || [];

            transaction.update(purchaseRef, {
                payed: newPayed,
                debt: newDebt,
                payStatus: newDebt === 0 ? 'PAID' : 'PENDING',
                paymentMethod: [...previousMethods, ...normalizedMethods],
            });
            transaction.update(supplierRef, {
                currentBalance: Number((currentSupplierBalance - paymentAmount).toFixed(2)),
            });
            transaction.set(expenseRef, {
                category: 'SUPPLIER',
                amount: paymentAmount,
                paymentMethod: normalizedMethods,
                createdAt: Date.now(),
                note: `Pago de compra ${purchaseId}`,
                purchaseId,
            });
        });
    },
};
