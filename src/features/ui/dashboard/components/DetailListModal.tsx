import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../../../utils/formats';
import { type OrderModel } from '../../../domain/types/orderTypes';
import { type Expense } from '../../../domain/types/expenseTypes';

// Definimos la unión de tipos para los datos que puede mostrar el modal
type DetailItem = OrderModel | Expense;

interface DetailListModalProps {
  title: string;
  type: 'INGRESOS' | 'EGRESOS' | 'DEUDAS';
  items: DetailItem[];
  onClose: () => void;
  accentColor: string;
}

export const DetailListModal: React.FC<DetailListModalProps> = ({
  title,
  type,
  items,
  onClose,
  accentColor
}) => {
  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        {/* Header del Modal */}
        <header style={modalHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: accentColor }}>{title}</h3>
            <small style={{ color: 'rgba(255,255,255,0.3)' }}>
              {items.length} registros encontrados
            </small>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </header>

        {/* Lista de Transacciones Scrolleable */}
        <div style={listContainer}>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No hay movimientos en este periodo.</p>
          ) : (
            items.map((item, idx) => {
              // Lógica de mapeo según el tipo de dato
              const isOrder = 'total' in item;
              const date = new Date(item.createdAt);
              const amount = isOrder 
                ? (type === 'DEUDAS' ? item.total - item.payed : item.payed) 
                : item.amount;
              const concept = isOrder 
                ? `Orden #${item.id || 'Draft'} ${item.client ? `- ${item.client}` : ''}`
                : `[${item.category}] ${item.note || 'Sin nota'}`;

              return (
                <div key={idx} style={itemRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={itemConcept}>{concept}</span>
                    <span style={itemDate}>
                      {format(date, "dd/MM/yyyy HH:mm 'hs'", { locale: es })}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ ...itemAmount, color: accentColor }}>
                      {formatCurrency(amount)}
                    </span>
                    <div style={paymentBadge}>
                       {/* Aquí podrías mapear iconos de CASH/TRANSFER si lo deseas */}
                       {isOrder ? 'Venta' : 'Egreso'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// --- Estilos Inline con el Estándar Feli App ---
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(10,12,16,0.9)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1100,
  backdropFilter: 'blur(10px)'
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#1A1D23', width: '100%', maxWidth: '550px',
  maxHeight: '80vh', borderRadius: '24px', display: 'flex',
  flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
};

const modalHeader: React.CSSProperties = {
  padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const listContainer: React.CSSProperties = {
  padding: '10px 0', overflowY: 'auto', flex: 1
};

const itemRow: React.CSSProperties = {
  padding: '16px 32px', display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)',
  transition: '0.2s'
};

const itemConcept: React.CSSProperties = {
  fontSize: '0.95rem', fontWeight: 500, color: 'white'
};

const itemDate: React.CSSProperties = {
  fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase'
};

const itemAmount: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
  cursor: 'pointer', fontSize: '1.2rem'
};

const paymentBadge: React.CSSProperties = {
    fontSize: '0.65rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px'
}