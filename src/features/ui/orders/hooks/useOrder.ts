import { useEffect, useState, useMemo } from "react"
import { type OrderDraft, type OrderItem, type OrderModel, OrderStatus, OrderPayStatus, type PaymentMethod } from "../../../domain/types/orderTypes"
import type { Product } from "../../../domain/types/productTypes"
import { subscribeToProducts } from "../../../data/repositories/ProductRepository"
import { roundToNearestHundred } from "../../../domain/utils/formats";
import { orderRepository } from "../../../data/repositories/OrderRepository";
import type { Customer, CustomerTransaction } from "../../../domain/types/customersTypes";

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

  // 🆕 DICCIONARIO OPTIMIZADO: Acceso instantáneo O(1) por ID de producto
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  // --- 🆕 FUNCIÓN HELPER: DETERMINAR PRECIO SEGÚN VOLUMEN ---
  const getCurrentUnitPrice = (product: Product, quantity: number): number => {
    if (!product.volumePrices || product.volumePrices.length === 0) {
      return product.price; // Si no tiene reglas, va el precio base
    }

    // Filtramos las reglas que el usuario cumple con la cantidad/peso actual
    const applicableRules = product.volumePrices.filter(rule => quantity >= rule.fromQuantity);

    if (applicableRules.length === 0) {
      return product.price; // No llegó al mínimo de ninguna escala
    }

    // Buscamos la regla con el mayor umbral alcanzado (por si definiste múltiples escalas)
    const bestRule = applicableRules.reduce((max, rule) =>
      rule.fromQuantity > max.fromQuantity ? rule : max
      , applicableRules[0]);

    return bestRule.specialPrice;
  };

  // --- LÓGICA DE CÁLCULO CENTRALIZADA ---
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

  // --- 🆕 AGREGAR ÍTEM EVALUANDO ESCALAS EN TIEMPO REAL ---
  const addItem = (newItem: OrderItem) => {
    setDraft(prev => {
      const existingIndex = prev.items.findIndex(i => i.productId === newItem.productId);
      let newItems = [...prev.items];

      // Buscamos el producto en la lista maestra para chequear sus volumePrices
      const masterProduct = productsMap.get(newItem.productId);

      if (existingIndex !== -1) {
        const item = newItems[existingIndex];
        const updatedQty = item.quantity + newItem.quantity;

        // Si encontramos el producto maestro, recalculamos precio unitario por volumen
        const unitPrice = masterProduct ? getCurrentUnitPrice(masterProduct, updatedQty) : item.unitPrice;

        newItems[existingIndex] = {
          ...item,
          quantity: updatedQty,
          unitPrice: unitPrice,
          subtotal: updatedQty * unitPrice
        };
      } else {
        // Es un ítem nuevo. Evaluamos su cantidad inicial por si entra en escala de una
        const unitPrice = masterProduct ? getCurrentUnitPrice(masterProduct, newItem.quantity) : newItem.unitPrice;

        newItems.push({
          ...newItem,
          unitPrice: unitPrice,
          subtotal: newItem.quantity * unitPrice
        });
      }

      // ⚠️ OPTIMIZACIÓN IMPORTANTE: 
      // Si el precio unitario cambió (ej: pasó de $100 a $75), tenemos que revaluar 
      // TODOS los ítems por si el cambio de precio de un producto afecta colaterales (opcional pero sano)
      return { ...prev, ...calculateTotals(newItems, prev.discount) };
    });
  };

  const removeItem = (index: number) => {
    setDraft(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, ...calculateTotals(newItems, prev.discount) };
    });
  };

  // --- 🆕 ACTUALIZAR CANTIDAD EVALUANDO ESCALAS EN TIEMPO REAL ---
  const updateQuantity = (index: number, newQty: number) => {
    setDraft(prev => {
      const newItems = prev.items.map((item, i) => {
        if (i === index) {
          const masterProduct = productsMap.get(item.productId);
          const unitPrice = masterProduct ? getCurrentUnitPrice(masterProduct, newQty) : item.unitPrice;

          return {
            ...item,
            quantity: newQty,
            unitPrice: unitPrice,
            subtotal: unitPrice * newQty
          };
        }
        return item;
      });
      return { ...prev, ...calculateTotals(newItems, prev.discount) };
    });
  };

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
    paymentMethod: PaymentMethod[] | null,
    customer: Customer,
  ): Promise<String | null> => {
    const debDelta = (customerPayment < draft.total) ? draft.total - customerPayment : 0;
    const payed = customerPayment <= draft.total ? customerPayment : draft.total

    if (draft.items.length === 0) throw new Error("No hay ítems en la orden");

    const orderData: OrderModel = {
      docId: "",
      id: 0,
      items: draft.items,
      total: draft.total,
      comments: draft.comments || "",
      discount: draft.discount,
      createdAt: Date.now(),
      payStatus: payStatus,
      payed: payed,
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
      amount: payed,
      debt: debDelta,
      paymentMethod: paymentMethod,
      type: "SALE",
      createdAt: Date.now(),
      note: `Venta: Total ${draft.total} - Pagó ${customerPayment}`
    } as CustomerTransaction | null;

    return orderRepository.commitOrderWithTransaction(orderData, transaction);
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
    applyGlobalDiscount
  }
}