import type { OrderItem } from "../../../domain/types/orderTypes"

type Props = {
  items: OrderItem[]
  onRemove: (index: number) => void
  onUpdate: (index: number, newQty: number) => void
}

// Configuración de layout compartida
const GRID_LAYOUT = "1.2fr 2fr 1fr 0.6fr 1fr 50px";

export function OrderList({ items, onRemove, onUpdate }: Props) {
  return (
    <div style={styles.container}>
      <style>{hoverEffects}</style>

      <ListHeader />

      <div style={styles.scrollContainer}>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item, i) => (
            <OrderRow
              key={`${item.productId}-${i}`}
              item={item}
              index={i}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </div>
  )
}

// --- Sub-componentes Atómicos ---

const ListHeader = () => (
  <div style={styles.headerGrid}>
    <div>Marca</div>
    <div>Artículo</div>
    <div style={{ textAlign: "left" }}>Precio</div>
    <div style={{ textAlign: "center" }}>Cant.</div>
    <div style={{ textAlign: "right" }}>Total</div>
    <div></div>
  </div>
);

const OrderRow = ({
  item,
  index,
  onRemove,
  onUpdate
}: {
  item: OrderItem,
  index: number,
  onRemove: (i: number) => void,
  onUpdate: (i: number, q: number) => void
}) => {

  const handleQtyClick = () => {
    const promptMsg = `Editar ${item.quantity ? 'peso (kg)' : 'cantidad'} para ${item.article}:`;
    const val = window.prompt(promptMsg, item.quantity.toString());

    if (val !== null) {
      const newQty = parseFloat(val);
      if (!isNaN(newQty) && newQty > 0) {
        onUpdate(index, newQty);
      }
    }
  };

  return (
    <div className="order-item-row" style={styles.rowGrid}>
      <div style={styles.branchText}>{item.branch || "—"}</div>
      <div style={styles.articleText}>{item.article}</div>
      <div style={styles.priceText}>{item.unitPrice.toFixed(2)}</div>

      {/* Cantidad ahora es un botón/área interactiva */}
      <div
        onClick={handleQtyClick}
        style={{ ...styles.quantityText, cursor: 'pointer', textDecoration: 'underline dotted #54C4F0' }}
        title="Click para editar"
      >
        {item.quantity}
      </div>

      <div style={styles.subtotalText}>{item.subtotal.toFixed(2)}</div>
      <div style={{ textAlign: "center" }}>
        <button onClick={() => onRemove(index)} className="delete-btn" style={styles.deleteBtn}>
          🗑️
        </button>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div style={styles.emptyState}>
    🛒 El pedido está vacío
  </div>
);

// --- Estilos y Efectos ---

const hoverEffects = `
  .order-item-row {
    transition: all 0.15s ease-in-out;
  }
  .order-item-row:hover {
    background-color: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
  }
  .order-item-row:hover .delete-btn {
    opacity: 0.6;
  }
  .delete-btn:hover {
    opacity: 1 !important;
    transform: scale(1.1);
  }
`;

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: 20, height : "100%" },
  scrollContainer: { maxHeight: "400px", overflowY: "auto", marginTop: 8 },
  headerGrid: {
    display: "grid",
    gridTemplateColumns: GRID_LAYOUT,
    padding: "0 12px 12px 12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  },
  rowGrid: {
    display: "grid",
    gridTemplateColumns: GRID_LAYOUT,
    padding: "16px 12px",
    alignItems: "center",
    fontSize: "0.85rem",
    color: "white",
    borderBottom: "1px solid rgba(255, 255, 255, 0.02)"
  },
  branchText: { color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem" },
  articleText: { fontWeight: 500, color: "rgba(255, 255, 255, 0.95)" },
  priceText: { textAlign: "left", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.7)" },
  quantityText: { textAlign: "center", fontWeight: 'bold', fontSize: '0.9rem' },
  subtotalText: { textAlign: "right", fontWeight: "bold", fontSize: '0.9rem', color: "#54C4F0" },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#e63946",
    opacity: 0.15, // Reemplaza el rgba complejo por opacidad
    cursor: "pointer",
    fontSize: "1.1rem",
    transition: "all 0.2s ease"
  },
  emptyState: { padding: 40, textAlign: "center", color: "rgba(255, 255, 255, 0.2)", fontSize: '0.9rem' }
};