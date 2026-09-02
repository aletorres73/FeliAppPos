import type { PaymentMethod } from './orderTypes';

export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';
export type PurchasePayStatus = 'PENDING' | 'PAID';
export type PurchasePaymentType = 'UNIT' | 'BULK';

export interface PurchaseItem {
  productId: string;
  article: string;
  branch: string;
  quantity: number;
  saleWeight?: boolean;
  bulks: number;
  unitsPerBulk: number | null;
  purchaseType: PurchasePaymentType;
  unitCost: number;
  bulkCost: number | null;
  subtotal: number;
}

export interface Purchase {
  docId: string;
  supplierId: string;
  status?: PurchaseStatus; // DRAFT: pedido no ingresado a stock, RECEIVED: ingresado a stock
  items: PurchaseItem[];
  total: number;
  payed: number;
  debt: number;
  payStatus: PurchasePayStatus;
  paymentMethod: PaymentMethod[] | null;
  createdAt: number;
  receivedAt?: number | null;
}

export type DiscountType = 'PERCENT' | 'AMOUNT';

export interface PurchaseDraftItem extends PurchaseItem {
  productCost: number;
  previousUnitsPerBulk?: number | null;
  // unitCost entered before the item discount is applied; unitCost itself becomes the discounted value
  rawUnitCost: number;
  // subtotal before applying discountType/discountValue; UI-only, never persisted
  rawSubtotal: number;
  discountType: DiscountType;
  discountValue: number;
}
