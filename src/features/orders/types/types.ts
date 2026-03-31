export type OrderItem = {
  productId: string
  barcode: string
  branch: string
  article: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export type OrderDraft = {
  items: OrderItem[]
  total: number
  subtotal: number
  comments?: string
}

export type Product = {
  id: string
  branch: string
  article: string
  cost: number
  gains: number
  price: number
  stock: number
  weight: number
  active: boolean
  saleWeight: boolean
  quantitySold: number
  createdAt: number
  updatedAt: number
  weightSold: number
}