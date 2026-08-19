import { useMemo, useState } from 'react';
import type { PaymentMethod } from '../../../domain/types/orderTypes';
import type { Purchase } from '../../../domain/types/purchaseTypes';
import { formatCurrency } from '../../../domain/utils/formats';

interface PurchaseDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
  onConfirm: (amount: number, paymentMethods: PaymentMethod[]) => Promise<void>;
  isProcessing: boolean;
}

const modalStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.72)',
  display: 'grid', placeItems: 'center', padding: 20,
};

const panelStyle: React.CSSProperties = {
  width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto',
  background: '#1A1D23', border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 8, color: 'white', padding: 24,
};

const inputStyle: React.CSSProperties = {
  background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 6, padding: '10px 12px', boxSizing: 'border-box',
};

export function PurchaseDetailModal({ purchase, onClose, onConfirm, isProcessing }: PurchaseDetailModalProps) {
  const [cash, setCash] = useState(0);
  const [transfer, setTransfer] = useState(0);
  const [card, setCard] = useState(0);
  const [qr, setQr] = useState(0);
  const [error, setError] = useState('');

  const paymentMethods = useMemo(() => [
    { type: 'CASH' as const, amount: cash },
    { type: 'TRANSFER' as const, amount: transfer },
    { type: 'CARD' as const, amount: card },
    { type: 'QR' as const, amount: qr },
  ].filter((method) => method.amount > 0), [cash, transfer, card, qr]);
  const newPayment = paymentMethods.reduce((sum, method) => sum + method.amount, 0);

  const handleConfirm = async () => {
    if (newPayment <= 0) {
      setError('Ingresa un importe para pagar.');
      return;
    }
    if (newPayment > purchase.debt) {
      setError('El pago supera el saldo pendiente de la compra.');
      return;
    }
    setError('');
    await onConfirm(newPayment, paymentMethods);
  };

  return <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="purchase-detail-title">
    <div style={panelStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <h2 id="purchase-detail-title" style={{ margin: 0 }}>Compra {purchase.docId}</h2>
          <p style={{ opacity: .55, margin: '6px 0 0' }}>{new Date(purchase.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
        <button type="button" onClick={onClose} style={{ ...inputStyle, cursor: 'pointer' }}>Cerrar</button>
      </header>

      <div style={{ marginTop: 20 }}>
        {purchase.items.map((item) => <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '10px 0' }}>
          <span>{item.article}<small style={{ display: 'block', opacity: .5 }}>{item.quantity} {item.saleWeight ? 'kg' : 'unidades'} · {formatCurrency(item.unitCost)}/u</small></span>
          <strong>{formatCurrency(item.subtotal)}</strong>
        </div>)}
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total</span><strong>{formatCurrency(purchase.total)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pagado</span><strong>{formatCurrency(purchase.payed)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFAB40' }}><span>Saldo pendiente</span><strong>{formatCurrency(purchase.debt)}</strong></div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ margin: '0 0 10px' }}>Nuevo pago</h3>
        {[['Efectivo', cash, setCash], ['Transferencia', transfer, setTransfer], ['Tarjeta', card, setCard], ['QR', qr, setQr]].map(([label, value, setter]) => <label key={label as string} style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
          <span style={{ opacity: .65 }}>{label as string}</span>
          <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" step="0.01" value={(value as number) || ''} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value) || 0)} />
        </label>)}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#80E0B0' }}><span>Nuevo pago</span><strong>{formatCurrency(newPayment)}</strong></div>
      </div>

      {error && <p style={{ color: '#FF9A9A', marginBottom: 0 }}>{error}</p>}
      <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button type="button" onClick={onClose} style={{ ...inputStyle, cursor: 'pointer' }}>Cancelar</button>
        <button type="button" onClick={() => void handleConfirm()} disabled={isProcessing} style={{ ...inputStyle, cursor: 'pointer', background: '#54C4F0', color: '#0F1115', fontWeight: 700 }}>{isProcessing ? 'Procesando...' : 'Registrar pago'}</button>
      </footer>
    </div>
  </div>;
}
