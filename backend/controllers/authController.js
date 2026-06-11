import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatarUrl: user.avatarUrl || "",
  rewardPoints: user.rewardPoints ?? 0,
  walletBalance: user.walletBalance ?? 0,
  savedAddresses: user.savedAddresses || [],
  savedPaymentMethods: user.savedPaymentMethods || [],
  preferences: user.preferences || {
    cuisines: [],
    dietary: [],
    notifications: {
      orders: true,
      offers: true,
      events: true,
    },
  },
});

// REGISTER
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "customer",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (email === "admin@gmail.com" && password === "123") {
      let adminUser = await User.findOne({ email: "admin@gmail.com" });
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash("123", 10);
        await User.create({
          name: "Admin User",
          email: "admin@gmail.com",
          phone: "9999999999",
          password: hashedPassword,
          role: "admin",
        });
      }
    }

    // Create a demo restaurant user when using demo credentials
    if (email === "restaurant1@gmail.com" && password === "123") {
      let restUser = await User.findOne({ email: "restaurant1@gmail.com" });
      if (!restUser) {
        const hashedPassword = await bcrypt.hash("123", 10);
        await User.create({
          name: "Demo Restaurant",
          email: "restaurant1@gmail.com",
          phone: "9999999998",
          password: hashedPassword,
          role: "restaurant",
          avatarUrl: "",
        });
      }
    }

    // Create a demo delivery user when using demo credentials
    if (email === "delivery@gmail.com" && password === "123") {
      let delUser = await User.findOne({ email: "delivery@gmail.com" });
      if (!delUser) {
        const hashedPassword = await bcrypt.hash("123", 10);
        await User.create({
          name: "Delivery Agent",
          email: "delivery@gmail.com",
          phone: "9999999991",
          password: hashedPassword,
          role: "delivery",
          avatarUrl: "",
        });
      }
    }

    let user = await User.findOne({
      email,
    });

    // If user does not exist, and the caller indicated they are logging in as a restaurant,
    // create a restaurant user on-the-fly for demo purposes.
    if (!user) {
      if (req.body?.role === "restaurant") {
        const hashedPassword = await bcrypt.hash(password || "123", 10);
        user = await User.create({
          name: email.split("@")[0] || "Demo Restaurant",
          email,
          phone: "9999999990",
          password: hashedPassword,
          role: "restaurant",
          avatarUrl: "",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    }

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
