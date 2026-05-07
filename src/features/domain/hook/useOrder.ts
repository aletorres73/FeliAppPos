import { useEffect, useState, useMemo } from "react"
import { type OrderDraft, type OrderItem, type OrderModel, type Product, OrderStatus, OrderPayStatus, type PaymentMethod } from "../../domain/types/orderTypes"
import { subscribeToProducts } from "../../data/repositories/ProductRepository"
import { roundToNearestHundred } from "../../../utils/formats";
import { orderRepository } from "../../data/repositories/OrderRepository";
import type { Customer, CustomerTransaction } from "../../domain/types/customersTypes";

export function useOrder() {
  const [draft, setDraft] = useState<OrderDraft>({
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    comments: ""
  })

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- LÓGICA DE CÁLCULO CENTRALIZADA ---
  // Esta función garantiza que el total siempre sea subtotal - descuento
  const calculateTotals = (items: OrderItem[], discount: number) => {
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const totalBeforeRounding = subtotal - discount;
    return {
      items,
      subtotal,
      discount,
      total: roundToNearestHundred(Math.max(0, totalBeforeRounding))
    };
  };

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data || []);
    });
    return () => unsubscribe();
  }, []);

  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.article.toLowerCase().includes(term) ||
      p.id.toString().includes(term) ||
      p.branch.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [searchTerm, products]);

  const addItem = (newItem: OrderItem) => {
    setDraft(prev => {
      const existingIndex = prev.items.findIndex(i => i.productId === newItem.productId);
      let newItems = [...prev.items];

      if (existingIndex !== -1) {
        const item = newItems[existingIndex];
        const updatedQty = item.quantity + newItem.quantity;
        newItems[existingIndex] = {
          ...item,
          quantity: updatedQty,
          subtotal: updatedQty * item.unitPrice
        };
      } else {
        newItems.push(newItem);
      }
      return { ...prev, ...calculateTotals(newItems, prev.discount) };
    });
  };

  const removeItem = (index: number) => {
    setDraft(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, ...calculateTotals(newItems, prev.discount) };
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    setDraft(prev => {
      const newItems = prev.items.map((item, i) => 
        i === index ? { ...item, quantity: newQty, subtotal: item.unitPrice * newQty } : item
      );
      return { ...prev, ...calculateTotals(newItems, prev.discount) };
    });
  };

  // --- CORRECCIÓN DEL DESCUENTO ---
  const applyGlobalDiscount = (discountAmount: number) => {
    setDraft(prev => ({
      ...prev,
      ...calculateTotals(prev.items, discountAmount)
    }));
  };

  const clearDraft = () => {
    setDraft({ items: [], subtotal: 0, discount: 0, total: 0, comments: "" });
    setSearchTerm("");
  }

  const updateComments = (comments: string) => {
    setDraft(prev => ({ ...prev, comments }));
  }

  const commitOrder = async (
    draft: OrderDraft,
    payStatus: OrderPayStatus,
    customerPayment: number,
    paymentMethod: PaymentMethod [] | null,
    customer: Customer,
  ): Promise<String | null> => {
    const debDelta = (customerPayment < draft.total) ? draft.total - customerPayment : 0;

    if (draft.items.length === 0) throw new Error("No hay ítems en la orden");

    const orderData: OrderModel = {
      docId: "",
      id: 0,
      items: draft.items,
      total: draft.total, // Ya viene calculado y redondeado del draft
      comments: draft.comments || "",
      discount: draft.discount,
      createdAt: Date.now(),
      payStatus: payStatus,
      payed: customerPayment <= draft.total ? customerPayment : draft.total,
      status: OrderStatus.DRAFT,
      confirmedAt: null,
      cancelledAt: null,
      client: customer.id,
      customerPayment: customerPayment,
      paymentMethod: paymentMethod,
    };

    const transaction = {
      clientId: customer.id,
      orderId: "",
      amount: debDelta,
      paymentMethod: paymentMethod,
      type: "SALE",
      createdAt: Date.now(),
      note: `Venta: Total ${draft.total} - Pagó ${customerPayment}`
    } as CustomerTransaction;

    return orderRepository.commitOrderWithTransaction(orderData, transaction);
    // console.log("Saving order: ", orderData)
    // console.log("Saving transaction", transaction)
    // return "test"
  };

  return {
    draft,
    addItem,
    removeItem,
    updateQuantity,
    clearDraft,
    updateComments,
    searchTerm,
    setSearchTerm,
    suggestions,
    commitOrder,
    applyGlobalDiscount // Reemplaza a updateDraftSubtotal
  }
}