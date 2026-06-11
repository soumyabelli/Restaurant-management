import express from "express";
import protect from "../middleware/authMiddleware.js";
import { 
  getRestaurantDashboard, 
  getRestaurantOrders,
  getRestaurantMenu,
  addMenuItem,
  updateMenuItem,
  getRestaurantReservations,
  getRestaurantCustomers,
  getRestaurantReviews,
  updateOrderStatus
} from "../controllers/restaurantController.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard", getRestaurantDashboard);
router.get("/menu", getRestaurantMenu);
router.get("/orders", getRestaurantOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.post("/menu", addMenuItem);
router.put("/menu/:itemId", updateMenuItem);
router.get("/reservations", getRestaurantReservations);
router.get("/customers", getRestaurantCustomers);
router.get("/reviews", getRestaurantReviews);

export default router;
