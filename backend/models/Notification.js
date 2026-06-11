import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      default: "info",
    },
    iconKey: {
      type: String,
      default: "notification",
    },
    tone: {
      type: String,
      default: "sunset",
    },
    title: String,
    meta: String,
    description: String,
    badge: String,
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
