import crypto from "crypto";

import Event from "../models/Event.js";
import EventBooking from "../models/EventBooking.js";
import Favorite from "../models/Favorite.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import {
  customerEventSeeds,
  customerRestaurantSeeds,
} from "../data/customerSeedData.js";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatMoney = (value = 0) => INR.format(Number(value || 0));

const formatShortDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "";
  }

  return `${date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} • ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const generateCode = (prefix) =>
  `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const seedRestaurants = async () => {
  const count = await Restaurant.countDocuments();

  if (count === 0) {
    await Restaurant.insertMany(customerRestaurantSeeds);
  }
};

const seedEvents = async () => {
  const count = await Event.countDocuments();

  if (count === 0) {
    await Event.insertMany(customerEventSeeds);
  }
};

const ensureBaseCatalog = async () => {
  await Promise.all([seedRestaurants(), seedEvents()]);
};

const buildTimeline = (status) => {
  const currentStatus = String(status || "confirmed").toLowerCase();
  const currentIndex =
    currentStatus === "delivered"
      ? 3
      : currentStatus === "on the way"
        ? 2
        : currentStatus === "preparing"
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

const mapRestaurant = (restaurant) => ({
  id: restaurant._id.toString(),
  slug: restaurant.slug,
  name: restaurant.name,
  emoji: restaurant.emoji,
  imageKey: restaurant.imageKey,
  imagePosition: restaurant.imagePosition,
  cuisine: restaurant.cuisine.join(", "),
  rating: restaurant.rating.toFixed(1),
  eta: restaurant.eta,
  time: restaurant.eta,
  distance: restaurant.distance,
  priceRange: restaurant.priceRange,
  location: restaurant.location,
  tags: restaurant.tags,
  tableOptions: restaurant.tableOptions,
  menu: restaurant.menu.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    price: item.price,
    category: item.category,
    description: item.description,
    emoji: item.emoji,
    popular: item.popular,
    vegetarian: item.vegetarian,
  })),
});

const mapEvent = (event) => ({
  id: event._id.toString(),
  title: event.title,
  venue: event.venue,
  date: event.date,
  time: event.time,
  meta: `${formatShortDate(event.date)} • ${event.time}`,
  location: event.venue,
  price: `${formatMoney(event.price)} onwards`,
  amount: event.price,
  actionLabel: "Book Now",
  tone: event.tone,
  imageKey: event.imageKey,
  category: event.category,
  description: event.description,
  seatsLeft: event.seatsLeft,
  featured: event.featured,
});

const mapFavorite = (favorite) => ({
  id: favorite._id.toString(),
  restaurantId: favorite.restaurantId.toString(),
  name: favorite.restaurantName,
  restaurant: favorite.restaurantName,
  emoji: favorite.restaurantEmoji || "🍽️",
  imageKey: favorite.restaurantImageKey || "food",
  cuisine: favorite.cuisine.join(", "),
  rating: favorite.rating.toFixed(1),
  eta: favorite.eta,
  distance: favorite.distance,
  tags: favorite.tags,
  actionLabel: "Order again",
  tone: "mint",
});

const mapOrder = (order) => ({
  id: order._id.toString(),
  orderCode: order.orderCode,
  restaurantId: order.restaurantId?.toString(),
  logo: order.restaurantEmoji || "🍽️",
  restaurant: order.restaurantName,
  restaurantName: order.restaurantName,
  items: order.items.map((item) => `${item.quantity} x ${item.name}`).join(", "),
  itemsDetail: order.items.map((item) => ({
    id: item.menuItemId ? item.menuItemId.toString() : `${item.name}-${item.price}`,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    emoji: item.emoji,
  })),
  status: order.status,
  amount: formatMoney(order.total),
  total: order.total,
  subtotal: order.subtotal,
  deliveryFee: order.deliveryFee,
  tax: order.tax,
  time: formatDateTime(order.createdAt),
  tone: order.status === "Delivered" ? "mint" : "sunset",
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  address: order.address,
  notes: order.notes,
  restaurantImageKey: order.restaurantImageKey,
  restaurantEmoji: order.restaurantEmoji,
  timeline: order.timeline,
  active: order.active,
});

