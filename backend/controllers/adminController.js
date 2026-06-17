import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import Event from "../models/Event.js";
import Review from "../models/Review.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import EventBooking from "../models/EventBooking.js";

const toNumber = (value) => Number(value) || 0;

const formatMoney = (value) => `\u20B9${toNumber(value).toLocaleString("en-IN")}`;

const normalizeStatus = (status) => String(status || "").toLowerCase().trim();

const formatRelativeTime = (dateValue) => {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// GET ALL DATA FOR THE ADMIN DASHBOARD
export const getAdminDashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReservations = await Reservation.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Sum total revenue (exclude cancelled)
    const allNonCancelledOrders = await Order.find({
      status: { $nin: ["cancelled", "Cancelled"] },
    });
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

    const isOrderRevenueEligible = { status: { $nin: ["cancelled", "Cancelled"] } };

    const [
      todayOrdersCount,
      yesterdayOrdersCount,
      todayRevenueSum,
      yesterdayRevenueSum,
      todayAvgPrepMinutes,
      restaurantRatingStats,
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

        const ratings = restaurants
          .map((r) => toNumber(r.rating))
          .filter((rating) => Number.isFinite(rating));

        if (!ratings.length) {
          return { avg: 0, count: 0 };
        }

        const sum = ratings.reduce((acc, rating) => acc + rating, 0);

        return {
          avg: sum / ratings.length,
          count: ratings.length,
        };
      })(),
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
      avgRestaurantRating: Number((restaurantRatingStats?.avg || 0).toFixed(1)),
      totalRestaurantRatings: restaurantRatingStats?.count || 0,
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

    const startOfMonth = new Date(todayStart);
    startOfMonth.setDate(1);
    const startOfPreviousMonth = new Date(startOfMonth);
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);

    const currentMonthCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth, $lt: tomorrowStart },
    });
    const previousMonthCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfPreviousMonth, $lt: startOfMonth },
    });

    const customerGrowthRatio =
      previousMonthCustomers === 0
        ? currentMonthCustomers > 0
          ? 100
          : 0
        : ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100;

    const growthSeriesStart = new Date(todayStart.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
    const userGrowthSeriesAgg = await User.aggregate([
      {
        $match: {
          role: "customer",
          createdAt: { $gte: growthSeriesStart, $lt: tomorrowStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const customerGrowthByDay = {};
    for (const row of userGrowthSeriesAgg) {
      customerGrowthByDay[row._id] = row.count || 0;
    }
    statsLive.thisMonthCustomers = currentMonthCustomers;
    statsLive.lastMonthCustomers = previousMonthCustomers;
    statsLive.customerGrowthPct = Number(customerGrowthRatio.toFixed(1));
    statsLive.userGrowthSeries = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(growthSeriesStart.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      return {
        date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: customerGrowthByDay[key] || 0,
      };
    });

    const normalizedOrderStatusCounts = allNonCancelledOrders.reduce(
      (acc, order) => {
        const status = normalizeStatus(order.status);
        if (status === "delivered") {
          acc.delivered += 1;
        } else if (status === "on the way") {
          acc.inTransit += 1;
        } else if (status === "preparing" || status === "ready" || status === "confirmed") {
          acc.preparing += 1;
        } else {
          acc.other += 1;
        }
        return acc;
      },
      {
        delivered: 0,
        inTransit: 0,
        preparing: 0,
        cancelled: totalOrders - allNonCancelledOrders.length,
        other: 0,
        total: totalOrders,
      }
    );

    statsLive.orderStatusCounts = normalizedOrderStatusCounts;

    // ===== Activities (recent) =====
    const activities = [];

    recentUsers.forEach((user) => {
      activities.push({
        title: "New user registered",
        desc: user.name,
        time: formatRelativeTime(user.createdAt),
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
        time: formatRelativeTime(rest.createdAt),
        icon: "🍽️",
        color: "#f4f0ff",
        iconColor: "#8a4dff",
        date: rest.createdAt,
      });
    });

    recentOrders.forEach((ord) => {
      activities.push({
        title: `Order ${ord.orderCode || "#ORD" + ord._id.toString().slice(-5)}`,
        desc: `Amount: ${formatMoney(ord.total || 0)} • Status: ${ord.status}`,
        time: formatRelativeTime(ord.createdAt),
        icon: "🛍️",
        color: "#eefdf7",
        iconColor: "#05cd99",
        date: ord.createdAt,
      });
    });

    activities.sort((a, b) => b.date - a.date);
    const finalActivities = activities.slice(0, 5);

    // Top restaurants by revenue (real, no random dummy)
    const revenueMap = {};
    allNonCancelledOrders.forEach((ord) => {
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
          rating: Number(rest.rating || 0),
          // No reviews collection exists, so show 0 instead of random.
          reviews: 0,
          revenueValue: revenue,
          revenue: formatMoney(revenue),
          rank: 0,
          image: rest.emoji || "🍽️",
        };
      })
      .sort((a, b) => b.revenueValue - a.revenueValue)
      .slice(0, 5)
      .map(({ revenueValue, ...r }, idx) => ({ ...r, rank: idx + 1 }));

    const [deliveryRiders, recentReviews, paymentTransactions, unreadNotifications, featuredEvents, deliveryOrders, eventBookings] =
      await Promise.all([
        User.find({ role: "delivery" }).sort({ createdAt: -1 }),
        Review.find().sort({ createdAt: -1 }).populate("userId", "name avatarUrl").populate("restaurantId", "name emoji rating"),
        Transaction.find().sort({ createdAt: -1 }).populate("userId", "name role"),
        Notification.find({ read: false }).sort({ createdAt: -1 }).limit(8).populate("userId", "name role"),
        Event.find().sort({ featured: -1, createdAt: -1 }).limit(6),
        Order.find({ deliveryGuyId: { $ne: null } }).select("deliveryGuyId status createdAt total orderCode"),
        EventBooking.find().sort({ createdAt: -1 }).limit(8).populate("userId", "name").populate("eventId", "title venue price featured"),
      ]);

    const deliveryStatsByUser = deliveryOrders.reduce((acc, order) => {
      const deliveryGuyId = order.deliveryGuyId?.toString();
      if (!deliveryGuyId) return acc;

      const current = acc[deliveryGuyId] || {
        activeDeliveries: 0,
        completedDeliveries: 0,
      };

      const status = normalizeStatus(order.status);
      if (status === "delivered") {
        current.completedDeliveries += 1;
      } else if (status !== "cancelled") {
        current.activeDeliveries += 1;
      }

      acc[deliveryGuyId] = current;
      return acc;
    }, {});

    const deliveryPartners = deliveryRiders.map((rider) => {
      const riderStats = deliveryStatsByUser[rider._id.toString()] || {
        activeDeliveries: 0,
        completedDeliveries: 0,
      };

      return {
        id: rider._id.toString(),
        name: rider.name,
        phone: rider.phone || "N/A",
        onlineStatus: rider.onlineStatus ?? false,
        walletBalance: rider.walletBalance ?? 0,
        deliveriesCount: rider.deliveriesCount ?? riderStats.completedDeliveries,
        activeDeliveries: riderStats.activeDeliveries,
        completedDeliveries: riderStats.completedDeliveries,
        vehicleType: rider.vehicleDetails?.type || "motorcycle",
        rating: Number(rider.rating || 4.8),
        joinedAt: rider.createdAt,
      };
    }).slice(0, 8);

    const reviewAverage = recentReviews.length
      ? recentReviews.reduce((sum, review) => sum + toNumber(review.rating), 0) / recentReviews.length
      : 0;

    const reviewSummary = {
      totalReviews: recentReviews.length,
      averageRating: Number(reviewAverage.toFixed(1)),
      fiveStar: recentReviews.filter((review) => toNumber(review.rating) >= 5).length,
      lowRatings: recentReviews.filter((review) => toNumber(review.rating) <= 3).length,
    };

    const transactionSummary = paymentTransactions.reduce(
      (acc, tx) => {
        const amount = toNumber(tx.amount);
        if (normalizeStatus(tx.type) === "credit") {
          acc.credits += amount;
        } else {
          acc.debits += amount;
        }
        return acc;
      },
      { credits: 0, debits: 0 }
    );

    const recentPaymentTransactions = paymentTransactions.slice(0, 10).map((tx) => ({
      id: tx._id.toString(),
      title: tx.title,
      user: tx.userId?.name || "System",
      role: tx.userId?.role || "system",
      type: tx.type,
      amount: formatMoney(tx.amount || 0),
      amountValue: toNumber(tx.amount),
      date: tx.createdAt,
      time: formatRelativeTime(tx.createdAt),
    }));

    const promotionHighlights = featuredEvents.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      venue: event.venue || "TBA",
      date: event.date || "TBA",
      time: event.time || "TBA",
      priceValue: toNumber(event.price),
      price: formatMoney(event.price || 0),
      seatsLeft: event.seatsLeft ?? 0,
      featured: !!event.featured,
      category: event.category || "Featured",
      description: event.description || "No description available.",
    }));

    const delayedOrders = allNonCancelledOrders
      .filter((order) => {
        const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
        const status = normalizeStatus(order.status);
        return ageMinutes > 45 && ["confirmed", "preparing", "ready", "on the way"].includes(status);
      })
      .slice(0, 5);

    const supportAlerts = [
      ...unreadNotifications.map((notification) => ({
        id: notification._id.toString(),
        source: notification.userId?.name || "System",
        title: notification.title || "Unread notification",
        description: notification.description || notification.meta || "No further details.",
        priority: notification.type || "info",
        status: notification.read ? "Resolved" : "Open",
        time: formatRelativeTime(notification.createdAt),
        date: notification.createdAt,
      })),
      ...delayedOrders.map((order) => ({
        id: order._id.toString(),
        source: order.restaurantName || "Restaurant",
        title: `Delayed order ${order.orderCode || "#ORD" + order._id.toString().slice(-5)}`,
        description: `Status: ${order.status || "Pending"}`,
        priority: "high",
        status: "Open",
        time: formatRelativeTime(order.createdAt),
        date: order.createdAt,
      })),
    ]
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 8);

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
        deliveryPartners,
        reviews: recentReviews.map((review) => ({
          id: review._id.toString(),
          customerName: review.userId?.name || "Anonymous",
          customerAvatar: review.userId?.avatarUrl || "",
          restaurantName: review.restaurantId?.name || "Unknown restaurant",
          restaurantEmoji: review.restaurantId?.emoji || "🍽️",
          rating: toNumber(review.rating),
          comment: review.comment,
          date: review.createdAt || review.date,
          time: formatRelativeTime(review.createdAt || review.date),
        })),
        reviewSummary,
        transactions: recentPaymentTransactions,
        transactionSummary: {
          credits: formatMoney(transactionSummary.credits),
          debits: formatMoney(transactionSummary.debits),
          net: formatMoney(transactionSummary.credits - transactionSummary.debits),
          count: paymentTransactions.length,
        },
        featuredEvents: promotionHighlights,
        eventBookings: eventBookings.map((booking) => ({
          id: booking._id.toString(),
          bookingCode: booking.bookingCode || `#EV${booking._id.toString().slice(-5).toUpperCase()}`,
          eventTitle: booking.eventId?.title || booking.eventTitle || "Event",
          eventVenue: booking.eventId?.venue || booking.eventVenue || "TBA",
          quantity: booking.quantity || 1,
          total: formatMoney(booking.total || 0),
          status: booking.status || "Confirmed",
          time: formatRelativeTime(booking.createdAt),
        })),
        supportAlerts,
        recentOrders: recentOrders.map((ord) => ({
          id: ord.orderCode || "#ORD" + ord._id.toString().slice(-5),
          customer: "Customer",
          restaurant: ord.restaurantName || "DineX Restaurant",
          amount: formatMoney(ord.total || 0),
          status: normalizeStatus(ord.status) || "pending",
          statusClass:
            normalizeStatus(ord.status) === "delivered"
              ? "delivered"
              : normalizeStatus(ord.status) === "on the way"
                ? "in-transit"
                : normalizeStatus(ord.status) === "cancelled"
                  ? "cancelled"
                  : "preparing",
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
