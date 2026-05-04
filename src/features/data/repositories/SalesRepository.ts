import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
} from "firebase/firestore";
import { db } from "../services/FirebaseService"; // Ajusta según tu ruta
import { type OrderModel, OrderStatus } from "../../domain/types/orderTypes";

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
        docId: doc.id
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