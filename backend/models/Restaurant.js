import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: String,
    description: String,
    emoji: String,
    popular: {
      type: Boolean,
      default: false,
    },
    vegetarian: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const restaurantSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
      default: "🍽️",
    },
    imageKey: {
      type: String,
      default: "food",
    },
    imagePosition: {
      type: String,
      default: "center center",
    },
    cuisine: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      default: 4.5,
    },
    eta: String,
    distance: String,
    priceRange: String,
    location: String,
    tags: [
      {
        type: String,
      },
    ],
    tableOptions: [
      {
        type: String,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    menu: [menuItemSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Restaurant", restaurantSchema);
