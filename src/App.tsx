import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SalesDashboard from './features/ui/dashboard/screens/SalesDashboard'; // El nuevo componente
import OrderScreen from "./features/ui/orders/screens/OrdersScreen"
import CashFlowDashboard from './features/ui/dashboard/screens/CashflowDashboard';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderScreen />} />
        <Route path="/reports" element={<SalesDashboard />} />
        <Route path="/cashflow" element={<CashFlowDashboard />} />
      </Routes>
    </Router>
  );
};