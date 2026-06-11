import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
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
    cuisine: [
      {
        type: String,
      },
    ],
    rating: Number,
    eta: String,
    distance: String,
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index(
  {
    userId: 1,
    restaurantId: 1,
  },
  { unique: true }
);

export default mongoose.model("Favorite", favoriteSchema);
