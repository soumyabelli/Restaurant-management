import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    name: String,
    price: Number,
    quantity: Number,
    emoji: String,
  },
  {
    _id: false,
  }
);

const orderTimelineSchema = new mongoose.Schema(
  {
    label: String,
    time: String,
    state: String,
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    deliveryGuyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    restaurantName: String,
    restaurantEmoji: String,
    restaurantImageKey: String,
    cuisine: [
      {
        type: String,
      },
    ],
    items: [orderItemSchema],
    subtotal: Number,
    deliveryFee: Number,
    tax: Number,
    total: Number,
    paymentMethod: {
      type: String,
      enum: ["cash", "wallet", "upi"],
      default: "upi",
    },
    paymentStatus: String,
    status: {
      type: String,
      default: "Confirmed",
    },
    address: String,
    notes: String,
    orderCode: String,
    timeline: [orderTimelineSchema],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);
