import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import { seedCustomerCatalog } from "./controllers/customerController.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);

      const allowed = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
      const defaultLocalOrigins = ["http://localhost:5173", "http://localhost:5177"];
      const isAllowedLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
      const isAllowedConfigured =
        allowed.includes(origin) || defaultLocalOrigins.includes(origin);

      if (isAllowedConfigured || isAllowedLocalhost) return callback(null, true);

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await seedCustomerCatalog();
  })
  .catch((err) => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("Restaurant Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/delivery", deliveryRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
