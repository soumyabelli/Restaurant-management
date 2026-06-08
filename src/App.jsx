import {  Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import EventBookingPage from "./pages/events/EventBookingPage";

import RestaurantLayout from "./pages/restaurant/RestaurantLayout";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import RestaurantMenuPage from "./pages/restaurant/RestaurantMenuPage";
import RestaurantCheckoutPage from "./pages/restaurant/RestaurantCheckoutPage";
import RestaurantReservationPage from "./pages/restaurant/RestaurantReservationPage";

import MenuManagementPage from "./pages/restaurant/MenuManagementPage";
import TotalOrdersPage from "./pages/restaurant/TotalOrdersPage";
import DeliveryPage from "./pages/restaurant/DeliveryPage";
import TotalCustomersPage from "./pages/restaurant/TotalCustomersPage";
import ReviewsPage from "./pages/restaurant/ReviewsPage";
import ReviewsAndRatingsPage from "./pages/restaurant/ReviewsAndRatingsPage";
import AnalyticsPage from "./pages/restaurant/AnalyticsPage";
import PayoutPage from "./pages/restaurant/PayoutPage";
import TotalReservationsPage from "./pages/restaurant/TotalReservationsPage";
import SettingsPage from "./pages/restaurant/SettingsPage";

import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
      <Routes>

        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/events/:id/book" element={<EventBookingPage />} />

        {/* Dashboard and other owner-level restaurant routes wrapped in Layout */}
        <Route path="/restaurant" element={<RestaurantLayout />}>
          <Route path="dashboard" element={<RestaurantDashboard />} />
          <Route path="menu-management" element={<MenuManagementPage />} />
          <Route path="orders" element={<TotalOrdersPage />} />
          <Route path="delivery" element={<DeliveryPage />} />
          <Route path="customers" element={<TotalCustomersPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="ratings" element={<ReviewsAndRatingsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="payout" element={<PayoutPage />} />
          <Route path="reservations" element={<TotalReservationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Public or customer-facing restaurant pages */}
        <Route path="/restaurant/:id/menu" element={<RestaurantMenuPage />} />
        <Route path="/restaurant/:id/checkout" element={<RestaurantCheckoutPage />} />
        <Route path="/restaurant/:id/reserve" element={<RestaurantReservationPage />} />

        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
  );
}

export default App;