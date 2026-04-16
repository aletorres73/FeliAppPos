import { useEffect, useState, useMemo } from "react"
import { type OrderDraft, type OrderItem, type OrderModel, type Product, OrderStatus, OrderPayStatus } from "../types/types"
import { subscribeToProducts } from "../../data/repositories/ProductRepository"
import { roundToNearestHundred } from "../../../utils/formats";
import { orderRepository } from "../../data/repositories/OrderRepository";
import type { Customer, CustomerTransaction } from "../../customers/types/types";
import { customerRepository } from "../../data/repositories/CustomerRepository";

export function useOrder() {
  const [draft, setDraft] = useState<OrderDraft>({
    items: [],
    total: 0,
    subtotal: 0,
    comments: ""
  })

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para la búsqueda
  const [customers, setCustomers] = useState<Customer[]>([]); // Estado para clientes

  // CARGA INICIAL: 
  useEffect(() => {
    // Suscribirse a los cambios
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data || []);
      console.log("Productos actualizados desde Firestore");
    });

    customerRepository.getCustomers().then(data => {
      setCustomers(data || []);
      console.log("Clientes cargados:", data);
    }).catch(error => {
      console.error("Error al cargar clientes:", error);
    });


    // CLEANUP: React ejecuta esto cuando el componente se destruye
    return () => {
      console.log("Cerrando conexión con Firestore");
      unsubscribe();
    };
  }, []);

  // SUGERENCIAS: Usamos useMemo para que no se recalcule en cada render
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return products.filter(p =>

      p.article.toLowerCase().includes(term) ||
      p.id.toString().includes(term) ||
      p.branch.toLowerCase().includes(term)

    ).slice(0, 10); // Limitamos a 10 resultados por performance
  }, [searchTerm, products]);

  const customersSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.id !== null && c.id.toString().includes(term)) 
    ).slice(0, 10);
  }, [searchTerm, customers]);

  const addItem = (newItem: OrderItem) => {
    const existingItemIndex = draft.items.findIndex(
      (i) => i.productId === newItem.productId && i.productId !== ""
    );

    let newItems: OrderItem[];

    if (existingItemIndex !== -1) {
      newItems = [...draft.items];
      const existingItem = newItems[existingItemIndex];
      const updatedQuantity = existingItem.quantity + newItem.quantity;

      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: updatedQuantity,
        subtotal: updatedQuantity * existingItem.unitPrice
      };
    } else {
      newItems = [...draft.items, newItem];
    }

    const newTotal = newItems.reduce((acc, i) => acc + i.subtotal, 0);

    setDraft({
      ...draft,
      items: newItems,
      subtotal: newTotal,
      total: roundToNearestHundred(newTotal)
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
        return { ...item, quantity: newQty, subtotal: item.unitPrice * newQty };
      }
      return item;
    });

    const total = items.reduce((acc, i) => acc + i.subtotal, 0);
    setDraft({ ...draft, items, total, subtotal: total });
  }

  const clearDraft = () => {
    setDraft({ items: [], total: 0, subtotal: 0, comments: "" });
    setSearchTerm("");
  }

  const updateComments = (comments: string) => {
    setDraft(prev => ({ ...prev, comments }));
  }

  const commitOrder = async (
    draft: OrderDraft,
    payStatus: OrderPayStatus,
    customerPayment: number,
    customer: Customer
  ): Promise<String | null> => {

    const debDelta = (customerPayment < draft.total) ? draft.total - customerPayment : 0;

    // 1. Validamos datos básicos antes de intentar subir
    if (draft.items.length === 0) throw new Error("No hay ítems en la orden");

    // 2. Construimos el objeto de forma limpia
    const orderData: OrderModel = {
      docId: "", // Se asigna en el repositorio
      id: 0, //Lo maneja Cloud Function
      items: draft.items,
      total: draft.total,
      comments: draft.comments || "",
      createdAt: Date.now(),
      payStatus: payStatus,
      payed: customerPayment <= draft.total ? customerPayment : draft.total, // Evitamos que el pago supere el total
      status: OrderStatus.PENDING,
      confirmedAt: null,
      cancelledAt: null,
      client: null,
      customerPayment: customerPayment,
    };

    const transaction = (customer.id && debDelta > 0) ? {
      clientId: customer.id,
      orderId: "", // Se asigna en el repositorio
      amount: debDelta,
      type: "SALE",
      createdAt: Date.now(),
      note: `Pago de ${customerPayment} para orden de ${draft.total}`
    } as CustomerTransaction : null;

    console.log("Intentando guardar orden:", orderData);


    return orderRepository.commitOrderWithTransaction(orderData, transaction)

  };

  const PayOrder = async (
    order: OrderModel,
    amountPaid: number,
  ): Promise<boolean> => {

    // 1. Validar si ya está paga
    if (order.payStatus === OrderPayStatus.PAID) return false;

    // 2. Preparar la transacción (Solo si hay cliente y no es el "0"/Anónimo)
    // Usamos el signo negativo (-) en amountPaid para que al hacer FieldValue.increment reste la deuda
    const transaction: CustomerTransaction | null = (order.client != null) ? {
      clientId: order.client,
      orderId: order.docId, // Usamos el ID de Firestore
      amount: -amountPaid,  // <--- IMPORTANTE: Negativo para restar del saldo
      type: "PAY",
      createdAt: Date.now(),
      note: `Pago de orden #${order.id}`
    } : null;

    // 3. Crear el objeto de la orden actualizada
    // Sumamos lo que ya estaba pagado + el nuevo pago
    const updatedOrder: OrderModel & { docId: string } = {
      ...order,
      payed: (order.payed || 0) + amountPaid,
      payStatus: OrderPayStatus.PAID, // O la lógica que prefieras (ej: parcial)
      docId: order.docId // Necesitamos el docId para el repo
    };

    // 4. Llamar al repositorio
    try {
      const success = await orderRepository.payOrderWithTransaction(updatedOrder, transaction);
      return success;
    } catch (error) {
      console.error("Error al procesar PayOrder:", error);
      return false;
    }
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
    commitOrder, // commitOrderWithTransaction,
    customersSuggestions
  }
}