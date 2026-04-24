import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../../../utils/formats";
import type { PaymentMethod } from "../types/orderTypes";

// Definimos los tipos de pago

interface Props {
  total: number;
  // Actualizamos el confirm para que también devuelva el método
  onConfirm: (status: "PAID" | "PENDING", payment: number, method: PaymentMethod | null) => void;
  onClose: () => void;
  comments: string;
  onCommentsChange: (val: string) => void;
  isLoading: boolean;
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Solo hacemos focus si es pago en EFECTIVO
    if (isPaid && paymentMethod === "CASH" && !isLoading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isPaid, paymentMethod, isLoading]);

  // Si cambia a transferencia, seteamos el pago igual al total automáticamente
  // useEffect(() => {
  //   if (paymentMethod === "TRANSFER") {
  //     setPaymentAmount(total.toString());
  //   }
  // }, [paymentMethod, total]);

  const numericPayment = parseFloat(paymentAmount) || 0;
  const change = numericPayment - total;

  return (
    <div style={modalStyles.overlay} role="dialog">
      <div style={modalStyles.card}>
        <h2 style={{ margin: "0 0 20px 0", color: "white" }}>
          {isLoading ? "Procesando..." : "Confirmar Venta"}
        </h2>

        {/* Tabs Principales: Pago o Pendiente */}
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
            onClick={() => { setIsPaid(false); setPaymentAmount("0"); setPaymentMethod(null); }}
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

        {/* Selector de Método de Pago (Solo si isPaid es true) */}
        {isPaid && (
          <div style={{ marginBottom: 20 }}>
            <label style={modalStyles.label}>Método de Pago:</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={isLoading}
                onClick={() => setPaymentMethod("CASH")}
                style={{
                  ...modalStyles.methodBtn,
                  border: paymentMethod === "CASH" ? "2px solid #54C4F0" : "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: paymentMethod === "CASH" ? "rgba(84, 196, 240, 0.1)" : "transparent"
                }}
              >
                💵 Efectivo
              </button>
              <button
                disabled={isLoading}
                onClick={() => setPaymentMethod("TRANSFER")}
                style={{
                  ...modalStyles.methodBtn,
                  border: paymentMethod === "TRANSFER" ? "2px solid #54C4F0" : "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: paymentMethod === "TRANSFER" ? "rgba(84, 196, 240, 0.1)" : "transparent"
                }}
              >
                🏦 Transferencia
              </button>
            </div>
          </div>
        )}

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
            <label style={modalStyles.label}>
              {paymentMethod === "CASH" ? "Efectivo entregado:" : "Monto a transferir:"}
            </label>
            <input
              disabled={isLoading /*|| paymentMethod === "TRANSFER"*/}
              ref={inputRef}
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{
                ...modalStyles.input,
                opacity: (isLoading /*|| paymentMethod === "TRANSFER"*/) ? 0.6 : 1,
                borderColor: /*paymentMethod === "TRANSFER" ? "rgba(255,255,255,0.2)" :*/ "#54C4F0"
              }}
            />

            {paymentMethod === "CASH" && (
              <div style={modalStyles.changeBox}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Vuelto:</span>
                <strong style={{ color: change >= 0 ? "#51cf66" : "#ff6b6b" }}>
                  {formatCurrency(change < 0 ? 0 : change)}
                </strong>
              </div>
            )}
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
            onClick={() => onConfirm(isPaid ? "PAID" : "PENDING", isPaid ? numericPayment : 0, paymentMethod)}
            style={{
              ...modalStyles.btnConfirm,
              backgroundColor: isLoading ? "#333" : "#54C4F0",
              color: isLoading ? "white" : "#0F1115"
            }}
          >
            {isLoading ? "Guardando..." : `Confirmar ${isPaid ? "Pago" : "Pedido"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  card: { backgroundColor: "#1A1D23", padding: 30, borderRadius: 16, width: "100%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.1)" },
  tabs: { display: "flex", gap: "10px", marginBottom: 20 },
  tab: { flex: 1, padding: "6px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer", transition: "0.2s", fontWeight: "bold" as const },
  methodBtn: { flex: 1, padding: "4px", borderRadius: "8px", cursor: "pointer", color: "white", transition: "0.2s", fontSize: "0.85em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  label: { display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 8 },
  input: { width: "100%", padding: "12px", backgroundColor: "#0F1115", border: "1px solid #54C4F0", borderRadius: "8px", color: "white", fontSize: "1.5rem", outline: "none", boxSizing: "border-box" as const },
  textarea: { width: "100%", minHeight: "45px", padding: "12px", backgroundColor: "#0F1115", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: "0.85rem", outline: "none", resize: "none" as const, fontFamily: "inherit" },
  changeBox: { marginTop: 15, display: "flex", justifyContent: "space-between", fontSize: "1.2rem", color: "white" },
  actions: { marginTop: 30, display: "flex", gap: "12px" },
  btnCancel: { flex: 1, padding: "8px", background: "transparent", color: "white", border: "none", cursor: "pointer" },
  btnConfirm: { flex: 2, padding: "8px", background: "#54C4F0", color: "#0F1115", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }
};