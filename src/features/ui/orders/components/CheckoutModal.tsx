import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../../../domain/utils/formats";
import { type PaymentType, type PaymentMethod } from "../../../domain/types/orderTypes";
import {type Customer } from "../../../domain/types/customersTypes";

interface Props {
  customerSelected: Customer,
  total: number;
  onConfirm: (
    status: "PAID" | "PENDING",
    totalPayed: number,
    paymentMethod: PaymentMethod[] | null
  ) => void;
  onClose: () => void;
  comments: string;
  onCommentsChange: (val: string) => void;
  isLoading: boolean;
}

export function CheckoutModal({
  customerSelected,
  total,
  onConfirm,
  onClose,
  comments,
  onCommentsChange,
  isLoading }: Props) {

  const [cashAmount, setCashAmount] = useState<string>(total.toString());
  const [transferAmount, setTransferAmount] = useState<string>("0");
  const [activeMode, setActiveMode] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");

  const cashInputRef = useRef<HTMLInputElement>(null);
  const transferInputRef = useRef<HTMLInputElement>(null);
  const numCash = parseFloat(cashAmount) || 0;
  const numTransfer = parseFloat(transferAmount) || 0;

  const paymentType: PaymentMethod[] = [];
  if (numCash > 0) paymentType.push({ type: "CASH" as PaymentType, amount: numCash });
  if (numTransfer > 0) paymentType.push({ type: "TRANSFER" as PaymentType, amount: numTransfer });

  const totalPayed = numCash + numTransfer;
  const remanente = total - totalPayed;
  const vuelto = numCash > (total - numTransfer) ? numCash - (total - numTransfer) : 0;

  const customerName = customerSelected.name + ' ' + customerSelected.lastname

  // Lógica de reseteo al cambiar de modo
  useEffect(() => {
    if (activeMode === "CASH") {
      setCashAmount(total.toString());
      setTransferAmount("0");
      setTimeout(() => cashInputRef.current?.focus(), 50);
    } else if (activeMode === "TRANSFER") {
      setCashAmount("0");
      setTransferAmount(total.toString());
      setTimeout(() => transferInputRef.current?.focus(), 50);
    } else {
      // MIXED: Inicializamos con todo en 0 para que el usuario empiece a tipear en uno,
      // o podrías dejarlo en 50/50. Lo dejamos en 0 y Total para mejor UX inicial.
      setCashAmount("0");
      setTransferAmount(total.toString());
      setTimeout(() => cashInputRef.current?.focus(), 50);
    }
  }, [activeMode, total]);

  // --- NUEVO: Manejadores dinámicos para calcular el resto automáticamente ---
  const handleCashChange = (val: string) => {
    setCashAmount(val);
    if (activeMode === "MIXED") {
      const parsedCash = parseFloat(val) || 0;
      // Calculamos lo que falta para llegar al total
      const remaining = total - parsedCash;
      // Si el efectivo supera el total (hay vuelto), la transferencia es 0
      setTransferAmount(remaining > 0 ? remaining.toString() : "0");
    }
  };

  const handleTransferChange = (val: string) => {
    setTransferAmount(val);
    if (activeMode === "MIXED") {
      const parsedTransfer = parseFloat(val) || 0;
      const remaining = total - parsedTransfer;
      setCashAmount(remaining > 0 ? remaining.toString() : "0");
    }
  };

  const handleFinalConfirm = () => {
    if (isLoading) return;
    if (customerSelected.id == null) {
      alert('No se puede asignar deuda a consumidor final, seleccionar existente o crear uno nuevo.')
      return
    }

    const status = totalPayed >= total ? "PAID" : "PENDING";
    onConfirm(status, totalPayed, paymentType.length > 0 ? paymentType : null);
  };

  // Atajos de teclado del Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          setActiveMode("CASH");
          break;
        case "F2":
          e.preventDefault();
          setActiveMode("TRANSFER");
          break;
        case "F3":
          e.preventDefault();
          setActiveMode("MIXED");
          break;
        case "Enter":
          e.preventDefault();
          handleFinalConfirm();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMode, numCash, numTransfer, isLoading]);

  return (
    <div style={modalStyles.overlay} role="dialog">
      <div style={modalStyles.card}>
        <h2 style={{ margin: "0 0 20px 0", color: "white", fontSize: '1.4rem' }}>
          {isLoading ? "Procesando..." : "Finalizar Venta"}
        </h2>

        <label style={{...modalStyles.label, color: "white" }}>Cliente seleccionado: {customerName}</label>

        <label style={modalStyles.label}>Forma de Pago:</label>
        <div style={modalStyles.tabs}>
          <button
            disabled={isLoading}
            onClick={() => setActiveMode("CASH")}
            style={getTabStyle("CASH", activeMode)}
          >
            Efectivo [F1]
          </button>
          <button
            disabled={isLoading}
            onClick={() => setActiveMode("TRANSFER")}
            style={getTabStyle("TRANSFER", activeMode)}
          >
            Transf. [F2]
          </button>
          <button
            disabled={isLoading}
            onClick={() => setActiveMode("MIXED")}
            style={getTabStyle("MIXED", activeMode)}
          >
            Mixto [F3]
          </button>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {(activeMode === "CASH" || activeMode === "MIXED") && (
            <div style={{ flex: 1 }}>
              <label style={modalStyles.label}>Monto Efectivo:</label>
              <input
                ref={cashInputRef}
                type="number"
                value={cashAmount}
                onChange={(e) => handleCashChange(e.target.value)} // <-- Cambiado
                style={modalStyles.inputSmall}
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
          {(activeMode === "TRANSFER" || activeMode === "MIXED") && (
            <div style={{ flex: 1 }}>
              <label style={modalStyles.label}>Monto Transf.:</label>
              <input
                ref={transferInputRef}
                type="number"
                value={transferAmount}
                onChange={(e) => handleTransferChange(e.target.value)} // <-- Cambiado
                style={modalStyles.inputSmall}
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
        </div>

        {/* El resto del JSX (Resumen, Comentarios, Botones) se mantiene idéntico */}
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

        <div style={modalStyles.actions}>
          <button onClick={onClose} disabled={isLoading} style={modalStyles.btnCancel}>
            Cancelar [Esc]
          </button>
          <button
            disabled={isLoading}
            onClick={handleFinalConfirm}
            style={{
              ...modalStyles.btnConfirm,
              backgroundColor: remanente > 0 ? "#FFAB40" : "#54C4F0"
            }}
          >
            {isLoading ? "Guardando..." :
              remanente === total ? "Pendiente [Enter]" :
                remanente > 0 ? "Pago Parcial [Enter]" : "Finalizar Venta [Enter]"}
          </button>
        </div>
      </div>
    </div>
  );
}

const getTabStyle = (mode: string, activeMode: string) => ({
  ...modalStyles.tab,
  backgroundColor: activeMode === mode ? "#54C4F0" : "transparent",
  color: activeMode === mode ? "#0F1115" : "white",
  borderColor: activeMode === mode ? "#54C4F0" : "rgba(255,255,255,0.1)"
});

const modalStyles = {
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