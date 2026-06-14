import Order from "../models/Order.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";


const buildTimeline = (status) => {
  const currentStatus = String(status || "confirmed").toLowerCase();
  const currentIndex =
    currentStatus === "delivered"
      ? 3
      : currentStatus === "on the way"
        ? 2
        : currentStatus === "preparing" || currentStatus === "ready"
          ? 1
          : 0;

  const steps = [
    { label: "Confirmed", time: "Now" },
    { label: "Preparing", time: "10 mins" },
    { label: "On the Way", time: "25 mins" },
    { label: "Delivered", time: "---" },
  ];

  return steps.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
};

export const getAvailableOrders = async (req, res) => {
  try {
    // Delivery guys can see orders that are "Ready" and not yet assigned
    const orders = await Order.find({
      status: "Ready",
      deliveryGuyId: null,
      active: true,
    })
    .sort({ createdAt: -1 })
    .populate("userId", "name phone address")
    .populate("restaurantId", "name address");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch available orders", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const deliveryGuyId = req.user.id;
    const orders = await Order.find({
      deliveryGuyId: deliveryGuyId,
    })
    .sort({ createdAt: -1 })
    .populate("userId", "name phone address")
    .populate("restaurantId", "name address");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch my orders", error: error.message });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryGuyId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryGuyId) {
      return res.status(400).json({ message: "Order is already assigned to a delivery partner" });
    }

    order.deliveryGuyId = deliveryGuyId;
    await order.save();

    res.status(200).json({ message: "Order accepted successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept order", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const deliveryGuyId = req.user.id;

    const order = await Order.findOne({ _id: orderId, deliveryGuyId });

    if (!order) {
      return res.status(404).json({ message: "Order not found or not assigned to you" });
    }

    const validStatuses = ["On the way", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update for delivery partner" });
    }

    order.status = status;
    order.timeline = buildTimeline(status);

    if (status === "Delivered") {
      order.active = false;

      // Calculate rider payout: base fare ₹40 + 15% commission on order total
      const baseFare = 40;
      const commission = Math.round((order.total || 0) * 0.15);
      const payout = baseFare + commission;

      // Update delivery guy's balance and deliveries count
      const rider = await User.findById(deliveryGuyId);
      if (rider) {
        rider.walletBalance = (rider.walletBalance || 0) + payout;
        rider.deliveriesCount = (rider.deliveriesCount || 0) + 1;
        await rider.save();

        // Save transaction record
        const tx = new Transaction({
          userId: deliveryGuyId,
          type: "credit",
          title: `Delivery Earnings - ${order.orderCode || '#' + orderId.toString().slice(-6).toUpperCase()}`,
          amount: payout,
        });
        await tx.save();
      }
    }

    await order.save();

    // Emit live socket status update
    const io = req.app.get("io");
    if (io) {
      io.to(orderId.toString()).emit("orderStatusUpdated", order);
      console.log(`Socket emit orderStatusUpdated for order ${orderId} status ${status}`);
    }

    res.status(200).json({ message: `Order marked as ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      walletBalance: user.walletBalance ?? 0,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wallet details", error: error.message });
  }
};

export const withdrawFunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, method, upiId, bankAcc } = req.body;
    const amt = Number(amount);

    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ message: "Please enter a valid withdrawal amount" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentBalance = user.walletBalance ?? 0;
    if (amt > currentBalance) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct balance
    user.walletBalance = currentBalance - amt;
    await user.save();

    // Create transaction log
    const destination = method === "upi" ? `UPI ID: ${upiId}` : `Bank Account: ${bankAcc}`;
    const tx = new Transaction({
      userId,
      type: "debit",
      title: `Self Cash Out - ${destination}`,
      amount: amt,
    });
    await tx.save();

    res.status(200).json({
      message: "Withdrawal successful",
      walletBalance: user.walletBalance,
      transaction: tx,
    });
  } catch (error) {
    res.status(500).json({ message: "Withdrawal failed", error: error.message });
  }
};

export const getPerformanceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const count = user.deliveriesCount ?? 0;
    const rating = user.rating ?? 4.8;
    
    // Fallback metrics if not present
    const onTimeRate = user.onTimeRate ?? 96;
    const acceptanceRate = user.acceptanceRate ?? 98;
    const avgTime = 26;

    // Generate coordinates history for graphs
    const ratingHistory = [4.5, 4.6, 4.6, 4.8, 4.7, 4.9, rating - 0.1, rating + 0.1, rating].slice(-10);
    const speedHistory = [32, 30, 28, 29, 27, 26, 25, 27, 26, avgTime].slice(-10);

    res.status(200).json({
      rating,
      onTimeRate,
      acceptanceRate,
      avgTime,
      deliveriesCount: count,
      currentTier: count >= 50 ? "Gold" : count >= 20 ? "Silver" : "Bronze",
      nextTier: count >= 50 ? "Platinum" : count >= 20 ? "Gold" : "Silver",
      nextTierTarget: count >= 50 ? 100 : count >= 20 ? 50 : 20,
      ratingHistory,
      speedHistory,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch performance stats", error: error.message });
  }
};

export const getDeliverySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      vehicleDetails: user.vehicleDetails || { type: "motorcycle", number: "" },
      bankDetails: user.bankDetails || { bankName: "", accountNumber: "", ifscCode: "" },
      onlineStatus: user.onlineStatus ?? true,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings", error: error.message });
  }
};

export const updateDeliverySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleDetails, bankDetails, onlineStatus } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (vehicleDetails !== undefined) user.vehicleDetails = vehicleDetails;
    if (bankDetails !== undefined) user.bankDetails = bankDetails;
    if (onlineStatus !== undefined) user.onlineStatus = onlineStatus;

    await user.save();

    res.status(200).json({
      message: "Settings updated successfully",
      vehicleDetails: user.vehicleDetails,
      bankDetails: user.bankDetails,
      onlineStatus: user.onlineStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
};

