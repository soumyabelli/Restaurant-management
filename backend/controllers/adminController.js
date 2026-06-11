import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import Event from "../models/Event.js";

// GET ALL DATA FOR THE ADMIN DASHBOARD
export const getAdminDashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReservations = await Reservation.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Sum total revenue (exclude cancelled)
    const allNonCancelledOrders = await Order.find({ status: { $ne: "cancelled" } });
    const revenueSum = allNonCancelledOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // ===== Live dashboard stats (today vs yesterday) =====
    const startOfDay = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const isOrderRevenueEligible = { status: { $ne: "cancelled" } };

    const [
      todayOrdersCount,
      yesterdayOrdersCount,
      todayRevenueSum,
      yesterdayRevenueSum,
      todayAvgPrepMinutes,
      avgRestaurantRating,
      totalRestaurantRatings,
      recentUsers,
      recentRestaurants,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({
        ...isOrderRevenueEligible,
        createdAt: { $gte: todayStart, $lt: tomorrowStart },
      }),
      Order.countDocuments({
        ...isOrderRevenueEligible,
        createdAt: { $gte: yesterdayStart, $lt: todayStart },
      }),
      Order.aggregate([
        {
          $match: {
            ...isOrderRevenueEligible,
            createdAt: { $gte: todayStart, $lt: tomorrowStart },
          },
        },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$total", 0] } } } },
      ]).then((r) => r?.[0]?.sum || 0),
      Order.aggregate([
        {
          $match: {
            ...isOrderRevenueEligible,
            createdAt: { $gte: yesterdayStart, $lt: todayStart },
          },
        },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$total", 0] } } } },
      ]).then((r) => r?.[0]?.sum || 0),
      (async () => {
        // Avg prep time: using timeline "Confirmed" -> "Preparing"
        const orders = await Order.find({
          ...isOrderRevenueEligible,
          createdAt: { $gte: todayStart, $lt: tomorrowStart },
          timeline: { $elemMatch: { label: "Confirmed" } },
        }).select({ timeline: 1 });

        const parseStepToMinutes = (timeStr) => {
          if (!timeStr) return null;
          const s = String(timeStr).toLowerCase().trim();
          const m = s.match(/(\d+(?:\.\d+)?)/);
          if (!m) return s === "now" ? 0 : null;
          return Number(m[1]);
        };

        let total = 0;
        let count = 0;
        for (const o of orders) {
          const confirmed = o.timeline?.find((t) => t.label === "Confirmed");
          const preparing = o.timeline?.find((t) => t.label === "Preparing");

          const c = parseStepToMinutes(confirmed?.time);
          const p = parseStepToMinutes(preparing?.time);

          if (c === null || p === null) continue;
          const diff = Math.max(0, p - c);
          total += diff;
          count += 1;
        }

        return count ? total / count : 0;
      })(),
      (async () => {
        const restaurants = await Restaurant.find({
          rating: { $type: "number" },
        });

        if (!restaurants.length) {
          return { avg: 0, count: 0 };
        }

        const sum = restaurants.reduce(
          (acc, r) => acc + (Number(r.rating) || 0),
          0
        );

        return {
          avg: sum / restaurants.length,
          count: restaurants.length,
        };
      })().then((x) => [x?.avg || 0, x?.count || 0]),
      User.find({ role: "customer" }).sort({ createdAt: -1 }).limit(3),
      Restaurant.find().sort({ createdAt: -1 }).limit(2),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const ordersDiffPct = yesterdayOrdersCount === 0 ? (todayOrdersCount ? 100 : 0) : ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100;
    const revenueDiffPct = yesterdayRevenueSum === 0 ? (todayRevenueSum ? 100 : 0) : ((todayRevenueSum - yesterdayRevenueSum) / yesterdayRevenueSum) * 100;

    const statsLive = {
      todayOrdersCount,
      yesterdayOrdersCount,
      ordersChangePct: Number(ordersDiffPct.toFixed(1)),
      todayRevenueSum,
      yesterdayRevenueSum,
      revenueChangePct: Number(revenueDiffPct.toFixed(1)),
      todayAvgPrepMinutes: Number((todayAvgPrepMinutes || 0).toFixed(1)),
      avgRestaurantRating: Number((avgRestaurantRating || 0).toFixed(1)),
      totalRestaurantRatings: totalRestaurantRatings,
      // placeholders for chart; computed from orders createdAt buckets for last 7 days
      revenueSeries: [],
      ordersSeries: [],
    };

    // Revenue/orders series last 7 days (including today)
    const seriesStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const days = Array.from({ length: 7 }, (_, i) => new Date(seriesStart.getTime() + i * 24 * 60 * 60 * 1000));

    const [revenueSeriesAgg, ordersSeriesAgg] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            ...isOrderRevenueEligible,
            createdAt: { $gte: seriesStart, $lt: tomorrowStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            sumRevenue: { $sum: { $ifNull: ["$total", 0] } },
            countOrders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            ...isOrderRevenueEligible,
            createdAt: { $gte: seriesStart, $lt: tomorrowStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            countOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenueByDay = {};
    const ordersByDay = {};
    for (const row of revenueSeriesAgg) {
      revenueByDay[row._id] = row.sumRevenue || 0;
      ordersByDay[row._id] = row.countOrders || 0;
    }
    for (const row of ordersSeriesAgg) {
      ordersByDay[row._id] = row.countOrders || ordersByDay[row._id] || 0;
    }

    statsLive.revenueSeries = days.map((d) => {
      const key = d.toISOString().slice(0, 10);
      return { date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), value: statsLive.todayRevenueSum ? (revenueByDay[key] || 0) : (revenueByDay[key] || 0) };
    });
    statsLive.ordersSeries = days.map((d) => {
      const key = d.toISOString().slice(0, 10);
      return { date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), value: ordersByDay[key] || 0 };
    });

    // ===== Activities (recent) =====
    const activities = [];

    recentUsers.forEach((user) => {
      activities.push({
        title: "New user registered",
        desc: user.name,
        time: "Just now",
        icon: "👤",
        color: "#eef9ff",
        iconColor: "#39b8ff",
        date: user.createdAt,
      });
    });

    recentRestaurants.forEach((rest) => {
      activities.push({
        title: "New restaurant added",
        desc: rest.name,
        time: "Recently",
        icon: "🍽️",
        color: "#f4f0ff",
        iconColor: "#8a4dff",
        date: rest.createdAt,
      });
    });

    recentOrders.forEach((ord) => {
      activities.push({
        title: `Order ${ord.orderCode || "#ORD" + ord._id.toString().slice(-5)}`,
        desc: `Amount: ₹${ord.total || 0} • Status: ${ord.status}`,
        time: "Today",
        icon: "🛍️",
        color: "#eefdf7",
        iconColor: "#05cd99",
        date: ord.createdAt,
      });
    });

    activities.sort((a, b) => b.date - a.date);
    const finalActivities = activities.slice(0, 5);

    // Top restaurants by revenue (real, no random dummy)
    const allOrders = await Order.find({ ...isOrderRevenueEligible });
    const revenueMap = {};
    allOrders.forEach((ord) => {
      if (ord.restaurantName) {
        revenueMap[ord.restaurantName] = (revenueMap[ord.restaurantName] || 0) + (ord.total || 0);
      }
    });

    const dbRestaurants = await Restaurant.find();
    const topRestaurants = dbRestaurants
      .map((rest) => {
        const revenue = revenueMap[rest.name] || 0;
        return {
          name: rest.name,
          rating: rest.rating || 4.5,
          // No reviews collection exists, so show 0 instead of random.
          reviews: 0,
          revenue: `₹${revenue}`,
          rank: 0,
          image: rest.emoji || "🍽️",
        };
      })
      .sort((a, b) => Number(String(b.revenue).replace("₹", "")) - Number(String(a.revenue).replace("₹", "")))
      .slice(0, 5)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalRestaurants,
          totalOrders,
          totalRevenue: revenueSum,
          totalReservations,
          totalEvents,
        },
        statsLive,
        activities: finalActivities,
        topRestaurants,
        recentOrders: recentOrders.map((ord) => ({
          id: ord.orderCode || "#ORD" + ord._id.toString().slice(-5),
          customer: "Customer",
          restaurant: ord.restaurantName || "DineX Restaurant",
          amount: `₹${ord.total || 0}`,
          status: ord.status.toLowerCase(),
          time: new Date(ord.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// GET ALL CUSTOMERS
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ALL RESTAURANTS
export const getAdminRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ALL ORDERS
export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ALL RESERVATIONS
export const getAdminReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ALL EVENTS
export const getAdminEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
