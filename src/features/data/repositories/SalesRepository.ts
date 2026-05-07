import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
} from "firebase/firestore";
import { db } from "../services/FirebaseService"; // Ajusta según tu ruta
import { type OrderModel, OrderStatus, type PaymentMethod, type PaymentType } from "../../domain/types/orderTypes";

export const salesRepository = {
  /**
   * Obtiene órdenes confirmadas en un rango de tiempo.
   * @param startDate Timestamp en milisegundos
   * @param endDate Timestamp en milisegundos
   */
  getOrdersByDateRange: async (startDate: number, endDate: number): Promise<OrderModel[]> => {
    try {
      const ordersRef = collection(db, "orders");
      
      // Consulta filtrando por estado CONFIRMED y el rango de fechas
      // Importante: Esto requiere un índice compuesto en Firestore
      const q = query(
        ordersRef,
        where("status", "==", OrderStatus.CONFIRMED),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id,
        paymentMethod: normalizePaymentMethod(doc.data().paymentMethod, doc.data().payed)
      })) as OrderModel[];
      
    } catch (error) {
      console.error("Error fetching sales data:", error);
      throw error;
    }
  },

  /**
   * Obtiene todas las órdenes del mes actual (útil para el dashboard inicial)
   */
  getCurrentMonthOrders: async (): Promise<OrderModel[]> => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastDay = now.getTime(); // Hasta el momento actual
    console.log("Fetching orders from", new Date(firstDay), "to", new Date(lastDay));
    
    return salesRepository.getOrdersByDateRange(firstDay, lastDay);
  }
};

/**
 * Normaliza el método de pago para manejar datos legacy (string) 
 * y el nuevo formato (array de objetos).
 */
const normalizePaymentMethod = (legacyOrNew: any, payed: number): PaymentMethod[] => {
    // Caso 1: Ya es el formato nuevo (Array)
    if (Array.isArray(legacyOrNew)) {
        return legacyOrNew;
    }

    // Caso 2: Es formato legacy (String: "CASH" o "TRANSFER")
    if (typeof legacyOrNew === 'string') {
        return [{
            type: legacyOrNew as PaymentType,
            // En el formato viejo no teníamos el desglose, 
            // asumimos que el pago total fue por este medio.
            amount: payed
        }];
    }

    // Caso 3: Es null o indefinido
    return [];
};