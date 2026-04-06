import { useState } from "react"
import type { OrderDraft, OrderItem } from "../types/types"

export function useOrder() {
  const [draft, setDraft] = useState<OrderDraft>({
    items: [],
    total: 0,
    subtotal: 0,
    comments: null
  })

  const addItem = (newItem: OrderItem) => {
  // 1. Buscamos si el producto ya existe en el carrito
  const existingItemIndex = draft.items.findIndex(
    (i) => i.productId === newItem.productId && i.productId !== ""
  );

  let newItems: OrderItem[];

  if (existingItemIndex !== -1) {
    // 2. Si existe, creamos una copia del array y actualizamos el ítem
    newItems = [...draft.items];
    const existingItem = newItems[existingItemIndex];

    const updatedQuantity = existingItem.quantity + newItem.quantity;
    
    newItems[existingItemIndex] = {
      ...existingItem,
      quantity: updatedQuantity,
      subtotal: updatedQuantity * existingItem.unitPrice // Recalculamos con el precio original
    };
  } else {
    // 3. Si no existe (o es un producto manual sin ID), lo agregamos al final
    newItems = [...draft.items, newItem];
  }

  // 4. Calculamos el total general del carrito
  const newTotal = newItems.reduce((acc, i) => acc + i.subtotal, 0);

  // 5. Actualizamos el estado de una sola vez
  setDraft({
    ...draft,
    items: newItems,
    total: newTotal,
    subtotal: newTotal
  });
};

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

  const clearDraft = () => {
    setDraft({
      items: [],
      total: 0,
      subtotal: 0,
      comments: null
    });
  }

  return { draft, addItem, removeItem, updateQuantity, clearDraft }
}