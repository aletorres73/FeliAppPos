import OrderScreen from "./features/orders/screens/OrdersScreen"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SalesDashboard from './features/orders/screens/SalesDashboard'; // El nuevo componente


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderScreen />} />
        <Route path="/reports" element={<SalesDashboard />} />
      </Routes>
    </Router>
  );
};