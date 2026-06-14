import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    rewardPoints: {
      type: Number,
      default: 1250,
    },

    walletBalance: {
      type: Number,
      default: 2450,
    },

    vehicleDetails: {
      type: {
        type: String,
        default: "motorcycle",
      },
      number: {
        type: String,
        default: "",
      },
    },

    bankDetails: {
      bankName: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String,
        default: "",
      },
      ifscCode: {
        type: String,
        default: "",
      },
    },

    onlineStatus: {
      type: Boolean,
      default: true,
    },

    savedAddresses: [
      {
        label: {
          type: String,
          default: "Home",
        },
        line1: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    savedPaymentMethods: [
      {
        label: String,
        type: {
          type: String,
          enum: ["cash", "wallet", "upi", "card"],
        },
        provider: String,
        last4: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    preferences: {
      cuisines: [
        {
          type: String,
        },
      ],
      dietary: [
        {
          type: String,
        },
      ],
      notifications: {
        orders: {
          type: Boolean,
          default: true,
        },
        offers: {
          type: Boolean,
          default: true,
        },
        events: {
          type: Boolean,
          default: true,
        },
      },
    },

    role: {
      type: String,
      enum: [
        "customer",
        "restaurant",
        "delivery",
        "admin",
      ],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "User",
  userSchema
);
