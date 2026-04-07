import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../../../utils/formats";

interface Props {
  total: number;
  onConfirm: (status: "PAID" | "PENDING", payment: number) => void;
  onClose: () => void;
  comments: string;
  onCommentsChange: (val: string) => void;
  isLoading: boolean; // <-- Nueva prop agregada
}

export function CheckoutModal({ 
  total, 
  onConfirm, 
  onClose, 
  comments, 
  onCommentsChange, 
  isLoading 
}: Props) {
  const [paymentAmount, setPaymentAmount] = useState<string>(total.toString());
  const [isPaid, setIsPaid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPaid && !isLoading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isPaid, isLoading]);

  const numericPayment = parseFloat(paymentAmount) || 0;
  const change = numericPayment - total;

  return (
    <div style={modalStyles.overlay} role="dialog">
      <div style={modalStyles.card}>
        <h2 style={{ margin: "0 0 20px 0", color: "white" }}>
          {isLoading ? "Procesando..." : "Confirmar Venta"}
        </h2>

        <div style={modalStyles.tabs}>
          <button 
            disabled={isLoading}
            onClick={() => { setIsPaid(true); setPaymentAmount(total.toString()); }}
            style={{ 
              ...modalStyles.tab, 
              backgroundColor: isPaid ? "#54C4F0" : "transparent",
              color: isPaid ? "#0F1115" : "white",
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Pagar Ahora
          </button>
          <button 
            disabled={isLoading}
            onClick={() => { setIsPaid(false); setPaymentAmount("0"); }}
            style={{ 
              ...modalStyles.tab, 
              backgroundColor: !isPaid ? "#E63946" : "transparent",
              color: "white",
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Dejar Pendiente
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={modalStyles.label}>Notas / Comentarios:</label>
          <textarea
            disabled={isLoading}
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            placeholder="Ej: Paga con transferencia, retirar mañana..."
            style={{ 
              ...modalStyles.textarea, 
              opacity: isLoading ? 0.6 : 1 
            }}
          />
        </div>

        {isPaid && (
          <div style={{ marginTop: 20 }}>
            <label style={modalStyles.label}>Efectivo entregado:</label>
            <input 
              disabled={isLoading}
              ref={inputRef}
              type="number"
              step="any"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ 
                ...modalStyles.input, 
                opacity: isLoading ? 0.6 : 1,
                borderColor: isLoading ? "rgba(255,255,255,0.1)" : "#54C4F0"
              }}
            />
            
            <div style={modalStyles.changeBox}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Vuelto:</span>
              <strong style={{ color: change >= 0 ? "#51cf66" : "#ff6b6b" }}>
                {formatCurrency(change < 0 ? 0 : change)}
              </strong>
            </div>
          </div>
        )}

        <div style={modalStyles.actions}>
          <button 
            onClick={onClose} 
            disabled={isLoading} 
            style={{ ...modalStyles.btnCancel, opacity: isLoading ? 0.5 : 1 }}
          >
            Cancelar
          </button>
          <button 
            disabled={isLoading}
            onClick={() => onConfirm(isPaid ? "PAID" : "PENDING", isPaid ? numericPayment : 0)}
            style={{ 
              ...modalStyles.btnConfirm, 
              backgroundColor: isLoading ? "#333" : "#54C4F0",
              color: isLoading ? "white" : "#0F1115",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isLoading ? "Guardando..." : `Confirmar ${isPaid ? "Pago" : "Pedido"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos se mantienen iguales (solo asegúrate de que modalStyles esté definido abajo)
const modalStyles = {
  overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  card: { backgroundColor: "#1A1D23", padding: 30, borderRadius: 16, width: "100%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.1)" },
  tabs: { display: "flex", gap: "10px", marginBottom: 20 },
  tab: { flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer", transition: "0.2s", fontWeight: "bold" as const },
  label: { display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 8 },
  input: { width: "100%", padding: "12px", backgroundColor: "#0F1115", border: "1px solid #54C4F0", borderRadius: "8px", color: "white", fontSize: "1.5rem", outline: "none", boxSizing: "border-box" as const },
  textarea: { 
    width: "100%", 
    minHeight: "80px", 
    padding: "12px", 
    backgroundColor: "#0F1115", 
    border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: "8px", 
    color: "white", 
    fontSize: "0.9rem", 
    outline: "none", 
    boxSizing: "border-box" as const, 
    resize: "none" as const,
    fontFamily: "inherit"
  },
  changeBox: { marginTop: 15, display: "flex", justifyContent: "space-between", fontSize: "1.2rem", color: "white" },
  actions: { marginTop: 30, display: "flex", gap: "12px" },
  btnCancel: { flex: 1, padding: "12px", background: "transparent", color: "white", border: "none", cursor: "pointer" },
  btnConfirm: { flex: 2, padding: "12px", background: "#54C4F0", color: "#0F1115", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }
};