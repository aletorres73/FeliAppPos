import { useMemo, useState } from 'react';
import type { PaymentMethod } from '../../../domain/types/orderTypes';
import type { Purchase, PurchaseItem } from '../../../domain/types/purchaseTypes';
import { formatCurrency } from '../../../domain/utils/formats';

interface PurchaseDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
  onConfirm?: (amount: number, paymentMethods: PaymentMethod[]) => Promise<void>;
  onConfirmReceive?: (updatedPurchase: Purchase, amountPaid: number, paymentMethods: PaymentMethod[]) => Promise<void>;
  isProcessing: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.72)',
  display: 'grid', placeItems: 'center', padding: 20,
};

const panelStyle: React.CSSProperties = {
  width: 'min(640px, 100%)', maxHeight: '90vh', overflowY: 'auto',
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

export function PurchaseDetailModal({ purchase, onClose, onConfirm, onConfirmReceive, isProcessing }: PurchaseDetailModalProps) {
  const isDraft = purchase.status === 'DRAFT';
  const [items, setItems] = useState<PurchaseItem[]>(purchase.items);
  const [cash, setCash] = useState(0);
  const [transfer, setTransfer] = useState(0);
  const [card, setCard] = useState(0);
  const [qr, setQr] = useState(0);
  const [error, setError] = useState('');

  const currentTotal = isDraft ? items.reduce((sum, item) => sum + item.subtotal, 0) : purchase.total;

  const paymentMethods = useMemo(() => [
    { type: 'CASH' as const, amount: cash },
    { type: 'TRANSFER' as const, amount: transfer },
    { type: 'CARD' as const, amount: card },
    { type: 'QR' as const, amount: qr },
  ].filter((method) => method.amount > 0), [cash, transfer, card, qr]);

  const newPayment = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const pendingBalance = Math.max(0, isDraft ? (currentTotal - newPayment) : (purchase.debt - newPayment));

  const handlePriceChange = (index: number, newUnitCost: number) => {
    setItems((current) => current.map((item, idx) => {
      if (idx !== index) return item;
      const subtotalMultiplier = item.saleWeight ? 10 : 1;
      const subtotal = item.purchaseType === 'BULK' && item.bulkCost !== null
        ? Number(((item.bulks || 0) * (item.bulkCost || 0)).toFixed(2))
        : Number((item.quantity * newUnitCost * subtotalMultiplier).toFixed(2));

      return { ...item, unitCost: newUnitCost, subtotal };
    }));
  };

  const handleBulkCostChange = (index: number, newBulkCost: number) => {
    setItems((current) => current.map((item, idx) => {
      if (idx !== index) return item;
      const units = item.unitsPerBulk || 1;
      const unitCost = Number((newBulkCost / units).toFixed(4));
      const subtotal = Number(((item.bulks || 1) * newBulkCost).toFixed(2));
      return { ...item, bulkCost: newBulkCost, unitCost, subtotal };
    }));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    setItems((current) => current.map((item, idx) => {
      if (idx !== index) return item;
      const subtotalMultiplier = item.saleWeight ? 10 : 1;
      const subtotal = item.purchaseType === 'BULK' && item.bulkCost !== null
        ? Number(((item.bulks || 0) * (item.bulkCost || 0)).toFixed(2))
        : Number((newQuantity * item.unitCost * subtotalMultiplier).toFixed(2));

      return { ...item, quantity: newQuantity, subtotal };
    }));
  };

  const handleBulksChange = (index: number, newBulks: number) => {
    setItems((current) => current.map((item, idx) => {
      if (idx !== index) return item;
      const units = item.unitsPerBulk || 1;
      const quantity = newBulks * units;
      const subtotal = Number((newBulks * (item.bulkCost || 0)).toFixed(2));
      return { ...item, bulks: newBulks, quantity, subtotal };
    }));
  };

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
        items,
        total: currentTotal,
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

      {isDraft && (
        <div style={{ background: 'rgba(84,196,240,.08)', border: '1px solid rgba(84,196,240,.25)', borderRadius: 6, padding: '10px 12px', marginBottom: 16, fontSize: '0.85rem', color: '#54C4F0' }}>
          📦 Verifica o ajusta las cantidades recibidas y los costos reales antes de ingresar la mercadería al stock.
        </div>
      )}

      <section>
        <span style={sectionLabelStyle}>Artículos {isDraft ? '(Ajuste de llegada)' : ''}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '10px 0' }}>
              <div style={{ flex: 1.2 }}>
                {item.branch && <small style={{ display: 'block', opacity: .5, textTransform: 'uppercase', fontSize: '0.65rem' }}>{item.branch}</small>}
                <strong style={{ fontSize: '0.9rem' }}>{item.article}</strong>
              </div>

              {isDraft ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1.5, justifyContent: 'flex-end' }}>
                  {item.purchaseType === 'BULK' ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6rem', opacity: .55 }}>Bultos</span>
                        <input
                          style={{ ...inputStyle, width: 55, padding: '4px 6px', textAlign: 'center' }}
                          type="number"
                          min="1"
                          value={item.bulks}
                          onChange={(e) => handleBulksChange(index, Number(e.target.value) || 1)}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.6rem', opacity: .55 }}>$ Bulto</span>
                        <input
                          style={{ ...inputStyle, width: 80, padding: '4px 6px', textAlign: 'right' }}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.bulkCost ?? ''}
                          onChange={(e) => handleBulkCostChange(index, Number(e.target.value) || 0)}
                        />
                      </label>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6rem', opacity: .55 }}>Cant</span>
                        <input
                          style={{ ...inputStyle, width: 65, padding: '4px 6px', textAlign: 'center' }}
                          type="number"
                          min="0"
                          step={item.saleWeight ? '0.001' : '1'}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, Number(e.target.value) || 0)}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.6rem', opacity: .55 }}>$ Costo</span>
                        <input
                          style={{ ...inputStyle, width: 80, padding: '4px 6px', textAlign: 'right' }}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => handlePriceChange(index, Number(e.target.value) || 0)}
                        />
                      </label>
                    </div>
                  )}
                  <strong style={{ ...monoStyle, fontSize: '0.9rem', minWidth: 70, textAlign: 'right' }}>
                    {formatCurrency(item.subtotal)}
                  </strong>
                </div>
              ) : (
                <div style={{ textAlign: 'right' }}>
                  <small style={{ display: 'block', opacity: .5, fontSize: '0.75rem' }}>
                    {item.quantity} {item.saleWeight ? 'kg' : 'unidades'} · {formatCurrency(item.unitCost)}/u
                  </small>
                  <strong style={{ ...monoStyle, fontSize: '0.9rem' }}>{formatCurrency(item.subtotal)}</strong>
                </div>
              )}
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

