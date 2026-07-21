import { useEffect, useState } from 'react';
import { OrderPayStatus, type OrderModel, type PaymentMethod } from '../../../domain/types/orderTypes';
import { formatCurrency } from '../../../domain/utils/formats';
import { modalStyles } from '../../stock/styles/ModalStockStyles';
import { kpiLabel } from '../../dashboard/styles/Dashboard';
import { PaymentModeSelector } from './PaymentModeSelector';

interface Props {
  order: OrderModel;
  onClose: () => void;
  onConfirm: (
    status: OrderPayStatus,
    totalPayed: number,
    paymentMethod: PaymentMethod[]
  ) => void;
  isProcessing: boolean;
}

export const usePaymentCalculator = (total: number, initialMethods: PaymentMethod[] = []) => {
  // Montos que ya existían
  const initialCash = initialMethods.reduce((sum, m) => m.type === 'CASH' ? sum + m.amount : sum, 0);
  const initialTransfer = initialMethods.reduce((sum, m) => m.type === 'TRANSFER' ? sum + m.amount : sum, 0);

  // Lo nuevo que el usuario está escribiendo
  const [newCash, setNewCash] = useState(0);
  const [newTransfer, setNewTransfer] = useState(0);

  const totalPayed = initialCash + initialTransfer;
  const newPayed = newCash + newTransfer;
  const remaining = Math.max(0, total - totalPayed - newPayed);

  return {
    newCash, setNewCash,
    newTransfer, setNewTransfer,
    totalPayed, remaining, newPayed,
    initialCash, initialTransfer
  };
};

// 2. En el componente
export function OrderDetailModal({ order, onClose, onConfirm, isProcessing }: Props) {
  const [activeMode, setActiveMode] = useState<"CASH" | "TRANSFER" | "MIXED">("CASH");
  const { newCash, setNewCash, newTransfer, setNewTransfer, totalPayed, remaining, newPayed } = usePaymentCalculator(order.total, order.paymentMethod || []);

  const handleFinalConfirm = () => {
    const paymentMethods: PaymentMethod[] = order.paymentMethod ? [...order.paymentMethod] : [];

    // Sumamos lo anterior + lo nuevo
    const totalCash = newCash;
    const totalTransfer = newTransfer;

    if (totalCash > 0) paymentMethods.push({ type: 'CASH', amount: totalCash });
    if (totalTransfer > 0) paymentMethods.push({ type: 'TRANSFER', amount: totalTransfer });

    // Si totalPayed >= order.total, entonces se marca como COMPLETED
    const newStatus: OrderPayStatus = (totalPayed + newPayed >= order.total) ? OrderPayStatus.PAID : OrderPayStatus.PENDING;

    onConfirm(newStatus, newPayed, paymentMethods);
  };

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
  }, [activeMode, newCash, newTransfer]);


  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.content, maxWidth: '500px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Orden #{order.id}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </header>

        <div style={{ marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.9rem' }}>{item.quantity.toFixed(2)} x {item.article}</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '20px' }}>
         {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={kpiLabel}>DESCUENTO</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={kpiLabel}>TOTAL ORDEN</span>
            <span style={{ fontWeight: 700 }}>{formatCurrency(order.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={kpiLabel}>SALDO PENDIENTE</span>
            <span style={{ color: '#FF4B4B', fontWeight: 700 }}>{formatCurrency(remaining)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={kpiLabel}>COMENTARIOS</span>
            <span style={{ fontWeight: 600 }}>{order.comments || 'Ninguno'}</span>
          </div>
        </div>

        {order.payStatus == "PENDING" && (
          <>
            <PaymentModeSelector
              cash={newCash}
              transfer={newTransfer}
              setCash={setNewCash}
              setTransfer={setNewTransfer}
            />

            <div style={modalStyles.actions}>
              <button onClick={onClose} style={modalStyles.btnCancel}>
                Cancelar [Esc]
              </button>
              <button
                onClick={handleFinalConfirm}
                style={{
                  ...modalStyles.btnConfirm,
                  backgroundColor: remaining > 0 ? "#FFAB40" : "#54C4F0"
                }}
              >
                {isProcessing ? "Procesando..." : remaining > 0 ? `Pagar parcial [Enter]` : "Finalizar Venta [Enter]"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}