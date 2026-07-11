import React from 'react';
import { useCustomerLedger } from '../hooks/useCustomerLedger';
import { CustomerSelectorModal } from '../../customers/components/CustomerSelectorModal';
import { formatCurrency } from '../../../domain/utils/formats';
import { cardStyle, kpiLabel, accentText, fullScreenCenter } from '../../dashboard/styles/Dashboard';
import { OrderPayStatus } from '../../../domain/types/orderTypes';

export default function CustomerLedgerScreen() {
  const { selectedCustomer, customerOrders, isLoading, selectCustomer, clearSelection } = useCustomerLedger();
  const [showSelector, setShowSelector] = React.useState(!selectedCustomer);

  if (isLoading && !selectedCustomer) {
    return <div style={fullScreenCenter}><span>CARGANDO CLIENTE...</span></div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Historial de Cliente</h2>
          <p style={{ opacity: 0.5 }}>Gestión de deudas y pagos pendientes</p>
        </div>
        <button 
          onClick={() => setShowSelector(true)}
          style={{ backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          {selectedCustomer ? 'CAMBIAR CLIENTE' : 'SELECCIONAR CLIENTE'}
        </button>
      </header>

      {selectedCustomer ? (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Panel Lateral: Info Cliente */}
          <div style={cardStyle}>
            <span style={kpiLabel}>CLIENTE</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 600, display: 'block', marginBottom: '16px' }}>
              {selectedCustomer.name} {selectedCustomer.lastname}
            </span>
            
            <span style={kpiLabel}>SALDO ACTUAL</span>
            <span style={{ 
              ...accentText, 
              color: selectedCustomer.currentBalance > 0 ? '#FF4B4B' : '#54C4F0' 
            }}>
              {formatCurrency(selectedCustomer.currentBalance)}
            </span>
          </div>

          {/* Panel Principal: Lista de Órdenes */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 20px 0', opacity: 0.8 }}>Últimos Movimientos</h3>
            {customerOrders.length === 0 ? (
              <p style={{ opacity: 0.4, textAlign: 'center', padding: '40px' }}>Este cliente no posee órdenes registradas.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '12px' }}>FECHA</th>
                    <th style={{ padding: '12px' }}>ID ÓRDEN</th>
                    <th style={{ padding: '12px' }}>ESTADO PAGO</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map(order => (
                    <tr key={order.docId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontFamily: 'monospace', opacity: 0.6 }}>
                        {order.docId.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          backgroundColor: order.payStatus === OrderPayStatus.PAID ? 'rgba(84, 196, 240, 0.1)' : 'rgba(255, 75, 75, 0.1)',
                          color: order.payStatus === OrderPayStatus.PAID ? '#54C4F0' : '#FF4B4B',
                          fontWeight: 700
                        }}>
                          {order.payStatus === OrderPayStatus.PAID ? 'PAGADA' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, alignItems: 'center', padding: '80px' }}>
          <p style={{ opacity: 0.4 }}>Por favor, seleccione un cliente para ver su estado de cuenta.</p>
        </div>
      )}

      {showSelector && (
        <CustomerSelectorModal 
          onClose={() => setShowSelector(false)} 
          onSelect={(c) => {
            selectCustomer(c);
            setShowSelector(false);
          }} 
        />
      )}
    </div>
  );
}