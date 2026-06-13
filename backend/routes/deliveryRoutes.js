import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getAvailableOrders,
  getMyOrders,
  acceptOrder,
  updateOrderStatus,
  getWalletDetails,
  withdrawFunds,
} from "../controllers/deliveryController.js";

const router = express.Router();

// All delivery routes are protected
router.use(protect);

router.get("/available", getAvailableOrders);
router.get("/my-orders", getMyOrders);
router.post("/:orderId/accept", acceptOrder);
router.put("/:orderId/status", updateOrderStatus);

// Wallet routes
router.get("/wallet", getWalletDetails);
router.post("/wallet/withdraw", withdrawFunds);

export default router;
