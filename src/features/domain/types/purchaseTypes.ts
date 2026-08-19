import type { PaymentMethod } from './orderTypes';

export type PurchasePayStatus = 'PENDING' | 'PAID';
export type PurchasePaymentType = 'UNIT' | 'BULK';

export interface PurchaseItem {
  productId: string;
  article: string;
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
  items: PurchaseItem[];
  total: number;
  payed: number;
  debt: number;
  payStatus: PurchasePayStatus;
  paymentMethod: PaymentMethod[] | null;
  createdAt: number;
}

export interface PurchaseDraftItem extends PurchaseItem {
  productCost: number;
}
