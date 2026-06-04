import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../../../utils/formats';
import { type OrderModel } from '../../../domain/types/orderTypes';
import { type Expense } from '../../../domain/types/expenseTypes';

type IncomeOrder = OrderModel & { clientName?: string };

type DetailItem = IncomeOrder | Expense;

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

              // --- NUEVO: Traductor y Limpiador de Categorías de Egresos ---
              const traducirCategoria = (cat: string) => {
                const diccionario: Record<string, string> = {
                  SUPPLIER: 'Proveedor',
                  SERVICES: 'Servicios',
                  SALARY: 'Sueldos',
                  EXPENSE: 'Gasto General',
                  TAX: 'Impuestos',
                  RENT: 'Alquiler'
                };
                return diccionario[cat.toUpperCase()] || cat;
              };

              // Definición limpia de Concepto y Badge de categoría
              const concept = isOrder
                ? `Orden #${item.id || 'Draft'}`
                : (item.note || 'Sin nota');

              const categoryLabel = !isOrder ? traducirCategoria(item.category) : null;

              const clientName = isOrder && item.clientName ? ` ${item.clientName}` : '';
              const orderItems = isOrder && 'items' in item ? item.items : [];

              return (
                <div key={idx} style={itemRow}>
                  {/* CONTENEDOR IZQUIERDO: Todo alineado al inicio (flex-start) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, alignItems: 'flex-start' }}>

                    {/* Concepto Principal */}
                    <span style={itemConcept}>{concept.trim()}</span>

                    {/* Badge de Categoría (Solo para Egresos) */}
                    {categoryLabel && (
                      <span style={categoryTag}>
                        {categoryLabel}
                      </span>
                    )}

                    {/* Nombre del Cliente (Solo para Órdenes) */}
                    {clientName && (
                      <span style={{ ...itemDate, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>
                        Cliente: {clientName}
                      </span>
                    )}

                    {/* Listado de Productos (Solo para Órdenes) */}
                    {isOrder && orderItems && orderItems.length > 0 && (
                      <div style={productsDetailsContainer}>
                        {orderItems.map((prod: any, pIdx: number) => (
                          <div key={pIdx} style={productDetailRow}>
                            <span>
                              {prod.article} {prod.branch ? `(${prod.branch})` : ''}
                              <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>
                                x{prod.quantity}
                              </span>
                            </span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              {formatCurrency(prod.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fecha y Hora del movimiento */}
                    <span style={itemDate}>
                      {format(date, "dd/MM/yyyy HH:mm 'hs'", { locale: es })}
                    </span>
                  </div>

                  {/* CONTENEDOR DERECHO: Monto e indicador de tipo */}
                  <div style={{ textAlign: 'right', alignSelf: 'flex-start', minWidth: '100px' }}>
                    <span style={{ ...itemAmount, color: accentColor }}>
                      {formatCurrency(amount)}
                    </span>
                    <div style={paymentBadge}>
                      {isOrder ? (type === 'DEUDAS' ? 'Deuda Cta' : 'Venta') : 'Egreso'}
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

// --- Estilos Inline Modificados e Inyectados con el Estándar Feli App ---
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(10,12,16,0.9)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1100,
  backdropFilter: 'blur(10px)'
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#1A1D23', width: '100%', maxWidth: '700px',
  maxHeight: '80vh', borderRadius: '24px', display: 'flex',
  flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
};

const modalHeader: React.CSSProperties = {
  padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const listContainer: React.CSSProperties = {
  padding: '10px 25px', overflowY: 'auto', flex: 1
};

const itemRow: React.CSSProperties = {
  padding: '18px 8px', 
  display: 'flex', 
  justifyContent: 'space-between',
  alignItems: 'flex-start', // Mantiene los montos alineados al tope de la fila
  borderBottom: '1px solid rgba(255,255,255,0.03)',
  gap: '16px'
};

const itemConcept: React.CSSProperties = {
  fontSize: '1rem', 
  fontWeight: 600, 
  color: 'white',
  textAlign: 'left' // Fuerza la alineación al inicio
};

const itemDate: React.CSSProperties = {
  fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '2px'
};

const itemAmount: React.CSSProperties = {
  fontSize: '1.05rem', fontWeight: 700
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
  cursor: 'pointer', fontSize: '1.2rem'
};

const paymentBadge: React.CSSProperties = {
  fontSize: '0.65rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px'
};

// --- NUEVOS ESTILOS PARA LOS ARTÍCULOS DETALLADOS ---
const productsDetailsContainer: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderLeft: '2px solid rgba(84, 196, 240, 0.3)', // Detalle azul sutil Feli App
  padding: '8px 12px',
  borderRadius: '4px',
  marginTop: '6px',
  marginBottom: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const productDetailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.82rem',
  color: 'rgba(255, 255, 255, 0.7)',
  fontFamily: 'Inter, sans-serif'
};

const categoryTag: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.7rem',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'inline-block',
  marginTop: '2px',
  marginBottom: '2px'
};