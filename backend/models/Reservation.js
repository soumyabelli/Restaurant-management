import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    restaurantName: String,
    restaurantEmoji: String,
    restaurantImageKey: String,
    tableSize: String,
    guests: Number,
    date: String,
    time: String,
    notes: String,
    reservationCode: String,
    tableNumber: String,
    status: {
      type: String,
      default: "Reserved",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Reservation", reservationSchema);
