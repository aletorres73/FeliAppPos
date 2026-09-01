export type NotificationType = 
  | 'PRICE_UPDATE' 
  | 'DEBT_ALERT' 
  | 'PURCHASE_DRAFT' 
  | 'VOLUME_DISCOUNT' 
  | 'INFO' 
  | 'WARNING';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
  actionRoute?: string; // Ej: "/stock", "/customers", "/purchases"
  metadata?: Record<string, any>;
}