const mapReservation = (reservation) => ({
  id: reservation._id.toString(),
  restaurantId: reservation.restaurantId.toString(),
  restaurant: reservation.restaurantName,
  tableSize: reservation.tableSize,
  guests: reservation.guests,
  date: reservation.date,
  time: reservation.time,
  status: reservation.status,
  bookingCode: reservation.reservationCode,
  tableNumber: reservation.tableNumber,
  notes: reservation.notes,
  tone: reservation.status === "Reserved" ? "purple" : "mint",
});

const mapEventBooking = (booking) => ({
  id: booking._id.toString(),
  eventId: booking.eventId.toString(),
  title: booking.eventTitle,
  eventTitle: booking.eventTitle,
  venue: booking.eventVenue,
  quantity: booking.quantity,
  date: booking.date,
  time: booking.time,
  paymentMethod: booking.paymentMethod,
  amount: formatMoney(booking.total),
  total: booking.total,
  bookingCode: booking.bookingCode,
  status: booking.status,
  tone: booking.status === "Confirmed" ? "sunset" : "sky",
  imageKey: booking.eventImageKey,
});

const mapNotification = (notification) => ({
  id: notification._id.toString(),
  iconKey: notification.iconKey,
  tone: notification.tone,
  title: notification.title,
  meta: notification.meta,
  description: notification.description,
  badge: notification.badge,
  read: notification.read,
  type: notification.type,
});

const mapWalletTransaction = (entry) => ({
  id: entry.id,
  iconKey: entry.iconKey,
  tone: entry.tone,
  title: entry.title,
  meta: entry.meta,
  description: entry.description,
  badge: entry.badge,
});

const buildWalletTransactions = (orders, reservations, eventBookings) => {
  const orderTransactions = orders.map((order) =>
    mapWalletTransaction({
      id: `order-${order.id}`,
      iconKey: "order",
      tone: order.tone,
      title: order.restaurant,
      meta: `${order.paymentMethod.toUpperCase()} • ${order.time}`,
      description: order.items,
      badge: order.paymentStatus,
    })
  );

  const reservationTransactions = reservations.map((reservation) =>
    mapWalletTransaction({
      id: `reservation-${reservation.id}`,
      iconKey: "restaurant",
      tone: reservation.tone,
      title: reservation.restaurant,
      meta: `${reservation.tableSize} • ${reservation.date}`,
      description: `Reservation for ${reservation.time}`,
      badge: reservation.status,
    })
  );

  const eventTransactions = eventBookings.map((booking) =>
    mapWalletTransaction({
      id: `event-${booking.id}`,
      iconKey: "event",
      tone: booking.tone,
      title: booking.eventTitle,
      meta: `${booking.paymentMethod.toUpperCase()} • ${booking.date}`,
      description: `${booking.quantity} ticket(s)`,
      badge: booking.status,
    })
  );

  return [...orderTransactions, ...reservationTransactions, ...eventTransactions].sort(
    (left, right) => right.id.localeCompare(left.id)
  );
};

const buildProfileHighlights = (user, favoritesCount, ordersCount, reservationsCount) => [
  {
    iconKey: "profile",
    label: "Membership",
    value: "Gold",
    note: "Priority support and quick booking",
    tone: "sunset",
  },
  {
    iconKey: "wallet",
    label: "Wallet",
    value: formatMoney(user.walletBalance),
    note: "Ready for checkout and top-ups",
    tone: "mint",
  },
  {
    iconKey: "favorite",
    label: "Favorites",
    value: favoritesCount.toString(),
    note: "Saved restaurants for faster repeat orders",
    tone: "sky",
  },
  {
    iconKey: "notification",
    label: "Activity",
    value: (ordersCount + reservationsCount).toString(),
    note: "Orders and bookings on the account",
    tone: "amber",
  },
];

