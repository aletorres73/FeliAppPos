import React, { useState } from 'react';
import { type OrderModel } from '../../../domain/types/orderTypes';
import { formatCurrency } from '../../../domain/utils/formats';
import { modalStyles } from '../../stock/styles/ModalStockStyles';
import { kpiLabel, accentText } from '../../dashboard/styles/Dashboard';

interface Props {
  order: OrderModel;
  onClose: () => void;
  onPayment: (amount: number) => Promise<void>;
}

export function OrderDetailModal({ order, onClose, onPayment }: Props) {
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const remaining = order.total - (order.payed || 0);

  const handleConfirm = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0 || amt > remaining) {
      alert("Monto inválido o supera el pendiente");
      return;
    }
    setIsSubmitting(true);
    await onPayment(amt);
    setIsSubmitting(false);
    onClose();
  };

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
              <span style={{ fontSize: '0.9rem' }}>{item.quantity}x {item.article}</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={kpiLabel}>TOTAL ORDEN</span>
            <span style={{ fontWeight: 700 }}>{formatCurrency(order.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={kpiLabel}>SALDO PENDIENTE</span>
            <span style={{ color: '#FF4B4B', fontWeight: 700 }}>{formatCurrency(remaining)}</span>
          </div>
        </div>

        {remaining > 0 && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Monto a abonar..."
              style={{ ...modalStyles.input, flex: 1, margin: 0 }}
            />
            <button 
              disabled={isSubmitting}
              onClick={handleConfirm}
              style={{ backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              {isSubmitting ? '...' : 'PAGAR'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}