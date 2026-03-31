import { useState } from "react"
import type { OrderItem } from "../types/types"

type Props = {
  code: string
  onConfirm: (item: OrderItem) => void
  onClose: () => void
}

export function ManualItemModal({ code, onConfirm, onClose }: Props) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState(0)
  const [qty, setQty] = useState(1)

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{ background: "#fff", padding: 20 }}>
        <h3>Producto no encontrado ({code})</h3>

        <input placeholder="Nombre" onChange={(e) => setName(e.target.value)} />
        <input type="number" placeholder="Precio" onChange={(e) => setPrice(Number(e.target.value))} />
        <input type="number" placeholder="Cantidad" onChange={(e) => setQty(Number(e.target.value))} />

        <button onClick={() => {
          onConfirm({
            productId: "",
            barcode: code,
            branch: "",
            article: name,
            unitPrice: price,
            quantity: qty,
            subtotal: price * qty
          })
        }}>
          Agregar
        </button>

        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}