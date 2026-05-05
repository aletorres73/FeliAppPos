import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const SalesDashboard = lazy(() => import('./features/ui/dashboard/screens/SalesDashboard'));
const OrderScreen = lazy(() => import('./features/ui/orders/screens/OrdersScreen'));
const CashFlowDashboard = lazy(() => import('./features/ui/dashboard/screens/CashflowDashboard'));


export default function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ color: '#54C4F0' }}>Cargando Feli App...</div>}>
        <Routes>
          <Route path="/" element={<OrderScreen />} />
          <Route path="/reports" element={<SalesDashboard />} />
          <Route path="/cashflow" element={<CashFlowDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
};