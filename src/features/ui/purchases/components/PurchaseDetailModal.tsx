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

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.72)',
  display: 'grid', placeItems: 'center', padding: 20,
};

const panelStyle: React.CSSProperties = {
  width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto',
  background: '#1A1D23', border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 8, color: 'white', padding: 24,
};

const inputStyle: React.CSSProperties = {
  background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 6, padding: '10px 12px', boxSizing: 'border-box',
};

const sectionLabelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 8, opacity: .65, fontSize: '0.7rem',
  letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600,
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.08)',
};

const primaryButtonStyle: React.CSSProperties = {
  ...inputStyle, background: '#54C4F0', color: '#0F1115', fontWeight: 700,
  cursor: 'pointer', border: 'none',
};

const ghostButtonStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', background: 'transparent',
};

const monoStyle: React.CSSProperties = { fontFamily: 'monospace' };

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

  return <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="purchase-detail-title">
    <div style={panelStyle}>
      <header style={cardHeaderStyle}>
        <div>
          <h2 id="purchase-detail-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.3px' }}>Compra {purchase.docId}</h2>
          <p style={{ opacity: .55, margin: '4px 0 0', fontSize: '0.85rem' }}>{new Date(purchase.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cerrar</button>
      </header>

      <section>
        <span style={sectionLabelStyle}>Artículos</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {purchase.items.map((item) => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '10px 0' }}>
              <div>
                <span style={{ fontSize: '0.9rem' }}>{item.article}</span>
                <small style={{ display: 'block', opacity: .5, marginTop: 2, fontSize: '0.75rem' }}>
                  {item.quantity} {item.saleWeight ? 'kg' : 'unidades'} · {formatCurrency(item.unitCost)}/u
                </small>
              </div>
              <strong style={{ ...monoStyle, fontSize: '0.9rem' }}>{formatCurrency(item.subtotal)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <span style={sectionLabelStyle}>Resumen</span>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ opacity: .65 }}>Total</span>
            <strong style={{ ...monoStyle, fontSize: '1.05rem' }}>{formatCurrency(purchase.total)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ opacity: .65 }}>Pagado</span>
            <strong style={{ ...monoStyle, color: '#80E0B0' }}>{formatCurrency(purchase.payed)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ opacity: .65 }}>Saldo pendiente</span>
            <strong style={{ ...monoStyle, color: '#FFAB40', fontSize: '1.05rem' }}>{formatCurrency(purchase.debt)}</strong>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <span style={sectionLabelStyle}>Nuevo pago</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Efectivo', cash, setCash], ['Transferencia', transfer, setTransfer], ['Tarjeta', card, setCard], ['QR', qr, setQr]].map(([label, value, setter]) => (
            <label key={label as string} style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: .65, fontSize: '0.75rem' }}>{label as string}</span>
              <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" step="0.01" value={(value as number) || ''} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value) || 0)} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <span style={{ opacity: .65 }}>Nuevo pago</span>
          <strong style={{ ...monoStyle, color: '#80E0B0', fontSize: '1.05rem' }}>{formatCurrency(newPayment)}</strong>
        </div>
      </section>

      {error && <p style={{ color: '#FF9A9A', margin: '14px 0 0', fontSize: '0.85rem' }}>{error}</p>}
      <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cancelar</button>
        <button type="button" onClick={() => void handleConfirm()} disabled={isProcessing} style={{ ...primaryButtonStyle, opacity: isProcessing ? .6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
          {isProcessing ? 'Procesando...' : 'Registrar pago'}
        </button>
      </footer>
    </div>
  </div>;
}
