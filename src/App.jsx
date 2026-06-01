import {  Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
      <Routes>

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/customer/dashboard"
          element={<CustomerDashboard />}
        />

        <Route
          path="/restaurant/dashboard"
          element={<RestaurantDashboard />}
        />

        <Route
          path="/delivery/dashboard"
          element={<DeliveryDashboard />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
  );
}

export default App;