import React, { useState, useEffect } from 'react';
import { type OrderModel } from '../orders/types/types'; // Importación según tu estructura 

const SalesDashboard: React.FC = () => {
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estilo de contenedor principal
  const dashboardStyle: React.CSSProperties = {
    backgroundColor: '#0F1115',
    minHeight: '100vh',
    color: '#FFFFFF',
    padding: '40px',
    fontFamily: 'system-ui, sans-serif'
  };

  return (
    <div style={dashboardStyle}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#54C4F0', fontSize: '28px' }}>Tablero de Control</h1>
        <p style={{ color: '#888' }}>Feli App - Reportes de Ventas</p>
      </header>

      {isLoading ? (
        <p>Cargando datos de 900 documentos...</p>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Aquí irán las tarjetas de KPI y los Rankings */}
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;