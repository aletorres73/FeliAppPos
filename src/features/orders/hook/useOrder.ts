import { useState } from "react"
import type { OrderDraft, OrderItem } from "../types/types"

export function useOrder() {
  const [draft, setDraft] = useState<OrderDraft>({
    items: [],
    total: 0,
    subtotal: 0
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

  return { draft, addItem }
}