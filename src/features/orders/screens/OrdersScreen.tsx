import { useState } from "react"
import { ScannerInput } from "../components/ScannerImput"
import { OrderList } from "../components/OrderList"
import { ManualItemModal } from "../components/ManualItemModal"
import { useOrder } from "../hook/useOrder"
// import type { Product } from "../types//types"
import { getProductById } from "../../data/repositories/ProductRepository"


export default function OrderScreen() {
  const { draft, addItem } = useOrder();
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Feedback visual

  const handleScan = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;

    setIsLoading(true);
    try {
      const product = await getProductById(normalizedCode);

      if (product) {
        // Si el producto se vende por peso, abrimos modal para cantidad manual
        if (product.saleWeight) {
          setManualCode(normalizedCode);
        } else {
          // Mapeo directo de Product -> OrderItem
          addItem({
            productId: product.id,
            barcode: product.id, // Usa el barcode real si existe
            branch: product.branch,
            article: product.article,
            unitPrice: product.price,
            quantity: 1,
            subtotal: product.price
          });
        }
      } else {
        // No existe en DB, abrir modal manual
        setManualCode(normalizedCode);
      }
    } catch (error) {
      console.error("Error en el scanner:", error);
      // Opcional: mostrar un toast de error de conexión
      setManualCode(normalizedCode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <header>
        <h2>Nuevo Pedido</h2>
        {isLoading && <small>Buscando producto...</small>}
      </header>

      <ScannerInput onScan={handleScan} />

      <OrderList items={draft.items} />

      <div style={{ marginTop: 20, borderTop: '1px solid #ccc' }}>
        <h3>Total: ${draft.total.toFixed(2)}</h3>
      </div>

      {manualCode && (
        <ManualItemModal
          code={manualCode}
          onClose={() => setManualCode(null)}
          onConfirm={(item) => {
            addItem(item);
            setManualCode(null);
          }}
        />
      )}
    </div>
  );
}