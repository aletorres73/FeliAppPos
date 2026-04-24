export interface SalesStats {
  periodTotal: number;
  periodCash: number;
  periodTransfer: number;
  pendingCollect: number;
  topProducts: { article: string; quantity: number; total: number }[];
  lowStockAlerts: { article: string; quantity: number }[];
}