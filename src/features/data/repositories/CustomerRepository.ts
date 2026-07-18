import {
  doc,
  collection,
  runTransaction,
  getDocs,
  query,
  where,
  setDoc,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../services/FirebaseService"
import type { Customer } from "../../domain/types/customersTypes";
import { AnonymousCustomer } from "../../domain/types/customersTypes";
import type { OrderPayStatus, PaymentMethod } from "../../domain/types/orderTypes";

class CustomerRepository {
  private readonly CUSTOMER_COLLECTION = "customers";
  private readonly COUNTERS = "counters";

  /**
   * Mapea un snapshot de Firestore al objeto de dominio Customer
   */
  private toDomain(snapshot: DocumentSnapshot): Customer {
    if (!snapshot.exists()) return AnonymousCustomer;
    return snapshot.data() as Customer;
  }

  /**
   * Guarda un cliente con ID autoincremental usando una transacción
   */
  async saveClient(customer: Omit<Customer, "id">): Promise<string> {
    const metadataRef = doc(db, this.COUNTERS, "COUNTER_ID");
    const customersCol = collection(db, this.CUSTOMER_COLLECTION);

    try {
      const newId = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(metadataRef);

        // Si el documento no existe, el lastId es 0
        const lastId = counterDoc.exists() ? (counterDoc.data().last_id || 0) : 0;
        const nextId = lastId + 1;
        const nextIdStr = nextId.toString();

        const newDocRef = doc(customersCol, nextIdStr);
        const customerWithId: Customer = {
          ...customer,
          id: nextIdStr
        };

        // 1. Guardamos el cliente
        transaction.set(newDocRef, customerWithId);

        // 2. Actualizamos el contador (usamos set con merge para que se cree si no existe)
        transaction.set(metadataRef, { last_id: nextId }, { merge: true });

        return nextIdStr;
      });

      console.info(`CustomerRepository --- Cliente guardado con ID: ${newId}`);
      return newId;
    } catch (e) {
      console.error("Error en saveClient:", e);
      // Aquí podrías integrar Sentry o tu servicio de logs similar a Crashlytics
      return "";
    }
  }

  /**
   * Obtiene todos los clientes
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.CUSTOMER_COLLECTION));
      const customers = querySnapshot.docs.map(doc => this.toDomain(doc));
      console.info(`CustomerRepository --- Clientes obtenidos: ${customers.length}`);
      return customers;
    } catch (e) {
      console.error("Error al obtener clientes:", e);
      return [];
    }
  }

  /**
   * Actualiza un cliente buscando por su campo 'id'
   */
  async updateCustomer(customer: Customer): Promise<void> {
    try {
      // 1. Buscamos el documento donde el campo 'id' coincida
      const q = query(
        collection(db, this.CUSTOMER_COLLECTION),
        where("id", "==", customer.id)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 2. Obtenemos la referencia del primer resultado
        const docRef = querySnapshot.docs[0].ref;

        // 3. Actualizamos con merge
        await setDoc(docRef, customer, { merge: true });
        console.info(`Cliente ${customer.id} actualizado con éxito`);
      } else {
        console.warn(`No se encontró el cliente con ID: ${customer.id}`);
      }
    } catch (e) {
      console.error("Error en updateCustomer:", e);
    }
  }

  async getById(id: string): Promise<Customer> {
    try {
      const q = query(
        collection(db, this.CUSTOMER_COLLECTION),
        where("id", "==", id)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Customer;
      } else {
        console.warn(`No se encontró el cliente con ID: ${id}`);
        return AnonymousCustomer;
      }
    } catch (e) {
      console.error(`Error al obtener cliente por ID (${id}):`, e);
      return AnonymousCustomer;
    }
  }


  async registerOrderPayment(
    customerId: string,
    orderId: string,
    amount: number,
    status: OrderPayStatus,
    paymentMethod: PaymentMethod[]
  ): Promise<boolean> {
    try {
      await runTransaction(db, async (transaction) => {
        const customerRef = doc(db, "customers", customerId);
        const orderRef = doc(db, "orders", orderId);
        const transRef = doc(collection(db, "customers_transactions"));

        const customerDoc = await transaction.get(customerRef);
        const orderDoc = await transaction.get(orderRef);

        if (!customerDoc.exists() || !orderDoc.exists()) throw "Documento no encontrado";

        const currentPayed = orderDoc.data().payed || 0;
        const newCurrentValue = currentPayed + amount;
        const newBalance = customerDoc.data().currentBalance - amount;

        // 1. Actualizar la Orden
        transaction.update(orderRef, {
          payed: newCurrentValue,
          payStatus: status,
          paymentMethod: paymentMethod
        });

        // 2. Actualizar el Saldo del Cliente
        transaction.update(customerRef, { currentBalance: newBalance });

        // 3. Crear el registro en el historial (Audit Trail)
        transaction.set(transRef, {
          clientId: customerId,
          orderId: orderId,
          amount: amount,
          type: "PAY",
          createdAt: Date.now(),
          note: `Abono a orden #${orderDoc.data().id}`,
          balanceAfter: newBalance
        });
      });
      return true;
    } catch (e) {
      console.error("Error al registrar el pago de la orden:", e);
      return false;
    }
  }
}

export const customerRepository = new CustomerRepository();