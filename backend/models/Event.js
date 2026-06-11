import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    venue: String,
    date: String,
    time: String,
    price: {
      type: Number,
      required: true,
    },
    imageKey: {
      type: String,
      default: "food",
    },
    tone: {
      type: String,
      default: "sunset",
    },
    category: String,
    description: String,
    seatsLeft: Number,
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Event", eventSchema);
