import { db } from "../services/FirebaseService"
import { collection, addDoc } from "firebase/firestore"
import { OrderStatus, type OrderModel, type OrderPayStatus } from "../../orders/types/types"
import type { OrderDraft } from "../../orders/types/types"

export const saveOrder = async (
    draft: OrderDraft,
    payStatus: OrderPayStatus,
    customerPayment: number
) => {
    try {
        // 1. Validamos datos básicos antes de intentar subir
        if (draft.items.length === 0) throw new Error("No hay ítems en la orden");

        // 2. Construimos el objeto de forma limpia
        const orderData: OrderModel = {
            id: 0, //Lo maneja Cloud Function
            items: draft.items,
            total: draft.total,
            comments: draft.comments || "",
            // Usar serverTimestamp() es mejor que Date.now() para evitar 
            // conflictos si el reloj del dispositivo del cliente está mal.
            createdAt: Date.now(),
            payStatus: payStatus,
            // Lo que efectivamente ingresó a la caja
            payed: payStatus === "PAID" ? Math.min(customerPayment, draft.total) : 0,
            status: OrderStatus.PENDING,
            confirmedAt: null,
            cancelledAt: null,
            client: null,
            // El billete/monto con el que pagó el cliente (útil para auditoría)
            customerPayment: payStatus === "PAID" ? customerPayment : 0,
        };

        console.log("Intentando guardar orden:", orderData);

        const docRef = await addDoc(collection(db, "orders"), orderData);

        return docRef.id; // Retornamos el ID por si lo necesitas para un ticket

    } catch (error) {
        console.error("Error crítico al guardar orden:", error);
        throw error; // Re-lanzamos para que la UI pueda mostrar un alerta
    }
};
