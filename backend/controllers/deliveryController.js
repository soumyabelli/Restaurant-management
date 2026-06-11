import Order from "../models/Order.js";

// Helper function to build timeline
const buildOrderTimeline = (status) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let label = "Order Placed";
  
  if (status === "Preparing") label = "Kitchen is preparing your order";
  else if (status === "Ready") label = "Your order is ready for pickup";
  else if (status === "On the way") label = "Out for delivery";
  else if (status === "Delivered") label = "Order delivered";
  else if (status === "Cancelled") label = "Order cancelled";

  return { label, time, state: "completed" };
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
    order.timeline.push(buildOrderTimeline(status));

    if (status === "Delivered") {
      order.active = false;
    }

    await order.save();

    res.status(200).json({ message: `Order marked as ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};