const seedCustomerActivity = async (user, restaurants, events) => {
  const [orderCount, reservationCount, favoriteCount, notificationCount, bookingCount] =
    await Promise.all([
      Order.countDocuments({ userId: user._id }),
      Reservation.countDocuments({ userId: user._id }),
      Favorite.countDocuments({ userId: user._id }),
      Notification.countDocuments({ userId: user._id }),
      EventBooking.countDocuments({ userId: user._id }),
    ]);

  if (
    orderCount > 0 ||
    reservationCount > 0 ||
    favoriteCount > 0 ||
    notificationCount > 0 ||
    bookingCount > 0
  ) {
    return;
  }

  const [restaurantOne, restaurantTwo, restaurantThree] = restaurants;
  const [eventOne] = events;

  if (!user.savedAddresses?.length) {
    user.savedAddresses = [
      {
        label: "Home",
        line1: "43 Park Street",
        city: "Udupi",
        state: "Karnataka",
        pincode: "576101",
        isDefault: true,
      },
    ];
  }

  if (!user.savedPaymentMethods?.length) {
    user.savedPaymentMethods = [
      {
        label: "Wallet",
        type: "wallet",
        provider: "FoodieHub Wallet",
        isDefault: true,
      },
      {
        label: "UPI",
        type: "upi",
        provider: "PhonePe / GPay",
        isDefault: false,
      },
      {
        label: "Cash",
        type: "cash",
        provider: "Pay on delivery",
        isDefault: false,
      },
    ];
  }

  const demoOrders = [
    {
      userId: user._id,
      restaurantId: restaurantOne._id,
      restaurantName: restaurantOne.name,
      restaurantEmoji: restaurantOne.emoji,
      restaurantImageKey: restaurantOne.imageKey,
      cuisine: restaurantOne.cuisine,
      items: [
        {
          menuItemId: restaurantOne.menu[0]._id,
          name: restaurantOne.menu[0].name,
          price: restaurantOne.menu[0].price,
          quantity: 2,
          emoji: restaurantOne.menu[0].emoji,
        },
        {
          menuItemId: restaurantOne.menu[2]._id,
          name: restaurantOne.menu[2].name,
          price: restaurantOne.menu[2].price,
          quantity: 1,
          emoji: restaurantOne.menu[2].emoji,
        },
      ],
      subtotal: restaurantOne.menu[0].price * 2 + restaurantOne.menu[2].price,
      deliveryFee: 0,
      tax: 21,
      total: restaurantOne.menu[0].price * 2 + restaurantOne.menu[2].price + 21,
      paymentMethod: "upi",
      paymentStatus: "Paid",
      status: "Delivered",
      address: "43 Park Street, Udupi, Karnataka",
      notes: "Leave at the door",
      orderCode: generateCode("FHB-"),
      timeline: buildTimeline("Delivered"),
      active: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
    {
      userId: user._id,
      restaurantId: restaurantTwo._id,
      restaurantName: restaurantTwo.name,
      restaurantEmoji: restaurantTwo.emoji,
      restaurantImageKey: restaurantTwo.imageKey,
      cuisine: restaurantTwo.cuisine,
      items: [
        {
          menuItemId: restaurantTwo.menu[0]._id,
          name: restaurantTwo.menu[0].name,
          price: restaurantTwo.menu[0].price,
          quantity: 1,
          emoji: restaurantTwo.menu[0].emoji,
        },
        {
          menuItemId: restaurantTwo.menu[1]._id,
          name: restaurantTwo.menu[1].name,
          price: restaurantTwo.menu[1].price,
          quantity: 1,
          emoji: restaurantTwo.menu[1].emoji,
        },
      ],
      subtotal: restaurantTwo.menu[0].price + restaurantTwo.menu[1].price,
      deliveryFee: 40,
      tax: 18,
      total: restaurantTwo.menu[0].price + restaurantTwo.menu[1].price + 58,
      paymentMethod: "wallet",
      paymentStatus: "Paid",
      status: "On the way",
      address: "43 Park Street, Udupi, Karnataka",
      notes: "Call on arrival",
      orderCode: generateCode("FHB-"),
      timeline: buildTimeline("On the way"),
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 14),
      updatedAt: new Date(),
    },
  ];

  const demoReservations = [
    {
      userId: user._id,
      restaurantId: restaurantTwo._id,
      restaurantName: restaurantTwo.name,
      restaurantEmoji: restaurantTwo.emoji,
      restaurantImageKey: restaurantTwo.imageKey,
      tableSize: "4 seater",
      guests: 4,
      date: formatShortDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)),
      time: "7:00 PM",
      notes: "Window seat if available",
      reservationCode: generateCode("RSV-"),
      tableNumber: "T12",
      status: "Reserved",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      updatedAt: new Date(),
    },
    {
      userId: user._id,
      restaurantId: restaurantThree._id,
      restaurantName: restaurantThree.name,
      restaurantEmoji: restaurantThree.emoji,
      restaurantImageKey: restaurantThree.imageKey,
      tableSize: "2 seater",
      guests: 2,
      date: formatShortDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)),
      time: "8:00 PM",
      notes: "Anniversary dinner",
      reservationCode: generateCode("RSV-"),
      tableNumber: "A04",
      status: "Completed",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 28),
    },
  ];

  const demoBookings = [
    {
      userId: user._id,
      eventId: eventOne._id,
      eventTitle: eventOne.title,
      eventVenue: eventOne.venue,
      eventImageKey: eventOne.imageKey,
      eventTone: eventOne.tone,
      quantity: 2,
      date: eventOne.date,
      time: eventOne.time,
      paymentMethod: "upi",
      total: eventOne.price * 2,
      bookingCode: generateCode("EVT-"),
      status: "Confirmed",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      updatedAt: new Date(),
    },
  ];

  const demoNotifications = [
    {
      userId: user._id,
      type: "order",
      iconKey: "order",
      tone: "sunset",
      title: "Order confirmed",
      meta: restaurantTwo.name,
      description: "Your active order is being prepared right now.",
      badge: "New",
      read: false,
    },
    {
      userId: user._id,
      type: "reservation",
      iconKey: "restaurant",
      tone: "purple",
      title: "Table reserved",
      meta: restaurantTwo.name,
      description: "Your 4 seater is saved for the next dinner booking.",
      badge: "Booked",
      read: false,
    },
    {
      userId: user._id,
      type: "event",
      iconKey: "event",
      tone: "mint",
      title: "Event tickets issued",
      meta: eventOne.title,
      description: "Your concert booking is ready in your account.",
      badge: "Ready",
      read: false,
    },
  ];

  await Promise.all([
    Order.insertMany(demoOrders),
    Reservation.insertMany(demoReservations),
    EventBooking.insertMany(demoBookings),
    Favorite.insertMany([
      {
        userId: user._id,
        restaurantId: restaurantOne._id,
        restaurantName: restaurantOne.name,
        restaurantEmoji: restaurantOne.emoji,
        restaurantImageKey: restaurantOne.imageKey,
        cuisine: restaurantOne.cuisine,
        rating: restaurantOne.rating,
        eta: restaurantOne.eta,
        distance: restaurantOne.distance,
        tags: restaurantOne.tags,
      },
      {
        userId: user._id,
        restaurantId: restaurantThree._id,
        restaurantName: restaurantThree.name,
        restaurantEmoji: restaurantThree.emoji,
        restaurantImageKey: restaurantThree.imageKey,
        cuisine: restaurantThree.cuisine,
        rating: restaurantThree.rating,
        eta: restaurantThree.eta,
        distance: restaurantThree.distance,
        tags: restaurantThree.tags,
      },
    ]),
    Notification.insertMany(demoNotifications),
    user.save(),
  ]);
};

