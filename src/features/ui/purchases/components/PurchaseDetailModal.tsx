import { useMemo, useState } from 'react';
import type { PaymentMethod } from '../../../domain/types/orderTypes';
import type { Purchase } from '../../../domain/types/purchaseTypes';
import { formatCurrency } from '../../../domain/utils/formats';

interface PurchaseDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
  onConfirm?: (amount: number, paymentMethods: PaymentMethod[]) => Promise<void>;
  onConfirmReceive?: (updatedPurchase: Purchase, amountPaid: number, paymentMethods: PaymentMethod[]) => Promise<void>;
  onEditInScreen?: (purchase: Purchase) => void;
  isProcessing: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.72)',
  display: 'grid', placeItems: 'center', padding: 20,
};

const panelStyle: React.CSSProperties = {
  width: 'min(580px, 100%)', maxHeight: '90vh', overflowY: 'auto',
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

const secondaryButtonStyle: React.CSSProperties = {
  ...inputStyle, background: 'rgba(84,196,240,.12)', color: '#54C4F0',
  border: '1px solid rgba(84,196,240,.4)', cursor: 'pointer', fontWeight: 600,
};

const ghostButtonStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', background: 'transparent',
};

const monoStyle: React.CSSProperties = { fontFamily: 'monospace' };

export function PurchaseDetailModal({ purchase, onClose, onConfirm, onConfirmReceive, onEditInScreen, isProcessing }: PurchaseDetailModalProps) {
  const isDraft = purchase.status === 'DRAFT';
  const [cash, setCash] = useState(0);
  const [transfer, setTransfer] = useState(0);
  const [card, setCard] = useState(0);
  const [qr, setQr] = useState(0);
  const [error, setError] = useState('');

  const currentTotal = purchase.total;

  const paymentMethods = useMemo(() => [
    { type: 'CASH' as const, amount: cash },
    { type: 'TRANSFER' as const, amount: transfer },
    { type: 'CARD' as const, amount: card },
    { type: 'QR' as const, amount: qr },
  ].filter((method) => method.amount > 0), [cash, transfer, card, qr]);

  const newPayment = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const pendingBalance = Math.max(0, isDraft ? (currentTotal - newPayment) : (purchase.debt - newPayment));

  const handleConfirmAction = async () => {
    if (isDraft) {
      if (newPayment > currentTotal) {
        setError('El pago no puede superar el total de la compra.');
        return;
      }
      if (!onConfirmReceive) {
        setError('Acción no disponible.');
        return;
      }
      setError('');
      const updatedPurchase: Purchase = {
        ...purchase,
        payed: newPayment,
        debt: currentTotal - newPayment,
        payStatus: (currentTotal - newPayment) > 0 ? 'PENDING' : 'PAID',
        paymentMethod: paymentMethods.length ? paymentMethods : null,
      };
      await onConfirmReceive(updatedPurchase, newPayment, paymentMethods);
    } else {
      if (newPayment <= 0) {
        setError('Ingresa un importe para pagar.');
        return;
      }
      if (newPayment > purchase.debt) {
        setError('El pago supera el saldo pendiente de la compra.');
        return;
      }
      if (!onConfirm) {
        setError('Acción no disponible.');
        return;
      }
      setError('');
      await onConfirm(newPayment, paymentMethods);
    }
  };

  return <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="purchase-detail-title">
    <div style={panelStyle}>
      <header style={cardHeaderStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 id="purchase-detail-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.3px' }}>
              {isDraft ? `Recepcionar Pedido ${purchase.docId}` : `Compra ${purchase.docId}`}
            </h2>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: isDraft ? 'rgba(255,171,64,.15)' : 'rgba(128,224,176,.15)',
              color: isDraft ? '#FFAB40' : '#80E0B0',
            }}>
              {isDraft ? 'PEDIDO PENDIENTE DE RECEPCIÓN' : 'RECIBIDO'}
            </span>
          </div>
          <p style={{ opacity: .55, margin: '4px 0 0', fontSize: '0.85rem' }}>{new Date(purchase.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cerrar</button>
      </header>

      {isDraft && onEditInScreen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(84,196,240,.08)', border: '1px solid rgba(84,196,240,.25)', borderRadius: 6, padding: '10px 12px', marginBottom: 16 }}>
          <span style={{ fontSize: '0.82rem', color: '#54C4F0' }}>
            💡 ¿Necesitas modificar artículos o cantidades antes de ingresar?
          </span>
          <button
            type="button"
            onClick={() => onEditInScreen(purchase)}
            style={{ ...secondaryButtonStyle, padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            ✏️ Editar en Pantalla
          </button>
        </div>
      )}

      <section>
        <span style={sectionLabelStyle}>Artículos del pedido</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {purchase.items.map((item) => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '10px 0' }}>
              <div>
                {item.branch && <small style={{ display: 'block', opacity: .5, textTransform: 'uppercase', fontSize: '0.65rem' }}>{item.branch}</small>}
                <strong style={{ fontSize: '0.9rem' }}>{item.article}</strong>
                <small style={{ display: 'block', opacity: .5, marginTop: 2, fontSize: '0.75rem' }}>
                  {item.purchaseType === 'BULK' ? `${item.bulks} bulto(s) (${item.quantity} ${item.saleWeight ? 'kg' : 'unidades'})` : `${item.quantity} ${item.saleWeight ? 'kg' : 'unidades'}`} · {formatCurrency(item.unitCost)}/u
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
            <span style={{ opacity: .65 }}>Total Compra</span>
            <strong style={{ ...monoStyle, fontSize: '1.05rem', color: '#54C4F0' }}>{formatCurrency(currentTotal)}</strong>
          </div>
          {!isDraft && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ opacity: .65 }}>Pagado anteriormente</span>
              <strong style={{ ...monoStyle, color: '#80E0B0' }}>{formatCurrency(purchase.payed)}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ opacity: .65 }}>Saldo que quedará pendiente</span>
            <strong style={{ ...monoStyle, color: pendingBalance > 0 ? '#FFAB40' : '#80E0B0', fontSize: '1.05rem' }}>
              {formatCurrency(pendingBalance)}
            </strong>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <span style={sectionLabelStyle}>{isDraft ? 'Pago en este acto (opcional)' : 'Nuevo pago'}</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Efectivo', cash, setCash], ['Transferencia', transfer, setTransfer], ['Tarjeta', card, setCard], ['QR', qr, setQr]].map(([label, value, setter]) => (
            <label key={label as string} style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: .65, fontSize: '0.75rem' }}>{label as string}</span>
              <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" step="0.01" value={(value as number) || ''} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value) || 0)} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <span style={{ opacity: .65 }}>Monto a Abonar Ahora</span>
          <strong style={{ ...monoStyle, color: '#80E0B0', fontSize: '1.05rem' }}>{formatCurrency(newPayment)}</strong>
        </div>
      </section>

      {error && <p style={{ color: '#FF9A9A', margin: '14px 0 0', fontSize: '0.85rem' }}>{error}</p>}
      <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cancelar</button>
        <button
          type="button"
          onClick={() => void handleConfirmAction()}
          disabled={isProcessing}
          style={{ ...primaryButtonStyle, opacity: isProcessing ? .6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
        >
          {isProcessing ? 'Procesando...' : isDraft ? 'Confirmar Recepción e Ingresar a Stock' : 'Registrar pago'}
        </button>
      </footer>
    </div>
  </div>;
}

