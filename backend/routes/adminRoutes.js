import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getAdminDashboardData,
  getAdminUsers,
  getAdminRestaurants,
  getAdminOrders,
  getAdminReservations,
  getAdminEvents,
} from "../controllers/adminController.js";

const router = express.Router();

// Protect all admin routes
router.use(protect);

router.get("/dashboard", getAdminDashboardData);
router.get("/users", getAdminUsers);
router.get("/restaurants", getAdminRestaurants);
router.get("/orders", getAdminOrders);
router.get("/reservations", getAdminReservations);
router.get("/events", getAdminEvents);

export default router;