const loadDashboardDocuments = async (userId) => {
  const [restaurants, events, orders, reservations, eventBookings, favorites, notifications, user] =
    await Promise.all([
      Restaurant.find({ active: true }).sort({ rating: -1, createdAt: -1 }),
      Event.find().sort({ featured: -1, date: 1 }),
      Order.find({ userId }).sort({ createdAt: -1 }),
      Reservation.find({ userId }).sort({ createdAt: -1 }),
      EventBooking.find({ userId }).sort({ createdAt: -1 }),
      Favorite.find({ userId }).sort({ createdAt: -1 }),
      Notification.find({ userId }).sort({ createdAt: -1 }),
      User.findById(userId),
    ]);

  if (!user) {
    return null;
  }

  return {
    user,
    restaurants,
    events,
    orders,
    reservations,
    eventBookings,
    favorites,
    notifications,
  };
};

const buildDashboardPayload = ({ user, restaurants, events, orders, reservations, eventBookings, favorites, notifications }) => {
  const mappedRestaurants = restaurants.map(mapRestaurant);
  const mappedEvents = events.map(mapEvent);
  const mappedOrders = orders.map(mapOrder);
  const mappedReservations = reservations.map(mapReservation);
  const mappedBookings = eventBookings.map(mapEventBooking);
  const mappedFavorites = favorites.map(mapFavorite);
  const mappedNotifications = notifications.map(mapNotification);
  const activeOrder =
    mappedOrders.find((order) => order.active && order.status !== "Delivered") || mappedOrders[0] || null;

  const walletTransactions = buildWalletTransactions(
    mappedOrders,
    mappedReservations,
    mappedBookings
  );

  const walletMethods = (user.savedPaymentMethods || []).map((method) => ({
    iconKey:
      method.type === "wallet"
        ? "wallet"
        : method.type === "upi"
          ? "payment"
          : "payment",
    title: method.label,
    meta: method.provider || method.type.toUpperCase(),
    description: method.last4 ? `•••• ${method.last4}` : method.isDefault ? "Primary payment method" : "Ready to use",
    badge: method.isDefault ? "Default" : method.type.toUpperCase(),
    tone: method.type === "wallet" ? "sunset" : method.type === "upi" ? "mint" : "sky",
  }));

  const profileHighlights = buildProfileHighlights(
    user,
    mappedFavorites.length,
    mappedOrders.length,
    mappedReservations.length
  );

  return {
    user: serializeUser(user),
    restaurants: mappedRestaurants,
    events: mappedEvents,
    orders: mappedOrders,
    activeOrder,
    reservations: mappedReservations,
    eventBookings: mappedBookings,
    favorites: mappedFavorites,
    notifications: mappedNotifications,
    wallet: {
      balance: formatMoney(user.walletBalance),
      points: user.rewardPoints?.toLocaleString("en-IN"),
      methods: walletMethods,
      transactions: walletTransactions,
    },
    profileHighlights,
  };
};

