import { useState } from "react"
import { ScannerInput } from "../components/ScannerImput"
import { OrderList } from "../components/OrderList"
import { ManualItemModal } from "../components/ManualItemModal"
import { useOrder } from "../hook/useOrder"
import { getProductById } from "../../data/repositories/ProductRepository"
import feliLogo from "../../../assets/logo-feli.webp";

export default function OrderScreen() {
  const { draft, addItem, removeItem } = useOrder();
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;

    setIsLoading(true);
    try {
      const product = await getProductById(normalizedCode);
      if (product) {
        if (product.saleWeight) {
          setManualCode(normalizedCode);
        } else {
          addItem({
            productId: product.id,
            barcode: product.id,
            branch: product.branch,
            article: product.article,
            unitPrice: product.price,
            quantity: 1,
            subtotal: product.price
          });
        }
      } else {
        setManualCode(normalizedCode);
      }
    } catch (error) {
      console.error("Error en el scanner:", error);
      setManualCode(normalizedCode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0F1115",
      color: "white",
      padding: "40px 20px",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}>
              <img
                src={feliLogo}
                alt="Feli App Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>

            <div>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>
                Feli App - Nuevo Pedido
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: 5, margin: 0 }}>
                Escanea productos para comenzar
              </p>
            </div>
          </div>

          {isLoading && (
            <div style={{ color: "#54C4F0", fontSize: "0.85rem", fontWeight: 500 }}>
              <span className="pulse-animation">●</span> Buscando...
            </div>
          )}
        </header>

        <section style={{ marginBottom: 40 }}>
          <ScannerInput onScan={handleScan} />
        </section>

        <section>
          <OrderList
            items={draft.items}
            onRemove={(index) => removeItem(index)}
          />
        </section>

        <footer style={{
          marginTop: 40,
          padding: "30px 20px",
          backgroundColor: "rgba(255,255,255,0.02)",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>Total a pagar</span>
          <div style={{ textAlign: "right" }}>
            <h2 style={{
              fontSize: "2.5rem",
              margin: 0,
              color: "#54C4F0",
              fontWeight: 700
            }}>
              ${draft.total.toFixed(2)}
            </h2>
            <small style={{ color: "rgba(255,255,255,0.3)" }}>
              {draft.items.length} artículos en el carrito
            </small>
          </div>
        </footer>
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

      <style>{`
        .pulse-animation {
          animation: pulse 1.5s infinite;
          margin-right: 8px;
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}