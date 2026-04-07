import { useState } from "react";
import { ScannerInput } from "../components/ScannerImput";
import { OrderList } from "../components/OrderList";
import { ManualItemModal } from "../components/ManualItemModal";
import { useOrder } from "../hook/useOrder";
import { getProductById } from "../../data/repositories/ProductRepository";
import { roundToNearestHundred, formatCurrency } from "../../../utils/formats";
import feliLogo from "../../../assets/logo-feli.webp";
import type { Product, OrderItem, OrderPayStatus } from "../types/types";
import { CheckoutModal } from "../components/CheckoutModal";
import { saveOrder } from "../../data/repositories/OrderRepository";

export default function OrderScreen() {
  const {
    draft,
    searchTerm,
    setSearchTerm,
    suggestions,
    addItem,
    updateComments,
    clearDraft,
    removeItem,
    updateQuantity
  } = useOrder();

  const [manualCode, setManualCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Derivación de datos (Selectors)
  const subtotal = draft.subtotal;
  const totalFinal = roundToNearestHundred(subtotal);

  // Handlers
  const handleScan = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;

    setIsLoading(true);
    try {
      const product = await getProductById(normalizedCode);

      if (product?.saleWeight) {
        setSelectedProduct(product);
        setManualCode(normalizedCode);
      } else {
        addItem(mapProductToOrderItem(product!));
      }
    } catch (error) {
      console.error("Error en Scanner:", error);
      // setManualCode(normalizedCode); // Opcional: permitir manual incluso si hay error en búsqueda
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeOrder = async (payStatus: OrderPayStatus, customerPayment: number) => {
    try {
      setIsLoading(true);

      // Capturamos el ID que retorna la función saveOrder
      const orderId = await saveOrder(draft, payStatus, customerPayment);

      if (orderId) {
        clearDraft();
        setShowCheckout(false);

        // Uso del ID: Confirmación detallada
        alert(`Venta guardada con éxito. ID: ${orderId}`);
      }
    } catch (error) {
      alert("Error al guardar la venta");
    } finally {
      setIsLoading(false);
    }
  };

  const closeManualModal = () => {
    setManualCode(null);
    setSelectedProduct(null);
  };

  const handleConfirmManual = (item: OrderItem) => {
    addItem(item);
    closeManualModal();
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Header isLoading={isLoading} />

        <section style={{ marginBottom: 40 }}>
          <ScannerInput
            externalValue={searchTerm}
            onChange={setSearchTerm}
            onScan={handleScan}
            suggestions={suggestions}
          />
        </section>

        <section>
          <OrderList
            items={draft.items}
            onRemove={removeItem}
            onUpdate={(index, newQty) => updateQuantity(index, newQty)} // Conexión aquí
          />
        </section>

        <Footer
          subtotal={subtotal}
          total={totalFinal}
          itemsCount={draft.items.length}
          onCheckout={() => setShowCheckout(true)} // Pasamos la acción al footer
        />
      </div>

      {showCheckout && (
        <CheckoutModal
          total={totalFinal}
          comments={draft.comments || ""} // <-- El valor del draft
          onCommentsChange={updateComments} // <-- Tu función del hook useOrder
          onClose={() => setShowCheckout(false)}
          onConfirm={handleFinalizeOrder}
        />
      )}

      {manualCode && (
        <ManualItemModal
          code={manualCode}
          product={selectedProduct ?? undefined}
          onClose={closeManualModal}
          onConfirm={handleConfirmManual}
        />
      )}
    </div>
  );
}

// --- Sub-componentes internos para mayor claridad ---

const Header = ({ isLoading }: { isLoading: boolean }) => (
  <header style={styles.header}>
    <div style={styles.headerBrand}>
      <div style={styles.logoWrapper}>
        <img src={feliLogo} alt="Logo" style={styles.logo} />
      </div>
      <div>
        <h1 style={styles.title}>Feli App - Nuevo Pedido</h1>
        <p style={styles.subtitle}>Escanea productos para comenzar</p>
      </div>
    </div>
    {isLoading && (
      <div style={styles.loader}>
        <span className="pulse-animation">●</span> Buscando...
      </div>
    )}
  </header>
);

const Footer = ({ subtotal, total, itemsCount, onCheckout }: any) => (
  <footer style={styles.footer}>
    <div>
      <span style={styles.label}>Subtotal</span>
      <span style={styles.subtotalValue}>{formatCurrency(subtotal)}</span>
      <br />
      <small style={styles.itemCount}>{itemsCount} artículos</small>
    </div>

    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
      <div>
        <span style={styles.totalLabel}>TOTAL A PAGAR</span>
        <h2 style={styles.totalValue}>{formatCurrency(total)}</h2>
      </div>

      <button
        onClick={onCheckout}
        disabled={itemsCount === 0}
        style={{
          padding: "12px 24px",
          backgroundColor: itemsCount === 0 ? "rgba(255,255,255,0.05)" : "#54C4F0",
          color: itemsCount === 0 ? "rgba(255,255,255,0.2)" : "#0F1115",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: itemsCount === 0 ? "not-allowed" : "pointer",
          transition: "0.2s"
        }}
      >
        Finalizar Venta
      </button>
    </div>
  </footer>
);

// --- Funciones de Mapeo ---
const mapProductToOrderItem = (p: Product): OrderItem => ({
  productId: p.id,
  barcode: p.id,
  branch: p.branch,
  article: p.article,
  unitPrice: p.price,
  quantity: 1,
  subtotal: p.price
});

// --- Objeto de Estilos ---
const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", backgroundColor: "#0F1115", color: "white", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  content: { maxWidth: "900px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 20 },
  headerBrand: { display: "flex", alignItems: "center", gap: "18px" },
  logoWrapper: { width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" },
  logo: { width: "100%", height: "100%", objectFit: "contain" },
  title: { fontSize: "1.35rem", fontWeight: 600, margin: 0 },
  subtitle: { color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", margin: 0 },
  loader: { color: "#54C4F0", fontSize: "0.85rem", fontWeight: 500 },
  footer: { marginTop: 40, padding: "30px 20px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)" },
  label: { color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", display: "block", marginBottom: 4 },
  subtotalValue: { color: "rgba(255,255,255,0.7)", fontSize: "1.2rem" },
  itemCount: { color: "rgba(255,255,255,0.3)" },
  totalLabel: { color: "#54C4F0", fontSize: "0.9rem", fontWeight: 600, display: "block", marginBottom: 5 },
  totalValue: { fontSize: "2.5rem", margin: 0, color: "#54C4F0", fontWeight: 700 },
};