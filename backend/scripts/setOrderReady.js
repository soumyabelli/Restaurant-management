import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const orderId = process.argv[2];
if (!orderId) {
  console.error("Usage: node setOrderReady.js <orderId>");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const order = await Order.findById(orderId);
    if (!order) {
      console.error("Order not found");
      process.exit(1);
    }

    order.status = "Ready";
    order.timeline = order.timeline || [];
    order.timeline.push({ label: "Ready", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), state: "current" });
    await order.save();

    console.log("Order updated to Ready:", order._id.toString());
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