const getDashboardDependencies = async (userId) => {
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    return null;
  }

  await ensureBaseCatalog();

  const restaurants = await Restaurant.find({ active: true }).sort({
    rating: -1,
    createdAt: -1,
  });
  const events = await Event.find().sort({ featured: -1, date: 1 });

  await seedCustomerActivity(currentUser, restaurants, events);

  return loadDashboardDocuments(userId);
};

const ensureWalletDeduction = async (user, paymentMethod, amount) => {
  if (paymentMethod !== "wallet") {
    return;
  }

  if (user.walletBalance < amount) {
    const error = new Error("Insufficient wallet balance");
    error.statusCode = 400;
    throw error;
  }

  user.walletBalance -= amount;
  await user.save();
};

const addRewardPoints = async (user, amount) => {
  const rewardPoints = Math.max(10, Math.floor(Number(amount || 0) / 10));
  user.rewardPoints = (user.rewardPoints || 0) + rewardPoints;
  await user.save();

  return rewardPoints;
};

const createNotification = async ({ userId, type, iconKey, tone, title, meta, description, badge }) =>
  Notification.create({
    userId,
    type,
    iconKey,
    tone,
    title,
    meta,
    description,
    badge,
    read: false,
  });

export const seedCustomerCatalog = ensureBaseCatalog;

