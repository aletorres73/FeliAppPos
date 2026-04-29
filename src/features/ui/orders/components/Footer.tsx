import { formatCurrency } from "../../../../utils/formats"; // Asumiendo tu ruta de utilidades

interface FooterProps {
  subtotal: number;
  total: number;
  discount: number; // El valor del descuento actual
  itemsCount: number;
  isLoading: boolean;
  onDiscountChange: (value: number) => void; // Para devolver el valor al padre
  onCheckout: () => void;
  onConfirm: (value: number) => void;
}

export const Footer = ({
  subtotal,
  total,
  discount,
  itemsCount,
  isLoading,
  onDiscountChange,
  onCheckout,
  onConfirm
}: FooterProps) => {

  // Manejador interno para el input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ""); // Solo números
    onDiscountChange(Number(val) || 0);
  };

  return (
    <footer style={styles.footer}>
      {/* Sección Descuento */}
      <div style={styles.section}>
        <span style={styles.label}>Descuento ($)</span>
        <input
          type="text"
          style={styles.discountInput}
          placeholder="0"
          value={discount || ""}
          onChange={handleChange}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onConfirm(discount) }
          }}
        />
      </div>

      {/* Sección Subtotal */}
      <div style={styles.section}>
        <span style={styles.label}>Subtotal</span>
        <span style={styles.valueText}>{formatCurrency(subtotal)}</span>
        <small style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>
          {itemsCount} artículos
        </small>
      </div>

      {/* Sección Total y Acción */}
      <div style={{ ...styles.section, alignItems: "flex-end", gap: "10px" }}>
        <div style={{ textAlign: "right" }}>
          <span style={{ ...styles.label, color: "#54C4F0" }}>TOTAL A PAGAR</span>
          <h2 style={styles.totalValue}>{formatCurrency(total)}</h2>
        </div>

        <button
          onClick={onCheckout}
          disabled={itemsCount === 0 || isLoading}
          style={{
            padding: "10px 8px",
            backgroundColor: (itemsCount === 0 || isLoading) ? "rgba(255,255,255,0.05)" : "#54C4F0",
            color: (itemsCount === 0 || isLoading) ? "rgba(255,255,255,0.2)" : "#0F1115",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: ".7rem",
            cursor: (itemsCount === 0 || isLoading) ? "not-allowed" : "pointer",
            transition: "0.2s",
            opacity: isLoading ? 0.7 : 1,
            boxShadow: (itemsCount > 0 && !isLoading) ? "0 4px 15px rgba(84, 196, 240, 0.2)" : "none"
          }}
        >
          {isLoading ? "PROCESANDO..." : "FINALIZAR VENTA"}
        </button>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: "#1A1D23",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "35px 5px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: "50px", // Definimos un alto fijo para calcular el offset
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  valueText: {
    color: "white",
    fontSize: "1.1rem",
    fontWeight: 500,
  },
  totalValue: {
    color: "#54C4F0",
    fontSize: "1.4rem",
    fontWeight: "bold",
    margin: 0,
  },
  discountInput: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#54C4F0", // Color de acento para el monto
    padding: "8px 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "120px",
    fontFamily: "monospace",
    marginTop: "4px",
    transition: "all 0.2s ease",
  }
};