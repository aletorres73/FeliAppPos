import { useState } from "react"
import { ScannerInput } from "./components/scannerImput"
import { OrderList } from "./components/orderList"
import { ManualItemModal } from "./components/manualItemModal"
import { useOrder } from "./hook/useOrder"
import type { Product } from "./types/types"

const productsCache: Record<string, Product> = {
  "779123": {
    id: "779123",
    article: "Coca Cola",
    price: 1000,
    branch: "Bebidas",
    cost: 0,
    gains: 0,
    stock: 0,
    weight: 0,
    active: true,
    saleWeight: false,
    quantitySold: 0,
    createdAt: 0,
    updatedAt: 0,
    weightSold: 0
  },
  "F01": {
    id: "F01",
    article: "Jamón cocido",
    price: 5000,
    branch: "Fiambres",
    cost: 0,
    gains: 0,
    stock: 0,
    weight: 0,
    active: true,
    saleWeight: true,
    quantitySold: 0,
    createdAt: 0,
    updatedAt: 0,
    weightSold: 0
  }
}

export default function OrderScreen() {
  const { draft, addItem } = useOrder()
  const [manualCode, setManualCode] = useState<string | null>(null)

  const handleScan = (code: string) => {
    const normalizedCode = code.trim().toUpperCase()

    console.log("RAW:", code)
    console.log("NORMALIZED:", normalizedCode)
    console.log("CACHE:", productsCache[normalizedCode])

    const product = productsCache[normalizedCode]

    if (product) {
      if (product.saleWeight) {
        setManualCode(normalizedCode)
      } else {
        addItem({
          productId: product.id,
          barcode: product.id,
          branch: product.branch,
          article: product.article,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price
        })
      }
    } else {
      setManualCode(normalizedCode)
    }

}

return (
  <div style={{ padding: 20 }}>
    <h2>Nuevo Pedido</h2>

    <ScannerInput onScan={handleScan} />

    <OrderList items={draft.items} />

    <h3>Total: {draft.total}</h3>

    {manualCode && (
      <ManualItemModal
        code={manualCode}
        onClose={() => setManualCode(null)}
        onConfirm={(item) => {
          addItem(item)
          setManualCode(null)
        }}
      />
    )}
  </div>
)
}