import { useState } from "react"
import type { OrderDraft, OrderItem } from "../types/types"

export function useOrder() {
  const [draft, setDraft] = useState<OrderDraft>({
    items: [],
    total: 0,
    subtotal: 0,
    comments: null
  })

  const addItem = (item: OrderItem) => {
    const items = [...draft.items, item]

    const total = items.reduce((acc, i) => acc + i.subtotal, 0)

    setDraft({
      ...draft,
      items,
      total,
      subtotal: total
    })
  }

  const removeItem = (index: number) => {
    const items = draft.items.filter((_, i) => i !== index);
    const total = items.reduce((acc, i) => acc + i.subtotal, 0);
    setDraft({
      ...draft,
      items,
      total,
      subtotal: total
    });
  }

  const updateQuantity = (index: number, newQty: number) => {
    const items = draft.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { 
          ...item, 
          quantity: newQty, 
          subtotal: item.unitPrice * newQty
        };
        return updatedItem;
      }
      return item;
    });

    const total = items.reduce((acc, i) => acc + i.subtotal, 0);
    setDraft({
      ...draft,
      items,
      total,
      subtotal: total
    });
  }

  return { draft, addItem, removeItem, updateQuantity }
}