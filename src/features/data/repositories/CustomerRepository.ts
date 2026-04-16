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
import type { Customer } from "../../customers/types/types";
import { AnonymousCustomer } from "../../customers/types/types";

export class CustomerRepository {
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
}

export const customerRepository = new CustomerRepository();