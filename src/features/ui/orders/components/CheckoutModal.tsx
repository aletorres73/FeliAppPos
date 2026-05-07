import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../../../../utils/formats";
import { type PaymentType, type PaymentMethod } from "../../../domain/types/orderTypes";

interface Props {
  total: number;
  // Ajustamos onConfirm para enviar el desglose completo
  onConfirm: (
    status: "PAID" | "PENDING",
    totalPayed: number,
    paymentMethod: PaymentMethod[] | null// Método principal o "MIXED"
  ) => void;
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
  // Estados para montos específicos
  const [cashAmount, setCashAmount] = useState<string>(total.toString());
  const [transferAmount, setTransferAmount] = useState<string>("0");

  // Tipo de operación: "TOTAL" (paga todo) o "PARTIAL" (paga una parte)
  // const [paymentType, setPaymentType] = useState<"TOTAL" | "PARTIAL">("TOTAL");
  const [activeMode, setActiveMode] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");

  const cashInputRef = useRef<HTMLInputElement>(null);

  // Lógica de reseteo al cambiar de modo
  useEffect(() => {
    if (activeMode === "CASH") {
      setCashAmount(total.toString());
      setTransferAmount("0");
    } else if (activeMode === "TRANSFER") {
      setCashAmount("0");
      setTransferAmount(total.toString());
    } else {
      // MIXED: dejamos que el usuario edite ambos, pero inicializamos 50/50
      setCashAmount((total / 2).toString());
      setTransferAmount((total / 2).toString());
    }
  }, [activeMode, total]);

  const numCash = parseFloat(cashAmount) || 0;
  const numTransfer = parseFloat(transferAmount) || 0;

  const paymentType: PaymentMethod[] = [];

  if(numCash > 0 ) paymentType.push({ type: "CASH" as PaymentType, amount: numCash });
  if(numTransfer > 0) paymentType.push({ type: "TRANSFER" as PaymentType, amount: numTransfer });

  const totalPayed = numCash + numTransfer;
  const remanente = total - totalPayed;
  const vuelto = numCash > (total - numTransfer) ? numCash - (total - numTransfer) : 0;

  const handleFinalConfirm = () => {
    const status = totalPayed >= total ? "PAID" : "PENDING";
    // El paymentMethod enviado es para el reporte (CASH, TRANSFER o MIXED)
    onConfirm(status, totalPayed, paymentType.length > 0 ? paymentType : null);
  };

  return (
    <div style={modalStyles.overlay} role="dialog">
      <div style={modalStyles.card}>
        <h2 style={{ margin: "0 0 20px 0", color: "white", fontSize: '1.4rem' }}>
          {isLoading ? "Procesando..." : "Finalizar Venta"}
        </h2>

        {/* 1. Selector de Modo de Pago */}
        <label style={modalStyles.label}>Forma de Pago:</label>
        <div style={modalStyles.tabs}>
          {["CASH", "TRANSFER", "MIXED"].map((mode) => (
            <button
              key={mode}
              disabled={isLoading}
              onClick={() => setActiveMode(mode as any)}
              style={{
                ...modalStyles.tab,
                backgroundColor: activeMode === mode ? "#54C4F0" : "transparent",
                color: activeMode === mode ? "#0F1115" : "white",
                borderColor: activeMode === mode ? "#54C4F0" : "rgba(255,255,255,0.1)"
              }}
            >
              {mode === "CASH" ? "Efectivo" : mode === "TRANSFER" ? "Transf." : "Mixto"}
            </button>
          ))}
        </div>

        {/* 2. Inputs Dinámicos según el modo */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {(activeMode === "CASH" || activeMode === "MIXED") && (
            <div style={{ flex: 1 }}>
              <label style={modalStyles.label}>Monto Efectivo:</label>
              <input
                ref={cashInputRef}
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                style={modalStyles.inputSmall}
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
          {(activeMode === "TRANSFER" || activeMode === "MIXED") && (
            <div style={{ flex: 1 }}>
              <label style={modalStyles.label}>Monto Transf.:</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                style={modalStyles.inputSmall}
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
        </div>

        {/* 3. Resumen de Pago */}
        <div style={modalStyles.summaryBox}>
          <div style={modalStyles.summaryRow}>
            <span>Total Venta:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div style={modalStyles.summaryRow}>
            <span>Total Abonado:</span>
            <span style={{ color: "#54C4F0" }}>{formatCurrency(totalPayed)}</span>
          </div>
          {remanente > 0 ? (
            <div style={modalStyles.summaryRow}>
              <span style={{ color: "#FF5252" }}>Deuda Restante:</span>
              <span style={{ color: "#FF5252", fontWeight: 'bold' }}>{formatCurrency(remanente)}</span>
            </div>
          ) : (
            <div style={modalStyles.summaryRow}>
              <span>Vuelto (Efectivo):</span>
              <span style={{ color: "#51cf66", fontWeight: 'bold' }}>{formatCurrency(vuelto)}</span>
            </div>
          )}
        </div>

        {/* 4. Comentarios */}
        <div style={{ marginBottom: 20 }}>
          <label style={modalStyles.label}>Notas de la venta:</label>
          <textarea
            disabled={isLoading}
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            placeholder="Agregar comentarios..."
            style={modalStyles.textarea}
          />
        </div>

        {/* 5. Acciones */}
        <div style={modalStyles.actions}>
          <button onClick={onClose} disabled={isLoading} style={modalStyles.btnCancel}>
            Cancelar
          </button>
          <button
            disabled={isLoading /* || totalPayed === 0 */}
            onClick={handleFinalConfirm}
            style={{
              ...modalStyles.btnConfirm,
              backgroundColor: remanente > 0 ? "#FFAB40" : "#54C4F0" // Naranja si es parcial
            }}
          >
            {isLoading ? "Guardando..." :
              remanente === total ? "Pendiente" :
              remanente > 0 ? "Pago Parcial" : "Finalizar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  // ... (overlay y card se mantienen iguales)
  overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  card: { backgroundColor: "#1A1D23", padding: 30, borderRadius: 16, width: "100%", maxWidth: "450px", border: "1px solid rgba(255,255,255,0.1)" },
  tabs: { display: "flex", gap: "8px", marginBottom: 20 },
  tab: { flex: 1, padding: "10px", border: "1px solid", borderRadius: "8px", cursor: "pointer", transition: "0.2s", fontSize: "0.85rem", fontWeight: "bold" as const },
  label: { display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const },
  inputSmall: { width: "100%", padding: "10px", backgroundColor: "#0F1115", border: "1px solid #54C4F0", borderRadius: "8px", color: "white", fontSize: "1.1rem", outline: "none", boxSizing: "border-box" as const },
  textarea: { width: "100%", minHeight: "60px", padding: "12px", backgroundColor: "#0F1115", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: "0.85rem", outline: "none", resize: "none" as const, fontFamily: "inherit" },
  summaryBox: { backgroundColor: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "0.9rem" },
  actions: { display: "flex", gap: "12px" },
  btnCancel: { flex: 1, padding: "12px", background: "transparent", color: "white", border: "none", cursor: "pointer" },
  btnConfirm: { flex: 2, padding: "12px", color: "#0F1115", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }
};