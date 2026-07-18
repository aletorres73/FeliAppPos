import { db } from "../services/FirebaseService"
import { writeBatch, doc, collection, increment } from "firebase/firestore"
import { type OrderModel, } from "../../domain/types/orderTypes"
import type { CustomerTransaction } from "../../domain/types/customersTypes"


export class OrderRepository {
    private readonly ORDER_COLLECTION = "orders";
    // private readonly CUSTOMER_TRANSACTIONS = "customers_transactions";
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

            // if (transaction?.clientId) {

            //     const transRef = doc(collection(db, this.CUSTOMER_TRANSACTIONS));

            //     batch.set(transRef, { ...transaction, orderId: orderRef.id });

                if (transaction?.clientId != null) { // si cliente es null no se actualiza el saldo pero se guarda la transacción

                    const customerRef = doc(db, this.CUSTOMERS, transaction.clientId);

                    batch.update(customerRef, {
                        currentBalance: increment(transaction.debt)
                    });
                }
            // }
            await batch.commit();
            return orderRef.id;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

export const orderRepository = new OrderRepository();