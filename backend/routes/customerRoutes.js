import express from "express";

import protect from "../middleware/authMiddleware.js";
import {
  bookEvent,
  createOrder,
  createReservation,
  getDashboard,
  getEventBookings,
  getEvents,
  getFavorites,
  getNotifications,
  getOrders,
  getProfile,
  getReservations,
  getRestaurantById,
  getRestaurants,
  getWallet,
  markAllNotificationsRead,
  markNotificationRead,
  toggleFavorite,
  updateProfile,
} from "../controllers/customerController.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboard);
router.get("/wallet", getWallet);

router.get("/restaurants", getRestaurants);
router.get("/restaurants/:id", getRestaurantById);

router.get("/events", getEvents);
router.post("/events/book", bookEvent);
router.get("/events/bookings", getEventBookings);

router.get("/orders", getOrders);
router.post("/orders", createOrder);

router.get("/reservations", getReservations);
router.post("/reservations", createReservation);

router.get("/favorites", getFavorites);
router.post("/favorites/toggle", toggleFavorite);

router.get("/notifications", getNotifications);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:id/read", markNotificationRead);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
