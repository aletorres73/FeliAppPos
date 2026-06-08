import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./features/ui/navigation/MainLayout";
import { lazy } from "react";

const CashFlowDashboard = lazy(() => import("./features/ui/dashboard/screens/CashflowDashboard"));
const SalesDashboard = lazy(() => import("./features/ui/dashboard/screens/SalesDashboard"));
const OrderScreen = lazy(() => import("./features/ui/orders/screens/OrdersScreen"));
const StockScreen = lazy(() => import("./features/ui/stock/screen/StockScreen"));


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Envolvemos todas las pantallas internas bajo el MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OrderScreen />} />
          <Route path="cashflow" element={<CashFlowDashboard />} />
          <Route path="reports" element={<SalesDashboard />} />
          <Route path="stock" element={<StockScreen />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}