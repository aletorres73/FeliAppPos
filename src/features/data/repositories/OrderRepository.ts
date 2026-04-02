import { db } from "../services/FirebaseService"
import { collection, addDoc } from "firebase/firestore"
import type { OrderModel, OrderPayStatus } from "../../orders/types/types"
import type { OrderDraft } from "../../orders/types/types"

export const saveOrder = async (
    draft: OrderDraft,
    payStatus: OrderPayStatus,
    customerPayment: number

) => {
    const order: OrderModel = {
        id: 0,
        items: draft.items,
        total: draft.total,
        comments: draft.comments,
        createdAt: Date.now(),
        payStatus: payStatus,
        payed: customerPayment < draft.total ? customerPayment : draft.total,
        status: "DRAFT",
        confirmedAt: null,
        cancelledAt: null,
        client: null,
        customerPayment: customerPayment
    }
  await addDoc(collection(db, "orders"), order)
}