export const getDashboard = async (req, res) => {
  try {
    const dashboard = await getDashboardDependencies(req.user.id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const payload = buildDashboardPayload(dashboard);

    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to load dashboard",
    });
  }
};

export const getRestaurants = async (req, res) => {
  try {
    await ensureBaseCatalog();

    const restaurants = await Restaurant.find({ active: true }).sort({
      rating: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: restaurants.map(mapRestaurant),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load restaurants",
    });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    await ensureBaseCatalog();

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: mapRestaurant(restaurant),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load restaurant",
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    await ensureBaseCatalog();

    const events = await Event.find().sort({ featured: -1, date: 1 });

    return res.status(200).json({
      success: true,
      data: events.map(mapEvent),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load events",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: orders.map(mapOrder),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load orders",
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, paymentMethod = "upi", address, notes } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const normalizedItems = Array.isArray(items)
      ? items
      : Object.entries(items || {}).map(([menuItemId, quantity]) => ({
          menuItemId,
          quantity,
        }));

    const orderItems = normalizedItems
      .map((item) => {
        const menuItem =
          restaurant.menu.id(item.menuItemId) ||
          restaurant.menu.find((menuEntry) => menuEntry._id.toString() === String(item.menuItemId));

        if (!menuItem) {
          return null;
        }

        const quantity = Number(item.quantity || 0);

        if (quantity <= 0) {
          return null;
        }

        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          emoji: menuItem.emoji,
        };
      })
      .filter(Boolean);

    if (!orderItems.length) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one menu item",
      });
    }

    const subtotal = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const deliveryFee = subtotal >= 299 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    await ensureWalletDeduction(user, paymentMethod, total);

    const order = await Order.create({
      userId: user._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      restaurantEmoji: restaurant.emoji,
      restaurantImageKey: restaurant.imageKey,
      cuisine: restaurant.cuisine,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "Pay on delivery" : "Paid",
      status: "Confirmed",
      address: address || user.savedAddresses?.find((item) => item.isDefault)?.line1 || "",
      notes: notes || "",
      orderCode: generateCode("FHB-"),
      timeline: buildTimeline("Confirmed"),
      active: true,
    });

    const rewardPoints = await addRewardPoints(user, total);

    await createNotification({
      userId: user._id,
      type: "order",
      iconKey: "order",
      tone: "sunset",
      title: "Order placed successfully",
      meta: restaurant.name,
      description: `${paymentMethod.toUpperCase()} payment confirmed • ${formatMoney(total)} total`,
      badge: `+${rewardPoints} pts`,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: mapOrder(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to place order",
    });
  }
};

export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: reservations.map(mapReservation),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load reservations",
    });
  }
};

export const createReservation = async (req, res) => {
  try {
    const { restaurantId, tableSize, guests, date, time, notes } = req.body;

    if (!restaurantId || !tableSize || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Restaurant, table size, date and time are required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const reservation = await Reservation.create({
      userId: req.user.id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      restaurantEmoji: restaurant.emoji,
      restaurantImageKey: restaurant.imageKey,
      tableSize,
      guests: Number(guests || tableSize?.match(/\d+/)?.[0] || 2),
      date,
      time,
      notes: notes || "",
      reservationCode: generateCode("RSV-"),
      tableNumber: `T${Math.floor(Math.random() * 40 + 1)}`,
      status: "Reserved",
    });

    await createNotification({
      userId: req.user.id,
      type: "reservation",
      iconKey: "restaurant",
      tone: "purple",
      title: "Table reserved successfully",
      meta: restaurant.name,
      description: `${tableSize} booked for ${date} at ${time}. Table ${reservation.tableNumber}.`,
      badge: "Booked",
    });

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: mapReservation(reservation),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to create reservation",
    });
  }
};

export const getEventBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: bookings.map(mapEventBooking),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load event bookings",
    });
  }
};

