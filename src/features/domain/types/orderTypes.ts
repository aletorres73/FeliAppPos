export interface OrderItem {
  productId: string;
  barcode: string;
  branch: string;
  article: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  subtotal: number;
}

export interface OrderModel {
  docId: string;           // El ID del documento en Firestore
  id: number;              // Tu ID autoincremental o interno
  status: OrderStatus;
  payStatus: OrderPayStatus;
  items: OrderItem[];
  total: number;
  payed: number;
  discount: number;
  createdAt: number;       // Timestamp (ms)
  confirmedAt: number | null;
  cancelledAt: number | null;
  client: string | null;
  comments: string | null;
  customerPayment: number;
  paymentMethod: PaymentMethod[] | null;
}

export type PaymentType = "CASH" | "TRANSFER" | "MIXED" | "QR" | "CARD" | null;

export interface PaymentMethod {
  type: PaymentType;
  amount: number;
}

export interface OrderDraft {
  items: OrderItem[];
  subtotal: number; // Suma pura de items
  discount: number; // Monto a descontar
  total: number;    // Subtotal - Descuento (redondeado)
  comments: string;
}

// 1. Definimos el objeto con los valores
export const OrderStatus = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  PENDING: "PENDING",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderPayStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
} as const;

export type OrderPayStatus = (typeof OrderPayStatus)[keyof typeof OrderPayStatus];

export const OrderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: "Borrador",
  [OrderStatus.CONFIRMED]: "Confirmado",
  [OrderStatus.CANCELLED]: "Cancelado",
  [OrderStatus.PENDING]: "Pendiente",
};

export const OrderPayStatusText: Record<OrderPayStatus, string> = {
  [OrderPayStatus.PENDING]: "A cobrar",
  [OrderPayStatus.PAID]: "Pagado",
};