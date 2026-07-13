import { useCustomerLedger } from '../hooks/useCustomerLedger';
import { CustomerSelectorModal } from '../../customers/components/CustomerSelectorModal';
import { formatCurrency } from '../../../domain/utils/formats';
import { cardStyle, kpiLabel, accentText, fullScreenCenter } from '../../dashboard/styles/Dashboard';
import { OrderPayStatus } from '../../../domain/types/orderTypes';
import { type OrderModel } from "../../../domain/types/orderTypes";
import { useState } from "react";
import { customerRepository } from "../../../data/repositories/CustomerRepository";
import { OrderDetailModal } from '../components/OrderDetailModel';

export default function CustomerLedgerScreen() {
  const { selectedCustomer, customerOrders, isLoading, selectCustomer } = useCustomerLedger();
  const [showSelector, setShowSelector] = useState(!selectedCustomer);
  const [selectedOrder, setSelectedOrder] = useState<OrderModel | null>(null);

  if (isLoading && !selectedCustomer) {
    return <div style={fullScreenCenter}><span>CARGANDO CLIENTE...</span></div>;
  }

  const handlePaymentAction = async (amount: number) => {
    if (!selectedCustomer?.id || !selectedOrder?.docId) return;
    try {
      await customerRepository.registerOrderPayment(selectedCustomer.id, selectedOrder.docId, amount);
      // Refrescamos los datos llamando a la función de carga del hook
      await selectCustomer(selectedCustomer);
    } catch (e) {
      alert("Error al procesar el pago");
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* 1. Header Fijo */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '48px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Estado de Cuenta</h2>
          <p style={{ opacity: 0.5, margin: 0 }}>Historial de movimientos y saldos</p>
        </div>
        <button
          onClick={() => setShowSelector(true)}
          style={{ backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          {selectedCustomer ? 'CAMBIAR CLIENTE' : 'SELECCIONAR CLIENTE'}
        </button>
      </header>

      {selectedCustomer ? (
        <>
          {/* 2. Panel Superior: Datos del Cliente (Ancho completo y fijo) */}
          <div style={{ ...cardStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px' }}>
            <div>
              <span style={kpiLabel}>CLIENTE</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 600, display: 'block' }}>
                {selectedCustomer.name} {selectedCustomer.lastname}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={kpiLabel}>SALDO ACTUAL PENDIENTE</span>
              <span style={{
                ...accentText,
                fontSize: '2rem',
                color: selectedCustomer.currentBalance > 0 ? '#FF4B4B' : '#54C4F0'
              }}>
                {formatCurrency(selectedCustomer.currentBalance)}
              </span>
            </div>
          </div>

          {/* 3. Panel Inferior: Tabla de Órdenes con Scroll Interno */}
          <div style={{ ...cardStyle, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 20px 0', opacity: 0.8 }}>Últimos Movimientos</h3>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {customerOrders.length === 0 ? (
                <p style={{ opacity: 0.4, textAlign: 'center', padding: '40px' }}>No hay órdenes registradas.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1A1D23', zIndex: 10 }}>
                    <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '12px' }}>FECHA</th>
                      <th style={{ padding: '12px' }}>ID ÓRDEN</th>
                      <th style={{ padding: '12px' }}>ESTADO PAGO</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>TOTAL</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>PAGADO</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>SALDO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map(order => {
                      const orderBalance = order.total - (order.paymentMethod?.reduce((sum, pm) => sum + pm.amount, 0) || 0);
                      const paidAmount = order.paymentMethod?.reduce((sum, pm) => sum + pm.amount, 0) || 0;
                      const payStatus = orderBalance === 0 ? OrderPayStatus.PAID : OrderPayStatus.PENDING;
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                          <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                            {new Date(order.createdAt).toLocaleTimeString('ES-PE', { hour: '2-digit', minute: '2-digit' })} - {new Date(order.createdAt).toLocaleDateString('ES-PE')}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.8rem', fontFamily: 'monospace', opacity: 0.6 }}>
                            {order.id}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: payStatus === OrderPayStatus.PAID ? 'rgba(84, 196, 240, 0.1)' : 'rgba(255, 75, 75, 0.1)',
                              color: payStatus === OrderPayStatus.PAID ? '#54C4F0' : '#FF4B4B',
                              fontWeight: 700
                            }}>
                              {payStatus === OrderPayStatus.PAID ? 'PAGADA' : 'PENDIENTE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(order.total)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(paidAmount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(orderBalance)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{
                                background: 'transparent',
                                border: `1px solid ${order.payStatus === 'PAID' ? 'rgba(255,255,255,0.1)' : '#FF4B4B'}`,
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.7rem'
                              }}
                            >
                              {order.payStatus === 'PAID' ? 'VER' : 'ABONAR'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {/* Al final del componente */}
            {selectedOrder && (
              <OrderDetailModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onPayment={handlePaymentAction}
              />
            )}
          </div>
        </>
      ) : (
        <div style={{ ...cardStyle, alignItems: 'center', padding: '80px', flex: 1 }}>
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