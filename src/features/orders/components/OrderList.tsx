import type { OrderItem } from "../types/types"

type Props = {
  items: OrderItem[]
}

export function OrderList({ items }: Props) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ padding: 8, borderBottom: "0.5px solid #ddd" }}>
          <strong>{item.article}</strong><br />
          {item.quantity} x {item.unitPrice} = {item.subtotal}
        </div>
      ))}
    </div>
  )
}