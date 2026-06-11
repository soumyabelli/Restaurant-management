import mongoose from "mongoose";

const eventBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventTitle: String,
    eventVenue: String,
    eventImageKey: String,
    eventTone: String,
    quantity: Number,
    date: String,
    time: String,
    paymentMethod: {
      type: String,
      enum: ["cash", "wallet", "upi"],
      default: "upi",
    },
    total: Number,
    bookingCode: String,
    status: {
      type: String,
      default: "Confirmed",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("EventBooking", eventBookingSchema);
