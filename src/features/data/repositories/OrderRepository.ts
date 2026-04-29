import { db } from "../services/FirebaseService"
import { writeBatch, doc, collection, increment } from "firebase/firestore"
import { type OrderModel, } from "../../domain/types/orderTypes"
import type { CustomerTransaction } from "../../domain/types/customersTypes"


export class OrderRepository {
    private readonly ORDER_COLLECTION = "orders";
    private readonly CUSTOMER_TRANSACTIONS = "customers_transactions";
    private readonly CUSTOMERS = "customers";

    async commitOrderWithTransaction(
        order: OrderModel,
        transaction: CustomerTransaction | null
    ): Promise<string | null> {
        try {
            // CAMBIO: Se usa la función writeBatch pasándole la instancia de db
            const batch = writeBatch(db);

            // Referencia para la nueva orden
            const orderRef = doc(collection(db, this.ORDER_COLLECTION));

            batch.set(orderRef, { ...order, docId: orderRef.id }); // Guardamos el docId dentro del documento

            if (transaction) {
                const transRef = doc(collection(db, this.CUSTOMER_TRANSACTIONS));

                if (transaction.clientId) {
                    const customerRef = doc(db, this.CUSTOMERS, transaction.clientId);
                    batch.update(customerRef, {
                        currentBalance: increment(transaction.amount)
                    });
                }

                batch.set(transRef, { ...transaction, orderId: orderRef.id });
            }

            await batch.commit();
            return orderRef.id;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async payOrderWithTransaction(
        order: OrderModel & { docId: string }, // Aseguramos que venga el docId
        transaction: CustomerTransaction | null
    ): Promise<boolean> {
        try {
            const batch = writeBatch(db); // O writeBatch(db) si usas el SDK modular

            // 1. Referencia a la Orden usando su docId (el ID de Firestore)
            const orderRef = doc(collection(db, this.ORDER_COLLECTION), order.docId);

            // Actualizamos la orden
            batch.set(orderRef, order, { merge: true });

            // 2. Si hay transacción y el cliente no es nulo
            if (transaction && transaction.clientId) {
                // Referencia para el nuevo documento de transacción
                const transRef = doc(collection(db, this.CUSTOMER_TRANSACTIONS));

                // Registramos el movimiento
                batch.set(transRef, {
                    ...transaction,
                    createdAt: Date.now()
                });

                // Referencia al cliente para actualizar su saldo
                const customerRef = doc(collection(db, this.CUSTOMERS), transaction.clientId);

                // IMPORTANTE: En Node.js con admin SDK se usa FieldValue.increment
                batch.update(customerRef, {
                    currentBalance: increment(transaction.amount)
                });
            }

            await batch.commit();
            console.log("Pago y saldo actualizados correctamente.");
            return true;
        } catch (error) {
            console.error("Error en payOrderWithTransaction:", error);
            return false;
        }
    }
}

export const orderRepository = new OrderRepository();