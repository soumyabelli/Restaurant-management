import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

// Helper: return the restaurant for the authenticated owner.
// NOTE: Current schema does not store an explicit owner->restaurant mapping.
// We therefore select restaurant deterministically using req.user.restaurantId (if your auth middleware attaches it)
// or req.query.restaurantId / req.body.restaurantId.
// Fallback: first restaurant (old behavior).
// Supports both call styles:
// - getOwnerRestaurant(req, user)
// - getOwnerRestaurant(user)
const getOwnerRestaurant = async (arg1, arg2) => {
  const req = arg2 ? arg1 : null;
  const user = arg2 ? arg2 : arg1;

  const restaurantId =
    req?.query?.restaurantId ||
    req?.body?.restaurantId ||
    user?.restaurantId ||
    null;


  if (restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant) return restaurant;
  }

  // Demo fallback: map demo restaurant user to the correct Restaurant document.
  // This keeps dashboard + order details consistent even without owner->restaurant mapping in schema.
  const fallbackRestaurant = await Restaurant.findOne({ slug: "green-bowl-cafe" });
  return fallbackRestaurant || Restaurant.findOne({});
};



const serializeRestaurant = (restaurant) => {
  if (!restaurant) return null;
  return {
    id: restaurant._id.toString(),
    slug: restaurant.slug,
    name: restaurant.name,
    emoji: restaurant.emoji,
    imageKey: restaurant.imageKey,
    cuisine: restaurant.cuisine || [],
    rating: restaurant.rating,
    eta: restaurant.eta,
    distance: restaurant.distance,
    priceRange: restaurant.priceRange,
    location: restaurant.location,
    tags: restaurant.tags || [],
    tableOptions: restaurant.tableOptions || [],
    active: restaurant.active,
    menu: restaurant.menu || [],
  };
};

const mapOrder = (order) => ({
  id: order._id.toString(),
  orderCode: order.orderCode,
  restaurantId: order.restaurantId?.toString(),
  restaurantName: order.restaurantName || (order.restaurant && order.restaurant.name) || "",
  items: (order.items || []).map((item) => `${item.quantity} x ${item.name}`).join(", "),
  itemsDetail: (order.items || []).map((item) => ({
    id: item.menuItemId ? item.menuItemId.toString() : `${item.name}-${item.price}`,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    emoji: item.emoji,
  })),
  status: order.status,
  total: order.total,
  customer: order.userId?.name || order.customer || "",
  createdAt: order.createdAt,
});

const buildTimeline = (status) => {
  const currentStatus = String(status || "confirmed").toLowerCase();
  const currentIndex =
    currentStatus === "delivered"
      ? 3
      : currentStatus === "on the way"
        ? 2
        : currentStatus === "preparing" || currentStatus === "ready"
          ? 1
          : 0;

  const steps = [
    { label: "Confirmed", time: "Now" },
    { label: "Preparing", time: "10 mins" },
    { label: "On the Way", time: "25 mins" },
    { label: "Delivered", time: "---" },
  ];

  return steps.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
};

