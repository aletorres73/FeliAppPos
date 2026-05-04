export type CustomerTransaction = {
  clientId: string
  orderId: string,
  amount: number,
  type: TransactionType,
  createdAt: number,
  note: string
}

export const TransactionType = {
  SALE : "SALE",
  PAY: "PAY",
  EXIT: "EXIT",
} ;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export type Customer = {
  id: string | null 
  name: string,
  lastname: string,
  phone: string,
  address: string,
  currentBalance: number,
  lastPurchaseDate: number | null,
}

export const AnonymousCustomer: Customer = {
  id: null,
  name: "Consumidor final",
  lastname: "",
  phone: "",
  address: "",
  currentBalance: 0,
  lastPurchaseDate: null,
}