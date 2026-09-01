export interface FirestoreProduct {
  id: string;
  articulo: string;
  marca: string;
  costo: number;
  ganancia: number;
  precio: number;
  isParent: boolean;
  parentId: string | null;
  pricingReviewPending: boolean;
  previousCost?: number;
  suggestedPrice?: number;
  costUpdatedAt?: number;
}