// GET DASHBOARD (basic summary)
export const getRestaurantDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(req, user);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });


    const allOrders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).populate('userId', 'name phone address');
    const allReservations = await Reservation.find({ restaurantId: restaurant._id });
    const reviews = await Review.find({ restaurantId: restaurant._id });

    // compute time windows
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= startOfToday);
    const yesterdayOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= startOfYesterday && new Date(o.createdAt) < startOfToday
    );

    const todayRevenueSum = todayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const yesterdayRevenueSum = yesterdayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

    const totalOrders = allOrders.length;
    const activeOrders = allOrders.filter((o) => o.active && o.status !== "Delivered").length;
    const deliveredOrders = allOrders.filter((o) => o.status === "Delivered").length;
    const cancelledOrders = allOrders.filter((o) => o.status === "Cancelled").length;

    const liveOrders = allOrders.filter((o) => o.active && o.status !== "Delivered").slice(0, 20).map(mapOrder);

    const ordersByStatus = {
      new: allOrders.filter((o) => o.status === "Confirmed").length,
      preparing: allOrders.filter((o) => o.status === "Preparing").length,
      ready: allOrders.filter((o) => o.status === "Ready").length,
      delivery: allOrders.filter((o) => o.status === "On the way").length,
    };

    // top selling items
    const itemCounts = {};
    allOrders.forEach((order) => {
      (order.items || []).forEach((it) => {
        const key = it.menuItemId ? String(it.menuItemId) : `${it.name}-${it.price}`;
        if (!itemCounts[key]) itemCounts[key] = { name: it.name, price: it.price, orders: 0, emoji: it.emoji };
        itemCounts[key].orders += Number(it.quantity || 1);
      });
    });
    const topSelling = Object.values(itemCounts).sort((a, b) => b.orders - a.orders).slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        restaurant: serializeRestaurant(restaurant),
        todayOrdersCount: todayOrders.length,
        yesterdayOrdersCount: yesterdayOrders.length,
        todayRevenueSum,
        yesterdayRevenueSum,
        totalOrders,
        activeOrders,
        deliveredOrders,
        cancelledOrders,
        liveOrders,
        ordersByStatus,
        topSelling,
        revenueSeries: [],
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ORDERS
export const getRestaurantOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(req, user);
    const orders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).populate('userId', 'name phone address');

    res.status(200).json({ success: true, data: orders.map(mapOrder) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ADD MENU ITEM
export const addMenuItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(req, user);
    const { name, price, category, description, emoji, popular = false, vegetarian = false } = req.body;
    restaurant.menu.push({ name, price, category, description, emoji, popular, vegetarian });
    await restaurant.save();
    res.status(201).json({ success: true, data: serializeRestaurant(restaurant).menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// UPDATE MENU ITEM
export const updateMenuItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    const { itemId } = req.params;
    const item = restaurant.menu.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Menu item not found" });
    const updatable = ["name", "price", "category", "description", "emoji", "popular", "vegetarian"];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    });
    await restaurant.save();
    res.status(200).json({ success: true, data: serializeRestaurant(restaurant).menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET RESERVATIONS
export const getRestaurantReservations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    const reservations = await Reservation.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET CUSTOMERS
export const getRestaurantCustomers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);

    const orders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });

    const userIds = [...new Set((orders || []).map((o) => String(o.userId)))];
    if (!userIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Compute per-customer aggregates from Order collection
    const byCustomer = new Map();
    for (const ord of orders) {
      const uid = String(ord.userId);
      if (!byCustomer.has(uid)) {
        byCustomer.set(uid, {
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
      }

      const entry = byCustomer.get(uid);
      entry.totalOrders += 1;
      entry.totalSpent += Number(ord.total || 0);
      // orders are sorted desc, so first seen is latest
      if (!entry.lastOrderDate) entry.lastOrderDate = ord.createdAt;
    }

    const customers = await User.find({ _id: { $in: userIds } }).select("name email phone avatarUrl");

    const payload = customers.map((c) => {
      const agg = byCustomer.get(String(c._id)) || {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
      };
      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatarUrl: c.avatarUrl,
        totalOrders: agg.totalOrders,
        totalSpent: agg.totalSpent,
        lastOrderDate: agg.lastOrderDate,
      };
    });

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// GET REVIEWS
export const getRestaurantReviews = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    
    let reviews = await Review.find({ restaurantId: restaurant._id })
      .sort({ createdAt: -1 })
      .populate("userId", "name avatarUrl");

    // Seed dummy reviews if none exist
    if (reviews.length === 0) {
      const customer = await User.findOne({ role: "customer" });
      const customerId = customer ? customer._id : req.user.id;

      const dummyReviews = [
        {
          userId: customerId,
          restaurantId: restaurant._id,
          rating: 5,
          comment: "Absolutely delicious! The Paneer Tikka was cooked to perfection and delivery was lightning fast.",
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
          userId: customerId,
          restaurantId: restaurant._id,
          rating: 4,
          comment: "Great quality food, very authentic spices. Will definitely order again. Highly recommended!",
          createdAt: new Date(Date.now() - 3600000 * 24),
        },
        {
          userId: customerId,
          restaurantId: restaurant._id,
          rating: 5,
          comment: "Best meal I've had in a long time. The customer service was also very pleasant.",
          createdAt: new Date(Date.now() - 3600000 * 48),
        },
      ];

      await Review.insertMany(dummyReviews);
      
      reviews = await Review.find({ restaurantId: restaurant._id })
        .sort({ createdAt: -1 })
        .populate("userId", "name avatarUrl");
    }

    const mapped = reviews.map((r) => ({
      id: r._id.toString(),
      customerName: r.userId?.name || "Anonymous",
      customerAvatar: r.userId?.avatarUrl || "",
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt || r.date,
    }));

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// UPDATE ORDER STATUS (restaurant owner action)
export const updateOrderStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);

    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ _id: id, restaurantId: restaurant._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const allowed = ["Confirmed", "Preparing", "Ready", "On the way", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    order.status = status;
    order.timeline = buildTimeline(status);
    if (status === "Delivered" || status === "Cancelled") {
      order.active = false;
    } else {
      order.active = true;
    }
    await order.save();

    // Emit live socket status update
    const io = req.app.get("io");
    if (io) {
      io.to(id.toString()).emit("orderStatusUpdated", order);
      io.emit("orderStatusUpdated", order);
      console.log(`Socket emit orderStatusUpdated for order ${id} status ${status}`);
    }

    res.status(200).json({ success: true, data: mapOrder(order) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET FULL MENU for editing
export const getRestaurantMenu = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    res.status(200).json({ success: true, data: serializeRestaurant(restaurant).menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE MENU ITEM
export const deleteMenuItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    const { itemId } = req.params;
    const itemIndex = restaurant.menu.findIndex((m) => m._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }
    restaurant.menu.splice(itemIndex, 1);
    await restaurant.save();
    res.status(200).json({ success: true, data: serializeRestaurant(restaurant).menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// TOGGLE MENU ITEM STOCK
export const toggleMenuItemStock = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    const { itemId } = req.params;
    const item = restaurant.menu.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Menu item not found" });
    item.active = item.active === false ? true : false;
    await restaurant.save();
    res.status(200).json({ success: true, data: serializeRestaurant(restaurant).menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ANALYTICS
export const getRestaurantAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);

    const allOrders = await Order.find({ restaurantId: restaurant._id });
    const allReservations = await Reservation.find({ restaurantId: restaurant._id });
    const reviews = await Review.find({ restaurantId: restaurant._id });

    const now = new Date();
    const startOfDayDate = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const todayStart = startOfDayDate(now);
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);

    const totalRevenue = allOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const todayRevenue = allOrders
      .filter((o) => o.status !== "Cancelled" && new Date(o.createdAt) >= todayStart)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const weekRevenue = allOrders
      .filter((o) => o.status !== "Cancelled" && new Date(o.createdAt) >= weekStart)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const monthRevenue = allOrders
      .filter((o) => o.status !== "Cancelled" && new Date(o.createdAt) >= monthStart)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const avgOrderValue = allOrders.length
      ? totalRevenue / allOrders.filter((o) => o.status !== "Cancelled").length
      : 0;

    // Top items
    const itemStats = {};
    allOrders.forEach((ord) => {
      ord.items.forEach((it) => {
        if (!itemStats[it.name]) {
          itemStats[it.name] = { name: it.name, count: 0, revenue: 0, emoji: it.emoji };
        }
        itemStats[it.name].count += it.quantity;
        itemStats[it.name].revenue += it.price * it.quantity;
      });
    });
    const topItems = Object.values(itemStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Peak hours
    const hourCounts = Array(24).fill(0);
    allOrders.forEach((o) => {
      hourCounts[new Date(o.createdAt).getHours()] += 1;
    });

    // Day-of-week series
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayRevenue = Array(7).fill(0);
    const dayOrders = Array(7).fill(0);
    allOrders.forEach((o) => {
      if (o.status === "Cancelled") return;
      const d = new Date(o.createdAt);
      const day = d.getDay();
      dayRevenue[day] += o.total || 0;
      dayOrders[day] += 1;
    });

    // Ratings
    const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const ratingAvg = reviews.length ? ratingSum / reviews.length : 0;

    // Recent 7 days series
    const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
    const seriesByDate = {};
    allOrders.forEach((o) => {
      if (o.status === "Cancelled") return;
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      const k = d.toISOString().slice(0, 10);
      seriesByDate[k] = (seriesByDate[k] || 0) + (o.total || 0);
    });
    const last7Days = days.map((d) => ({
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: seriesByDate[d.toISOString().slice(0, 10)] || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        totals: {
          revenue: totalRevenue,
          todayRevenue,
          weekRevenue,
          monthRevenue,
          avgOrderValue,
          totalOrders: allOrders.length,
          cancelledOrders: allOrders.filter((o) => o.status === "Cancelled").length,
          deliveredOrders: allOrders.filter((o) => o.status === "Delivered").length,
          totalCustomers: new Set(allOrders.map((o) => String(o.userId))).size,
          totalReservations: allReservations.length,
          totalReviews: reviews.length,
        },
        rating: {
          average: Number(ratingAvg.toFixed(2)),
          count: reviews.length,
        },
        topItems,
        peakHours: hourCounts.map((count, hour) => ({ hour, count })),
        dayRevenue: dayLabels.map((label, idx) => ({ label, revenue: dayRevenue[idx], orders: dayOrders[idx] })),
        last7Days,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET PAYOUT SUMMARY
export const getRestaurantPayout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);

    const delivered = await Order.find({ restaurantId: restaurant._id, status: "Delivered" }).sort({ createdAt: -1 });
    const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);

    // Simulated deductions
    const platformFeeRate = 0.05;
    const platformFee = Math.round(totalRevenue * platformFeeRate);
    const gst = Math.round(totalRevenue * 0.05);
    const netEarnings = totalRevenue - platformFee - gst;

    // Last 4 weeks
    const now = new Date();
    const weekStarts = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (3 - i) * 7 - 6);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end, label: `Week ${i + 1}` };
    });

    const weeklyBreakdown = weekStarts.map(({ start, end, label }) => {
      const weekOrders = delivered.filter((o) => new Date(o.createdAt) >= start && new Date(o.createdAt) < end);
      const sum = weekOrders.reduce((s, o) => s + (o.total || 0), 0);
      const fee = Math.round(sum * platformFeeRate);
      const tax = Math.round(sum * 0.05);
      return {
        label,
        range: `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${new Date(end.getTime() - 1).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`,
        orders: weekOrders.length,
        revenue: sum,
        fee,
        gst: tax,
        net: sum - fee - tax,
        status: label === "Week 1" ? "Paid" : "Pending",
      };
    });

    // Transaction list (last few orders)
    const transactions = delivered.slice(0, 8).map((o) => ({
      id: o._id.toString(),
      orderCode: o.orderCode,
      date: o.createdAt,
      amount: o.total || 0,
      type: "Order earning",
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        platformFee,
        gst,
        netEarnings,
        weeklyBreakdown,
        transactions,
        nextPayoutDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET DELIVERY LIST (orders with status of Confirmed / Preparing / Ready / On the way)
export const getRestaurantDelivery = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);

    // Find all active delivery orders and populate rider/customer details
    const orders = await Order.find({
      restaurantId: restaurant._id,
      active: true,
      status: { $in: ["Confirmed", "Preparing", "Ready", "On the way"] },
    })
    .sort({ createdAt: 1 })
    .populate("userId", "name phone address")
    .populate("deliveryGuyId", "name phone");

    const deliveries = orders.map((o, idx) => {
      const partner = o.deliveryGuyId
        ? {
            id: o.deliveryGuyId._id.toString(),
            name: o.deliveryGuyId.name,
            phone: o.deliveryGuyId.phone || "+91 98765 00000",
            vehicle: "Rider Assigned",
          }
        : null;

      // Map details dynamically
      return {
        ...mapOrder(o),
        customerPhone: o.userId?.phone || "",
        customerAddress: o.address || o.userId?.address || "",
        distance: (1.5 + ((idx * 0.7) % 4)).toFixed(1) + " km",
        partner,
        estimatedTime: partner ? (10 + (idx * 3)) + " mins" : "Waiting for rider...",
      };
    });

    res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET RESTAURANT PROFILE for settings
export const getRestaurantProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
        restaurant: serializeRestaurant(restaurant),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// UPDATE RESTAURANT PROFILE / SETTINGS
export const updateRestaurantProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const restaurant = await getOwnerRestaurant(user);

    const { name, phone, avatarUrl, eta, distance, priceRange, location, tags, tableOptions, cuisine, description } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    await user.save();

    if (eta !== undefined) restaurant.eta = eta;
    if (distance !== undefined) restaurant.distance = distance;
    if (priceRange !== undefined) restaurant.priceRange = priceRange;
    if (location !== undefined) restaurant.location = location;
    if (Array.isArray(tags)) restaurant.tags = tags;
    if (Array.isArray(tableOptions)) restaurant.tableOptions = tableOptions;
    if (Array.isArray(cuisine)) restaurant.cuisine = cuisine;

    await restaurant.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
        restaurant: serializeRestaurant(restaurant),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