export const bookEvent = async (req, res) => {
  try {
    const { eventId, quantity = 1, paymentMethod = "upi", date, time } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event is required",
      });
    }

    const event = await Event.findById(eventId);
    const user = await User.findById(req.user.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const total = event.price * Number(quantity || 1);

    await ensureWalletDeduction(user, paymentMethod, total);

    if (event.seatsLeft !== undefined && event.seatsLeft !== null) {
      event.seatsLeft = Math.max(0, event.seatsLeft - Number(quantity || 1));
      await event.save();
    }

    const booking = await EventBooking.create({
      userId: user._id,
      eventId: event._id,
      eventTitle: event.title,
      eventVenue: event.venue,
      eventImageKey: event.imageKey,
      eventTone: event.tone,
      quantity: Number(quantity || 1),
      date: date || event.date,
      time: time || event.time,
      paymentMethod,
      total,
      bookingCode: generateCode("EVT-"),
      status: "Confirmed",
    });

    const rewardPoints = await addRewardPoints(user, total);

    await createNotification({
      userId: user._id,
      type: "event",
      iconKey: "event",
      tone: event.tone || "sunset",
      title: "Event booking confirmed",
      meta: event.title,
      description: `${quantity} ticket(s) confirmed for ${event.venue}.`,
      badge: `+${rewardPoints} pts`,
    });

    return res.status(201).json({
      success: true,
      message: "Event booked successfully",
      data: mapEventBooking(booking),
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to book event",
    });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: favorites.map(mapFavorite),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load favorites",
    });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const favorite = await Favorite.findOne({
      userId: req.user.id,
      restaurantId: restaurant._id,
    });

    if (favorite) {
      await Favorite.deleteOne({ _id: favorite._id });

      await createNotification({
        userId: req.user.id,
        type: "favorite",
        iconKey: "favorite",
        tone: "sky",
        title: "Removed from favorites",
        meta: restaurant.name,
        description: "You can add it back any time from the restaurant list.",
        badge: "Updated",
      });

      return res.status(200).json({
        success: true,
        action: "removed",
      });
    }

    const created = await Favorite.create({
      userId: req.user.id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      restaurantEmoji: restaurant.emoji,
      restaurantImageKey: restaurant.imageKey,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      eta: restaurant.eta,
      distance: restaurant.distance,
      tags: restaurant.tags,
    });

    await createNotification({
      userId: req.user.id,
      type: "favorite",
      iconKey: "favorite",
      tone: "mint",
      title: "Added to favorites",
      meta: restaurant.name,
      description: "Saved for faster repeat ordering.",
      badge: "Saved",
    });

    return res.status(201).json({
      success: true,
      action: "added",
      data: mapFavorite(created),
    });
  } catch (error) {
    console.error(error);
    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? "Already saved" : "Unable to update favorite",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: notifications.map(mapNotification),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      {
        read: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: mapNotification(notification),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.id,
      },
      {
        read: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const {
      name,
      phone,
      avatarUrl,
      savedAddresses,
      savedPaymentMethods,
      preferences,
      rewardPoints,
      walletBalance,
    } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (savedAddresses !== undefined) user.savedAddresses = savedAddresses;
    if (savedPaymentMethods !== undefined)
      user.savedPaymentMethods = savedPaymentMethods;
    if (preferences !== undefined) user.preferences = preferences;
    if (rewardPoints !== undefined) user.rewardPoints = Number(rewardPoints);
    if (walletBalance !== undefined) user.walletBalance = Number(walletBalance);

    await user.save();

    await createNotification({
      userId: user._id,
      type: "profile",
      iconKey: "profile",
      tone: "sky",
      title: "Profile updated",
      meta: user.name,
      description: "Your account details have been saved.",
      badge: "Saved",
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

export const getWallet = async (req, res) => {
  try {
    const dashboard = await getDashboardDependencies(req.user.id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const payload = buildDashboardPayload(dashboard);

    return res.status(200).json({
      success: true,
      data: payload.wallet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to load wallet",
    });
  }
};
