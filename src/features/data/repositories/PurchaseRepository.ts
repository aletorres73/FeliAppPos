import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    query,
    runTransaction,
    setDoc,
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
            .map((purchaseDoc) => {
                const data = purchaseDoc.data() as Purchase;
                return {
                    ...data,
                    docId: purchaseDoc.id,
                    status: data.status || 'RECEIVED', // Por compatibilidad con compras anteriores
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);
    },

    async saveDraft({ purchase }: { purchase: Purchase }): Promise<void> {
        if (!purchase.items.length) throw new Error('El pedido no tiene artículos.');
        const batch = writeBatch(db);
        const purchaseRef = doc(db, 'purchases', purchase.docId);

        const draftData: Purchase = {
            ...purchase,
            status: 'DRAFT',
            payStatus: 'PENDING',
            payed: 0,
            debt: purchase.total,
            paymentMethod: null,
            receivedAt: null,
        };

        batch.set(purchaseRef, draftData);
        await batch.commit();
    },

    async updateDraft({ purchase }: { purchase: Purchase }): Promise<void> {
        const purchaseRef = doc(db, 'purchases', purchase.docId);
        await setDoc(purchaseRef, {
            ...purchase,
            status: 'DRAFT',
            debt: purchase.total,
            payed: 0,
        }, { merge: true });
    },

    async deleteDraft(purchaseId: string): Promise<void> {
        const purchaseRef = doc(db, 'purchases', purchaseId);
        await deleteDoc(purchaseRef);
    },

    async receiveOrder({ purchase, supplier, products }: PurchaseConfirmation): Promise<void> {
        if (!purchase.items.length) throw new Error('La compra no tiene artículos.');
        if (purchase.payed < 0 || purchase.payed > purchase.total) throw new Error('El pago no es válido.');

        const batch = writeBatch(db);
        const purchaseRef = doc(db, 'purchases', purchase.docId);
        const supplierRef = doc(db, 'suppliers', supplier.id);
        const expenseRef = purchase.payed > 0 ? doc(collection(db, 'expenses')) : null;

        const receivedPurchase: Purchase = {
            ...purchase,
            status: 'RECEIVED',
            receivedAt: Date.now(),
        };

        batch.set(purchaseRef, receivedPurchase);
        if (purchase.debt > 0) {
            batch.update(supplierRef, {
                currentBalance: Number(supplier.currentBalance || 0) + purchase.debt,
            });
        }

        for (const item of purchase.items) {
            const originalProduct = products.find((p) => p.id === item.productId);
            if (!originalProduct) continue;

            const productUpdates: Record<string, unknown> = {
                costo: item.unitCost,
                cost: item.unitCost,
                updatedAt: Date.now(),
                lastSupplierId: purchase.supplierId,
            };

            if (item.unitsPerBulk) {
                productUpdates.unitsPerBulk = item.unitsPerBulk;
            }

            if (item.purchaseType === 'BULK' && item.bulkCost) {
                productUpdates.bulkCost = item.bulkCost;
            }

            if (originalProduct.saleWeight) {
                productUpdates.peso = increment(item.quantity);
            } else {
                productUpdates.stock = increment(item.quantity);
            }

            batch.update(doc(db, 'products', item.productId), productUpdates);
        }

        if (expenseRef) {
            batch.set(expenseRef, {
                category: 'SUPPLIER',
                amount: purchase.payed,
                paymentMethod: purchase.paymentMethod || [],
                createdAt: Date.now(),
                note: `Compra ${purchase.docId} - proveedor ${supplier.name}`,
            });
        }

        await batch.commit();
    },

    async confirm({ purchase, supplier, products }: PurchaseConfirmation): Promise<void> {
        if (!purchase.items.length) throw new Error('La compra no tiene artículos.');
        if (purchase.payed < 0 || purchase.payed > purchase.total) throw new Error('El pago no es válido.');

        const batch = writeBatch(db);
        const purchaseRef = doc(db, 'purchases', purchase.docId);
        const supplierRef = doc(db, 'suppliers', supplier.id);
        const expenseRef = purchase.payed > 0 ? doc(collection(db, 'expenses')) : null;

        const fullPurchase: Purchase = {
            ...purchase,
            status: 'RECEIVED',
            receivedAt: purchase.createdAt || Date.now(),
        };

        batch.set(purchaseRef, fullPurchase);
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
                cost: item.unitCost,
                updatedAt: Date.now(),
                lastSupplierId: purchase.supplierId, // Usamos el proveedor de la compra
            };

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
