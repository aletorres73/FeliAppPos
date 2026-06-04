import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./features/ui/MainLayout";
import OrderScreen from "./features/ui/orders/screens/OrdersScreen"; 
import CashFlowDashboard from "./features/ui/dashboard/screens/CashflowDashboard"; 
import SalesDashboard from "./features/ui/dashboard/screens/SalesDashboard";      

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Envolvemos todas las pantallas internas bajo el MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OrderScreen />} />
          <Route path="cashflow" element={<CashFlowDashboard />} />
          <Route path="reports" element={<SalesDashboard />} />
        </Route>
        
        {/* Aquí podrías poner rutas externas al dashboard si hiciera falta, ej: login */}
        {/* <Route path="/login" element={<Login />} /> */}

      </Routes>
    </BrowserRouter>
  );
}