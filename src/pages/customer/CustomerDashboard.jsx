import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


import {
  AiOutlineArrowRight,
  AiOutlineBell,
  AiOutlineCalendar,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineHeart,
  AiOutlineHome,
  AiOutlineQuestionCircle,
  AiOutlineSearch,
  AiOutlineSetting,
  AiOutlineShop,
  AiOutlineShoppingCart,
  AiOutlineStar,
  AiOutlineUser,
  AiOutlineWallet,
} from "react-icons/ai";
import {
  MdOutlineAccessTime,
  MdOutlineEventNote,
  MdOutlineFilterList,
  MdOutlineLocationOn,
  MdOutlineNotificationsNone,
  MdOutlinePayment,
  MdOutlinePayments,
  MdOutlineRestaurantMenu,
  MdOutlineSecurity,
  MdOutlineSupportAgent,
  MdOutlineTune,
} from "react-icons/md";
import toast from "react-hot-toast";
import api from "../../api/client";
import CustomerFlowDrawer from "./CustomerFlowDrawer";
import heroImage from "../../assets/food2.png";
import cardFoodImage from "../../assets/food.png";
import rest1 from "../../assets/rest1.jfif";
import rest2 from "../../assets/rest2.jfif";
import rest3 from "../../assets/res3.jfif";
import rest4 from "../../assets/rest4.jfif";
import rest5 from "../../assets/rest5.jfif";
import rest6 from "../../assets/rest6.jfif";
import "../../styles/customer-dashboard.css";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const mediaLookup = {
  food: rest1,
  food2: rest2,
  hero: rest3,
  card: rest4,
  rest1,
  rest2,
  rest3,
  rest4,
  rest5,
  rest6
};

const iconLookup = {
  restaurant: AiOutlineShop,
  order: AiOutlineShoppingCart,
  event: MdOutlineEventNote,
  favorite: AiOutlineHeart,
  wallet: AiOutlineWallet,
  notification: AiOutlineBell,
  profile: AiOutlineUser,
  support: MdOutlineSupportAgent,
  payment: MdOutlinePayment,
  accessTime: MdOutlineAccessTime,
  location: MdOutlineLocationOn,
  review: AiOutlineStar,
  check: AiOutlineCheckCircle,
  question: AiOutlineQuestionCircle,
  settings: AiOutlineSetting,
  tune: MdOutlineTune,
  filter: MdOutlineFilterList,
};

const resolveIcon = (icon, iconKey) => icon || iconLookup[iconKey] || AiOutlineQuestionCircle;

const resolveMedia = (value, fallback = heroImage) => {
  if (!value) {
    return fallback;
  }

  if (value.startsWith?.("http")) {
    return value;
  }

  return mediaLookup[value] || fallback;
};

const formatMoney = (value = 0) => currencyFormatter.format(Number(value || 0));

const sidebarItems = [
  { id: "home", label: "Home", helper: "Daily highlights", icon: AiOutlineHome },
  { id: "restaurants", label: "Restaurants", helper: "Nearby favorites", icon: AiOutlineShop },
  { id: "dineout", label: "Dine-Out", helper: "Reserve Table", icon: AiOutlineCalendar },
  { id: "events", label: "Events", helper: "Tickets & Shows", icon: MdOutlineEventNote },
  { id: "orders", label: "Orders", helper: "Track Orders", icon: AiOutlineShoppingCart },
  { id: "favorites", label: "Favorites", helper: "My Favorites", icon: AiOutlineHeart },
  { id: "wallet", label: "Wallet", helper: "Rs. 2,450", icon: AiOutlineWallet },
  { id: "reviews", label: "Reviews", helper: "My Reviews", icon: AiOutlineStar },
  { id: "notifications", label: "Notifications", helper: "Live alerts", badge: "3", icon: AiOutlineBell },
  { id: "profile", label: "Profile", helper: "Account", icon: AiOutlineUser },
  { id: "support", label: "Support", helper: "Help center", icon: MdOutlineSupportAgent },
  { id: "settings", label: "Settings", helper: "Preferences", icon: AiOutlineSetting },
];

const sectionMeta = {
  home: {
    title: "Home",
    subtitle: "Discover food, reserve tables and explore events.",
  },
  restaurants: {
    title: "Restaurants",
    subtitle: "Open-now kitchens, featured menus and quick filtering in one view.",
  },
  dineout: {
    title: "Dine-Out",
    subtitle: "Book the right table with ambience, timing and guest count in mind.",
  },
  events: {
    title: "Events",
    subtitle: "Food festivals, tasting nights and live experiences worth joining.",
  },
  orders: {
    title: "Orders",
    subtitle: "Follow active deliveries and review your recent order history.",
  },
  favorites: {
    title: "Favorites",
    subtitle: "Your saved restaurants and dishes, ready to reorder any time.",
  },
  wallet: {
    title: "Wallet",
    subtitle: "Check balance, recent payments and cashback at a glance.",
  },
  reviews: {
    title: "Reviews",
    subtitle: "Track your ratings, feedback and the places you love most.",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Delivery updates, reminders and important account alerts.",
  },
  profile: {
    title: "Profile",
    subtitle: "Manage your account details, addresses and dining preferences.",
  },
  support: {
    title: "Support",
    subtitle: "Fast help for orders, payments and general account questions.",
  },
  settings: {
    title: "Settings",
    subtitle: "Shape the experience with privacy, alerts and personalization.",
  },
};

const homeQuickActions = [
  {
    icon: AiOutlineShoppingCart,
    label: "Order food",
    helper: "Fast delivery",
    tone: "sunset",
    target: "restaurants",
  },
  {
    icon: AiOutlineCalendar,
    label: "Book table",
    helper: "Dine-in reservations",
    tone: "purple",
    target: "dineout",
  },
  {
    icon: MdOutlineEventNote,
    label: "Explore events",
    helper: "Tickets & passes",
    tone: "green",
    target: "events",
  },
];

const homeCategories = [
  { emoji: "🍕", label: "Pizza", tone: "sunset" },
  { emoji: "🍔", label: "Burgers", tone: "amber" },
  { emoji: "🥡", label: "Chinese", tone: "sky" },
  { emoji: "☕", label: "Cafe", tone: "sand" },
  { emoji: "🥗", label: "Healthy", tone: "mint" },
  { emoji: "🍰", label: "Desserts", tone: "rose" },
];

const featuredRestaurants = [
  {
    id: "demo-coastal-kitchen",
    image: "rest1",
    imagePosition: "center center",
    name: "The Coastal Kitchen",
    cuisine: "Seafood, Indian",
    rating: "4.6",
    time: "20 mins",
    distance: "2.3 km",
    status: "20 mins",
    tone: "sky",
    tags: ["Open now", "Free delivery"],
  },
  {
    id: "demo-pizza-palace",
    image: "rest2",
    imagePosition: "center center",
    name: "Pizza Palace",
    cuisine: "Pizza, Italian",
    rating: "4.4",
    time: "25 mins",
    distance: "1.5 km",
    status: "25 mins",
    tone: "sunset",
    tags: ["Top rated", "Free delivery"],
  },
  {
    id: "demo-sushi-world",
    image: "rest3",
    imagePosition: "center top",
    name: "Sushi World",
    cuisine: "Sushi, Japanese",
    rating: "4.7",
    time: "30 mins",
    distance: "2.1 km",
    status: "30 mins",
    tone: "mint",
    tags: ["Fresh prep", "Free delivery"],
  },
  {
    id: "demo-burger-barn",
    image: "rest4",
    imagePosition: "center right",
    name: "Burger Barn",
    cuisine: "Burgers, American",
    rating: "4.5",
    time: "15 mins",
    distance: "0.8 km",
    status: "15 mins",
    tone: "amber",
    tags: ["Free delivery", "Late night"],
  },
];

const homeOffers = [
  {
    image: "rest5",
    title: "60% OFF",
    description: "Get up to ₹120 on orders above ₹299.",
    code: "FOODIE60",
    validTill: "31 May",
    tone: "sunset",
  },
  {
    image: "rest6",
    title: "40% OFF",
    description: "Get up to ₹100 on orders above ₹249.",
    code: "YUMMY40",
    validTill: "25 May",
    tone: "amber",
  },
  {
    image: "rest1",
    title: "Flat ₹80 OFF",
    description: "On your first order.",
    code: "WELCOME80",
    validTill: "30 May",
    tone: "mint",
  },
];

const homeEvents = [
  {
    title: "Arijit Singh Live in Concert",
    meta: "24 May 2025 • 7:00 PM",
    location: "Manipal Academy, Udupi",
    price: "₹999 onwards",
    actionLabel: "Book Now",
    tone: "sunset",
  },
  {
    title: "Stand-up Comedy Night",
    meta: "31 May 2025 • 8:00 PM",
    location: "Orion Mall, Udupi",
    price: "₹399 onwards",
    actionLabel: "Book Now",
    tone: "purple",
  },
];

const recentOrders = [
  {
    id: 1,
    logo: "🍔",
    restaurant: "KFC Express",
    items: "2 Chicken Meals",
    status: "Delivered",
    amount: "Rs. 498",
    time: "15 May 2025 01:20 PM",
    tone: "mint",
  },
  {
    id: 2,
    logo: "🍕",
    restaurant: "Pizza Palace",
    items: "Farmhouse Pizza",
    status: "Delivered",
    amount: "Rs. 349",
    time: "13 May 2025 08:45 PM",
    tone: "sunset",
  },
  {
    id: 3,
    logo: "🍣",
    restaurant: "The Coastal Kitchen",
    items: "Fish Curry and Rice",
    status: "Delivered",
    amount: "Rs. 299",
    time: "08 May 2025 12:30 PM",
    tone: "sky",
  },
];

const orderTimeline = [
  { label: "Confirmed", time: "1:05 PM", state: "done" },
  { label: "Preparing", time: "1:10 PM", state: "done" },
  { label: "On the way", time: "1:20 PM", state: "current" },
  { label: "Delivered", time: "-", state: "pending" },
];

const homeFeatures = [
  {
    icon: MdOutlineAccessTime,
    title: "Live tracking",
    description: "Follow the delivery from kitchen to door.",
    tone: "sunset",
  },
  {
    icon: AiOutlineCheckCircle,
    title: "Secure checkout",
    description: "Trusted payments and saved cards.",
    tone: "mint",
  },
  {
    icon: AiOutlineHeart,
    title: "Smart favorites",
    description: "Reorder your regulars in one tap.",
    tone: "rose",
  },
  {
    icon: MdOutlineSupportAgent,
    title: "24/7 support",
    description: "Help whenever plans change.",
    tone: "sky",
  },
];

const restaurantFilters = [
  { label: "Open now", tone: "sunset" },
  { label: "Top rated", tone: "amber" },
  { label: "Free delivery", tone: "mint" },
  { label: "Healthy", tone: "sky" },
  { label: "Budget friendly", tone: "sand" },
];

const restaurantCollections = [
  {
    icon: MdOutlineRestaurantMenu,
    title: "Curated menus",
    meta: "Chefs picks from nearby kitchens",
    tone: "sunset",
  },
  {
    icon: AiOutlineClockCircle,
    title: "Fastest delivery",
    meta: "Short routes and live ETA updates",
    tone: "mint",
  },
  {
    icon: MdOutlineLocationOn,
    title: "Best nearby",
    meta: "Top restaurants under 3 km away",
    tone: "sky",
  },
];

const dineOutCards = [
  {
    icon: AiOutlineCalendar,
    title: "Window table for 2",
    meta: "Garden Lounge - available in 20 min",
    description: "Quiet, bright and perfect for a dinner date.",
    tone: "sunset",
  },
  {
    icon: AiOutlineCalendar,
    title: "Family booth",
    meta: "Heritage Bistro - available tonight",
    description: "Comfort seating with room for everyone.",
    tone: "amber",
  },
  {
    icon: AiOutlineCalendar,
    title: "Rooftop view",
    meta: "Sky Deck - Friday evening slots",
    description: "For birthdays, celebrations and good photos.",
    tone: "sky",
  },
];

const dineOutPerks = [
  {
    icon: AiOutlineCheckCircle,
    title: "Priority seating",
    meta: "Quick confirmation and queue updates.",
    tone: "mint",
  },
  {
    icon: MdOutlineTune,
    title: "Filter by vibe",
    meta: "Casual, fine dining, rooftop and more.",
    tone: "sand",
  },
  {
    icon: MdOutlineLocationOn,
    title: "Nearby choices",
    meta: "Find the closest premium spots instantly.",
    tone: "rose",
  },
];

const eventCards = [
  {
    icon: MdOutlineEventNote,
    title: "Friday Tasting Night",
    meta: "28 Jun, 8:00 PM",
    description: "Seven course menu with live music and chef stories.",
    badge: "Tickets live",
    tone: "sunset",
  },
  {
    icon: MdOutlineEventNote,
    title: "Street Food Festival",
    meta: "02 Jul, 6:00 PM",
    description: "Local vendors, bites, desserts and late night music.",
    badge: "Limited seats",
    tone: "amber",
  },
  {
    icon: MdOutlineEventNote,
    title: "Chef's Table Experience",
    meta: "05 Jul, 7:30 PM",
    description: "Private tasting with premium seating and pairings.",
    badge: "Exclusive",
    tone: "sky",
  },
];

const eventSchedule = [
  {
    icon: AiOutlineClockCircle,
    title: "Tonight's shortlist",
    meta: "3 live events match your preferences",
    description: "Shortlist the ones you want and save a reminder.",
    tone: "mint",
  },
  {
    icon: MdOutlineNotificationsNone,
    title: "Reminder alerts",
    meta: "Get a ping 30 minutes before entry time",
    description: "Never miss the start of your reserved slot.",
    tone: "sand",
  },
];

const favoritesRestaurants = [
  {
    icon: AiOutlineHeart,
    title: "Pizza Palace",
    meta: "Family favorite and quick reorder",
    description: "Your most ordered pizza spot with reliable delivery.",
    badge: "Saved",
    tone: "sunset",
  },
  {
    icon: AiOutlineHeart,
    title: "The Coastal Kitchen",
    meta: "Fresh seafood and dine-out favorite",
    description: "Great for dates, celebrations and weekend plans.",
    badge: "Saved",
    tone: "sky",
  },
  {
    icon: AiOutlineHeart,
    title: "Burger Barn",
    meta: "Late night comfort food",
    description: "Your go-to when you want something fast and filling.",
    badge: "Saved",
    tone: "amber",
  },
];

const favoriteDishes = [
  {
    icon: AiOutlineStar,
    title: "Farmhouse Pizza",
    meta: "Pizza Palace",
    description: "Classic veggie-loaded pizza with extra cheese.",
    badge: "Top repeat",
    tone: "mint",
  },
  {
    icon: AiOutlineStar,
    title: "Chicken Burger",
    meta: "Burger Barn",
    description: "Crunchy, juicy and always a quick win.",
    badge: "Fast reorder",
    tone: "sunset",
  },
  {
    icon: AiOutlineStar,
    title: "Fish Curry and Rice",
    meta: "The Coastal Kitchen",
    description: "Comfort meal with strong home-style flavors.",
    badge: "Weekend pick",
    tone: "sky",
  },
];

const walletStats = [
  {
    icon: AiOutlineWallet,
    label: "Wallet balance",
    value: "Rs. 2,480",
    note: "Cashback ready to use",
    tone: "sunset",
  },
  {
    icon: MdOutlinePayments,
    label: "Saved payments",
    value: "04",
    note: "UPI, debit and credit",
    tone: "mint",
  },
  {
    icon: AiOutlineHeart,
    label: "Cashback earned",
    value: "Rs. 180",
    note: "This month alone",
    tone: "amber",
  },
];

const walletMethods = [
  {
    icon: MdOutlinePayment,
    title: "UPI",
    meta: "deepti@upi",
    description: "Primary payment method for fast checkout.",
    badge: "Primary",
    tone: "mint",
  },
  {
    icon: MdOutlinePayment,
    title: "Visa ending 4242",
    meta: "Saved card",
    description: "Fallback method for larger orders and bookings.",
    badge: "Backup",
    tone: "sky",
  },
];

const walletTransactions = [
  {
    icon: AiOutlineWallet,
    title: "Cashback from Pizza Palace",
    meta: "Today 10:42 AM",
    description: "+Rs. 48 credited to your wallet.",
    badge: "Credit",
    tone: "mint",
  },
  {
    icon: AiOutlineShoppingCart,
    title: "Order payment",
    meta: "Yesterday 08:15 PM",
    description: "-Rs. 349 for Burger Barn dinner order.",
    badge: "Debit",
    tone: "sunset",
  },
  {
    icon: AiOutlineWallet,
    title: "Wallet top up",
    meta: "12 May 2025",
    description: "+Rs. 500 added through your saved card.",
    badge: "Credit",
    tone: "amber",
  },
];

const reviewStats = [
  {
    icon: AiOutlineStar,
    label: "Average rating",
    value: "4.8",
    note: "Across all reviews",
    tone: "sunset",
  },
  {
    icon: AiOutlineCheckCircle,
    label: "Helpful feedback",
    value: "18",
    note: "Reviews marked helpful",
    tone: "mint",
  },
  {
    icon: AiOutlineHeart,
    label: "Loved places",
    value: "09",
    note: "Restaurants you keep returning to",
    tone: "sky",
  },
];

const reviewCards = [
  {
    icon: AiOutlineStar,
    title: "The Coastal Kitchen",
    meta: "5.0 rating from your last visit",
    description: "Fresh food, quick service and a calm dine-out experience.",
    badge: "Excellent",
    tone: "mint",
  },
  {
    icon: AiOutlineStar,
    title: "Pizza Palace",
    meta: "4.5 rating from your recent order",
    description: "Reliable crust, generous toppings and hot delivery.",
    badge: "Strong",
    tone: "sunset",
  },
  {
    icon: AiOutlineStar,
    title: "Burger Barn",
    meta: "4.4 rating from your late-night order",
    description: "Fast delivery and a good value meal for the price.",
    badge: "Consistent",
    tone: "amber",
  },
];

const notifications = [
  {
    icon: AiOutlineBell,
    title: "Delivery partner is 4 minutes away",
    meta: "Burger Barn order",
    description: "Be ready for a quick handoff at the door.",
    badge: "Unread",
    tone: "sunset",
  },
  {
    icon: AiOutlineBell,
    title: "Your refund has been processed",
    meta: "Wallet credit Rs. 120",
    description: "The amount is now available in your balance.",
    badge: "Unread",
    tone: "mint",
  },
  {
    icon: AiOutlineBell,
    title: "Weekend dine-out offer is live",
    meta: "Three premium tables nearby",
    description: "A curated set of dinner spots just opened up.",
    badge: "New",
    tone: "sky",
  },
];

const profileHighlights = [
  {
    icon: AiOutlineUser,
    label: "Display name",
    value: "Deepthi",
    note: "Visible in delivery and support chats",
    tone: "sunset",
  },
  {
    icon: MdOutlineLocationOn,
    label: "Default address",
    value: "43 Park Street",
    note: "Home delivery address",
    tone: "mint",
  },
  {
    icon: MdOutlineRestaurantMenu,
    label: "Dining preference",
    value: "No onion, extra spicy",
    note: "Saved for faster checkout",
    tone: "sky",
  },
];

const supportChannels = [
  {
    icon: MdOutlineSupportAgent,
    title: "Chat with support",
    meta: "Average reply in 2 minutes",
    description: "Best for delivery, refund and menu questions.",
    badge: "Live",
    tone: "sunset",
  },
  {
    icon: AiOutlineQuestionCircle,
    title: "Call support",
    meta: "Talk to a live specialist",
    description: "Ideal for urgent issues and payment follow-ups.",
    badge: "Fast",
    tone: "mint",
  },
  {
    icon: MdOutlineNotificationsNone,
    title: "Order alerts",
    meta: "Keep track of updates in one place",
    description: "Push updates, reminders and status changes.",
    badge: "On",
    tone: "sky",
  },
];

const faqItems = [
  {
    icon: AiOutlineQuestionCircle,
    title: "How do refunds work?",
    meta: "Most refunds are credited to your wallet or original payment source.",
    description: "You can review status anytime from the orders or wallet section.",
    tone: "sand",
  },
  {
    icon: AiOutlineQuestionCircle,
    title: "Can I change my address?",
    meta: "Yes, update saved addresses before placing the order.",
    description: "Profile changes apply on your next checkout flow.",
    tone: "mint",
  },
];

const settingsGroups = [
  {
    icon: MdOutlineTune,
    title: "Personalization",
    meta: "Diet filters, favorite cuisines and budget preferences.",
    description: "Shape search results around your taste.",
    badge: "Edit",
    tone: "sunset",
  },
  {
    icon: MdOutlineSecurity,
    title: "Privacy and security",
    meta: "Password, login alerts and device management.",
    description: "Keep your account safe with a few quick checks.",
    badge: "Review",
    tone: "mint",
  },
  {
    icon: MdOutlineNotificationsNone,
    title: "Notification controls",
    meta: "Delivery, offers and reminder preferences.",
    description: "Fine-tune what reaches your inbox and phone.",
    badge: "Manage",
    tone: "sky",
  },
];

function getInitials(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SectionShell({
  eyebrow = "Curated for you",
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  className = "",
}) {
  return (
    <section className={`section-shell ${className}`.trim()}>
      <div className="section-shell__header">
        <div>
          <p className="section-shell__eyebrow">{eyebrow}</p>
          <h2 className="section-shell__title">{title}</h2>
          {subtitle ? <p className="section-shell__description">{subtitle}</p> : null}
        </div>
        {actionLabel ? (
          <button type="button" className="section-shell__action" onClick={onAction}>
            <span>{actionLabel}</span>
            <AiOutlineArrowRight />
          </button>
        ) : null}
      </div>
      <div className="section-shell__body">{children}</div>
    </section>
  );
}

function MetricCard({ icon: Icon, iconKey, label, value, note, tone = "sunset" }) {
  const ResolvedIcon = resolveIcon(Icon, iconKey);

  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card__icon">
        <ResolvedIcon />
      </div>
      <div className="metric-card__body">
        <p className="metric-card__label">{label}</p>
        <h3 className="metric-card__value">{value}</h3>
        <p className="metric-card__note">{note}</p>
      </div>
    </article>
  );
}

function ActionCard({ icon: Icon, label, helper, tone = "sunset", onClick }) {
  return (
    <button type="button" className={`action-card tone-${tone}`} onClick={onClick}>
      <span className="action-card__icon">
        <Icon />
      </span>
      <span className="action-card__label">{label}</span>
      <span className="action-card__helper">{helper}</span>
    </button>
  );
}

function MoodCard({ emoji, label, description, tone = "sunset", onClick }) {
  return (
    <button type="button" className={`mood-card tone-${tone}`} onClick={onClick}>
      <span className="mood-card__badge">{emoji}</span>
      <span className="mood-card__label">{label}</span>
      {description ? <span className="mood-card__description">{description}</span> : null}
    </button>
  );
}

function ListCard({
  icon: Icon,
  iconKey,
  title,
  meta,
  description,
  badge,
  tone = "sunset",
  actionLabel,
  onAction,
}) {
  const ResolvedIcon = resolveIcon(Icon, iconKey);

  return (
    <article className="list-card">
      <div className={`list-card__icon tone-${tone}`}>
        <ResolvedIcon />
      </div>
      <div className="list-card__body">
        <div className="list-card__header">
          <div>
            <h3 className="list-card__title">{title}</h3>
            {meta ? <p className="list-card__meta">{meta}</p> : null}
          </div>
          {badge ? <span className="status-chip">{badge}</span> : null}
        </div>
        {description ? <p className="list-card__description">{description}</p> : null}
      </div>
      {actionLabel ? (
        <button type="button" className="list-card__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

function RestaurantCard({
  restaurant,
  onSelect,
  onToggleFavorite,
  isFavorite = false,
  primaryActionLabel = "View menu",
}) {
  const imageSource = resolveMedia(restaurant.image || restaurant.imageKey);

  return (
    <article className="restaurant-card" role="button" tabIndex={0} onClick={() => onSelect?.(restaurant)} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(restaurant);
      }
    }}>
      <div className="restaurant-card__media">
        <img src={imageSource} alt="" className="restaurant-card__image" style={{ objectPosition: restaurant.imagePosition }} />
        <span className="restaurant-card__media-chip restaurant-card__media-chip--left">{restaurant.time}</span>
        <span className="restaurant-card__media-chip restaurant-card__media-chip--right">
          <AiOutlineStar />
          {restaurant.rating}
        </span>
        {onToggleFavorite ? (
          <button
            type="button"
            className={`restaurant-card__favorite ${isFavorite ? "is-active" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(restaurant);
            }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <AiOutlineHeart />
          </button>
        ) : null}
      </div>
      <div className="restaurant-card__body">
        <div className="restaurant-card__title-row">
          <div>
            <h3>{restaurant.name}</h3>
            <p>{restaurant.cuisine}</p>
          </div>
        </div>
        <div className="restaurant-card__meta">
          <span>
            <MdOutlineAccessTime />
            {restaurant.time}
          </span>
          <span>
            <MdOutlineLocationOn />
            {restaurant.distance}
          </span>
        </div>
        <div className="tag-row">
          {restaurant.tags.map((tag) => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>
        <div className="restaurant-card__actions">
          <button type="button" className="link-button" onClick={(event) => {
            event.stopPropagation();
            onSelect?.(restaurant);
          }}>
            {restaurant.actionLabel || primaryActionLabel}
          </button>
          {onToggleFavorite ? (
            <button
              type="button"
              className={`link-button link-button--secondary ${isFavorite ? "is-active" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(restaurant);
              }}
            >
              {isFavorite ? "Saved" : "Favorite"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EventCard({ event, onSelect }) {
  const imageSource = resolveMedia(event.image || event.imageKey);

  return (
    <article className={`event-card tone-${event.tone}`}>
      <div className="event-card__poster">
        <img src={imageSource} alt="" className="event-card__poster-image" />
        <div className="event-card__poster-glow" />
        <span className="event-card__poster-tag">{event.category || "LIVE"}</span>
        <span className="event-card__poster-title">{event.title.split(" ").slice(0, 2).join(" ")}</span>
      </div>
      <div className="event-card__body">
        <h3>{event.title}</h3>
        <p className="event-card__meta">{event.meta || `${event.date} • ${event.time}`}</p>
        <p className="event-card__location">{event.location || event.venue}</p>
        <div className="event-card__footer">
          <strong>{event.price}</strong>
          <button type="button" className="event-card__button" onClick={() => onSelect?.(event)}>
            {event.actionLabel || "Book Now"}
          </button>
        </div>
      </div>
    </article>
  );
}

function OfferCard({ offer }) {
  return (
    <article className="offer-card">
      <div className="offer-card__media">
        <img src={offer.image} alt="" className="offer-card__image" />
        <span className={`offer-card__title tone-${offer.tone}`}>{offer.title}</span>
      </div>
      <p className="offer-card__description">{offer.description}</p>
      <div className="offer-card__footer">
        <span className="offer-card__meta">Valid till {offer.validTill}</span>
        <span className="offer-card__code">{offer.code}</span>
      </div>
    </article>
  );
}

function SidebarButton({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className={`sidebar-link ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <span className="sidebar-link__icon">
        <Icon />
      </span>
      <span className="sidebar-link__body">
        <span className="sidebar-link__label">{item.label}</span>
        <span className="sidebar-link__helper">{item.helper}</span>
      </span>
      {item.badge ? <span className="sidebar-link__badge">{item.badge}</span> : null}
      <AiOutlineArrowRight className="sidebar-link__chev" />
    </button>
  );
}

function OrderRow({ order, onClick }) {
  return (
    <article className="order-row" role="button" tabIndex={0} onClick={() => onClick?.(order)} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick?.(order);
      }
    }}>
      <div className="order-row__avatar">{order.logo}</div>
      <div className="order-row__body">
        <div className="order-row__top">
          <div>
            <h3>{order.restaurant}</h3>
            <p>{order.items}</p>
          </div>
          <span className="status-chip status-chip--success">{order.status}</span>
        </div>
        <div className="order-row__meta">
          <span>{order.time}</span>
          <strong>{order.amount}</strong>
        </div>
      </div>
      <AiOutlineArrowRight className="order-row__arrow" />
    </article>
  );
}

function FeatureCard({ icon: Icon, title, description, tone = "sunset" }) {
  return (
    <article className={`feature-card tone-${tone}`}>
      <div className="feature-card__icon">
        <Icon />
      </div>
      <div className="feature-card__body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

function HomeSection({
  onNavigate,
  userName,
  userInitial,
  rewardPoints,
  dashboardData,
  onOpenFlow,
  onToggleFavorite,
}) {
  const restaurants = dashboardData?.restaurants?.length
    ? dashboardData.restaurants
    : featuredRestaurants;
  const events = dashboardData?.events?.length ? dashboardData.events : homeEvents;
  const orders = dashboardData?.orders?.length ? dashboardData.orders : recentOrders;
  const favorites = dashboardData?.favorites || [];

  return (
    <div className="dashboard-stack home-stack">
      <section className="hero-panel">
        <div className="hero-panel__topbar">
          <div className="hero-location">
            <MdOutlineLocationOn />
            <span>Udupi, Karnataka</span>
            <span className="hero-location__caret">⌄</span>
          </div>
          <div className="hero-account">
            <button type="button" className="hero-icon-button" onClick={() => onNavigate("notifications")} aria-label="Notifications">
              <AiOutlineBell />
            </button>
            <button type="button" className="hero-user-chip" onClick={() => onNavigate("profile")}>
              <div className="hero-user-chip__avatar">{userInitial}</div>
              <div className="hero-user-chip__body">
                <strong>{userName}</strong>
                <span>Gold Member</span>
              </div>
            </button>
          </div>
        </div>

        <div className="hero-panel__content">
          <div className="hero-panel__copy">
            <p className="hero-panel__eyebrow">Welcome Back,</p>
            <h2>
              {userName}!
              <span className="hero-panel__wave">👋</span>
            </h2>
            <p className="hero-panel__description">
              Discover Food, Reserve Tables & Explore Events
            </p>

            <div className="hero-panel__actions">
              {homeQuickActions.map((action) => (
                <ActionCard
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  helper={action.helper}
                  tone={action.tone}
                  onClick={() => onNavigate(action.target)}
                />
              ))}
            </div>

            <div className="hero-search">
              <div className="hero-search__box">
                <AiOutlineSearch />
                <input
                  type="text"
                  placeholder="Search restaurants, cuisines, dishes, events..."
                />
              </div>
              <button type="button" className="hero-search__filter" aria-label="Open filters">
                <MdOutlineFilterList />
              </button>
            </div>
          </div>

          <div className="hero-panel__visual">
            <img src={heroImage} alt="Featured food spread" />
            <div className="hero-panel__visual-badge hero-panel__visual-badge--top">Dinex</div>
            <div className="hero-panel__visual-badge hero-panel__visual-badge--bottom">{rewardPoints} pts</div>
          </div>
        </div>
      </section>

      <SectionShell
        eyebrow="Mood based"
        title="What are you craving?"
        subtitle=""
        actionLabel="View all"
        onAction={() => onNavigate("restaurants")}
      >
        <div className="category-grid">
          {homeCategories.map((category) => (
            <MoodCard
              key={category.label}
              emoji={category.emoji}
              label={category.label}
              description={category.description}
              tone={category.tone}
              onClick={() => onNavigate("restaurants")}
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Local favorites"
        title="Popular Restaurants Near You"
        subtitle=""
        actionLabel="View all"
        onAction={() => onNavigate("restaurants")}
      >
        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id || restaurant.name}
              restaurant={restaurant}
              onSelect={(item) => onOpenFlow("restaurant", item)}
              onToggleFavorite={
                dashboardData?.favorites?.length ? onToggleFavorite : undefined
              }
              isFavorite={favorites.some(
                (favorite) => favorite.restaurantId === restaurant.id
              )}
            />
          ))}
        </div>
      </SectionShell>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Offers For You"
          title="Offers For You"
          subtitle=""
          actionLabel="View all"
          onAction={() => onNavigate("wallet")}
        >
          <div className="offer-grid">
            {homeOffers.map((offer) => (
              <OfferCard key={offer.code} offer={offer} />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Upcoming Events"
          title="Upcoming Events"
          subtitle=""
          actionLabel="View all"
          onAction={() => onNavigate("events")}
        >
          <div className="event-list">
            {events.map((event) => (
              <EventCard
                key={event.id || event.title}
                event={event}
                onSelect={(item) => onOpenFlow("event", item)}
              />
            ))}
          </div>
        </SectionShell>
      </div>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Your Recent Orders"
          title="Your Recent Orders"
          subtitle=""
          actionLabel="View all"
          onAction={() => onNavigate("orders")}
        >
          <div className="order-list">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} onClick={(item) => onOpenFlow("order", item)} />
            ))}
          </div>
          <button type="button" className="order-list__footer-link" onClick={() => onNavigate("orders")}>
            View All Orders <AiOutlineArrowRight />
          </button>
        </SectionShell>

        <SectionShell
          eyebrow="Track Your Order"
          title="Track Your Order"
          subtitle=""
          actionLabel="View all"
          onAction={() => onNavigate("support")}
        >
          <div className="tracking-card">
            <div className="tracking-card__header">
              <span className="tracking-card__id">
                Order ID: {dashboardData?.activeOrder?.orderCode || "#FHB83291"}
              </span>
              <span className="status-chip status-chip--blue">
                {dashboardData?.activeOrder?.status || "In Transit"}
              </span>
            </div>
            <div className="tracking-card__restaurant">
              <div className="tracking-card__mini-logo">
                {dashboardData?.activeOrder?.restaurantEmoji || "🍔"}
              </div>
              <div>
                <strong>{dashboardData?.activeOrder?.restaurant || "Burger Barn"}</strong>
                <span>{dashboardData?.activeOrder?.items || "1 x Classic Burger, 1 x Fries"}</span>
              </div>
            </div>
            <div className="timeline">
              {(dashboardData?.activeOrder?.timeline || orderTimeline).map((step) => (
                <div key={step.label} className={`timeline-step is-${step.state}`}>
                  <span className="timeline-step__dot">
                    {step.state === "done" ? <AiOutlineCheckCircle /> : <AiOutlineClockCircle />}
                  </span>
                  <strong>{step.label}</strong>
                  <span>{step.time}</span>
                </div>
              ))}
            </div>
            <div className="tracking-card__details">
              <div className="tracking-card__row">
                <div className="tracking-card__partner">
                  <div className="tracking-card__partner-avatar">RK</div>
                  <div>
                    <strong>Ravi Kumar</strong>
                    <span>Your delivery partner</span>
                  </div>
                </div>
                <div className="tracking-card__actions">
                  <button type="button" className="partner-action-btn">📞</button>
                  <button type="button" className="partner-action-btn">💬</button>
                </div>
              </div>
            </div>
          </div>
        </SectionShell>
      </div>

      <SectionShell
        eyebrow="Why it works"
        title="Why people keep coming back"
        subtitle=""
      >
        <div className="feature-grid">
          {homeFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              tone={feature.tone}
            />
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

function RestaurantsSection({ onNavigate, dashboardData, onOpenFlow, onToggleFavorite }) {
  const restaurants = dashboardData?.restaurants?.length
    ? dashboardData.restaurants
    : featuredRestaurants;
  const favorites = dashboardData?.favorites || [];

  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Filter first"
        title="Restaurants near you"
        subtitle="Open now, top rated and easy to filter for your next order."
        actionLabel="Book a table"
        onAction={() => onNavigate("dineout")}
      >
        <div className="pill-row">
          {restaurantFilters.map((filter) => (
            <span key={filter.label} className={`pill tone-${filter.tone}`}>
              {filter.label}
            </span>
          ))}
        </div>
        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id || restaurant.name}
              restaurant={restaurant}
              onSelect={(item) => onOpenFlow("restaurant", item)}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.some((favorite) => favorite.restaurantId === restaurant.id)}
            />
          ))}
        </div>
      </SectionShell>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Collections"
          title="Curated shortcuts"
          subtitle="Different ways to narrow down the restaurants you want."
        >
          <div className="list-stack">
            {restaurantCollections.map((collection) => (
              <ListCard
                key={collection.title}
                icon={collection.icon}
                title={collection.title}
                meta={collection.meta}
                tone={collection.tone}
              />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Fast choices"
          title="Quick picks"
          subtitle="A small shortlist for the next tap."
        >
          <div className="list-stack">
            <ListCard
              icon={AiOutlineCheckCircle}
              title="Open kitchens"
              meta="Short wait times and live order slots"
              description="Great for lunch when speed matters."
              tone="mint"
            />
            <ListCard
              icon={AiOutlineStar}
              title="Highest rated"
              meta="Customer loved places"
              description="Good when quality and consistency matter."
              tone="sunset"
            />
            <ListCard
              icon={MdOutlineLocationOn}
              title="Closest to you"
              meta="Best options within 2 km"
              description="Useful when you want food quickly."
              tone="sky"
            />
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function DineOutSection({ dashboardData, onOpenFlow, onToggleFavorite }) {
  const restaurants = dashboardData?.restaurants?.length
    ? dashboardData.restaurants
    : featuredRestaurants;
  const favorites = dashboardData?.favorites || [];

  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Book a table"
        title="Dine-out picks"
        subtitle="Table options and ambience focused spots for your next reservation."
      >
        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id || restaurant.name}
              restaurant={{
                ...restaurant,
                actionLabel: "Reserve table",
              }}
              primaryActionLabel="Reserve table"
              onSelect={(item) => onOpenFlow("reservation", item)}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.some((favorite) => favorite.restaurantId === restaurant.id)}
            />
          ))}
        </div>
      </SectionShell>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Reservation flow"
          title="How booking feels"
          subtitle="Less friction, clearer slots and a better table experience."
        >
          <div className="list-stack">
            <ListCard
              icon={AiOutlineCheckCircle}
              title="Pick an ambience"
              meta="Rooftop, quiet corner, family seating and more"
              tone="sunset"
            />
            <ListCard
              icon={MdOutlineTune}
              title="Filter by vibe"
              meta="Casual, premium and quick bites"
              tone="amber"
            />
            <ListCard
              icon={MdOutlineLocationOn}
              title="Reserve nearby"
              meta="See available tables before you head out"
              tone="mint"
            />
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Extra perks"
          title="Why dine-out works"
          subtitle="The extra details that make bookings feel smooth."
        >
          <div className="list-stack">
            {dineOutPerks.map((perk) => (
              <ListCard
                key={perk.title}
                icon={perk.icon}
                title={perk.title}
                meta={perk.meta}
                tone={perk.tone}
              />
            ))}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function EventsSection({ dashboardData, onOpenFlow }) {
  const events = dashboardData?.events?.length ? dashboardData.events : homeEvents;
  const restaurants = dashboardData?.restaurants?.length
    ? dashboardData.restaurants
    : featuredRestaurants;
  const planEventOptions = restaurants.map((restaurant, index) => {
    const sourceEvent = events[index % Math.max(events.length, 1)] || {};
    return {
      ...sourceEvent,
      id: sourceEvent.id,
      title: restaurant.name,
      location: restaurant.location || restaurant.distance,
      venue: restaurant.location || restaurant.distance,
      category: "Restaurant",
      meta: `${restaurant.cuisine || ""} • ${restaurant.time || ""}`,
      price: "Plan event",
      actionLabel: "Plan Event",
    };
  });

  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Event planner"
        title="Select restaurant and plan event"
        subtitle="Choose a restaurant first, then enter event details on next page."
      >
        <div className="restaurant-grid">
          {planEventOptions.map((event) => (
            <EventCard
              key={event.id || event.title}
              event={event}
              onSelect={(item) => onOpenFlow("event", item)}
            />
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

function OrdersSection({ onNavigate, dashboardData, onOpenFlow }) {
  const orders = dashboardData?.orders?.length ? dashboardData.orders : recentOrders;
  const activeOrder = dashboardData?.activeOrder || orders[0] || null;
  const timeline = activeOrder?.timeline?.length ? activeOrder.timeline : orderTimeline;

  return (
    <div className="dashboard-stack">
      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Active delivery"
          title="Track your live order"
          subtitle="Clear tracking with each step shown in order."
          actionLabel="Support"
          onAction={() => onNavigate("support")}
        >
          <div className="tracking-card">
            <div className="tracking-card__header">
              <span className="tracking-card__id">
                Order ID: {activeOrder?.orderCode || "#FHB32291"}
              </span>
              <span className="status-chip">{activeOrder?.status || "On the way"}</span>
            </div>
            <div className="timeline">
              {timeline.map((step) => (
                <div key={step.label} className={`timeline-step is-${step.state}`}>
                  <span className="timeline-step__dot">
                    {step.state === "done" ? <AiOutlineCheckCircle /> : <AiOutlineClockCircle />}
                  </span>
                  <strong>{step.label}</strong>
                  <span>{step.time}</span>
                </div>
              ))}
            </div>
            <div className="tracking-card__details">
              <div className="tracking-card__row">
                <span className="tracking-card__label">Restaurant</span>
                <strong>{activeOrder?.restaurant || "Burger Barn"}</strong>
              </div>
              <div className="tracking-card__row">
                <span className="tracking-card__label">Items</span>
                <strong>{activeOrder?.items || "1 x Classic Burger, 1 x Fries"}</strong>
              </div>
              <div className="tracking-card__actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => activeOrder && onOpenFlow?.("order", activeOrder)}
                >
                  View details
                </button>
                <button type="button" className="outline-button" onClick={() => onNavigate("support")}>
                  Support
                </button>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="History"
          title="All order history"
          subtitle="See every order you've placed with status, date and amount."
        >
          <div className="list-stack">
            {orders.map((order) => (
              <ListCard
                key={order.id}
                icon={order.icon}
                title={order.restaurant}
                meta={order.items}
                description={`${order.time || ""}  |  ${order.amount || ""}`}
                badge={order.status}
                tone={order.tone}
                actionLabel="View"
                onAction={() => onOpenFlow?.("order", order)}
              />
            ))}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function FavoritesSection({ dashboardData, onOpenFlow }) {
  const favorites = dashboardData?.favorites?.length ? dashboardData.favorites : favoritesRestaurants;
  const favoriteOrderHints = (dashboardData?.orders || [])
    .slice(0, 6)
    .map((order) => ({
      title: order.restaurant,
      meta: order.items,
      description: `${order.time || ""}  •  ${order.amount || ""}`,
      badge: "Previously ordered",
      tone: order.tone || "mint",
    }));

  const [savedDishes, setSavedDishes] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("foodiehub_fav_dishes_v1");
      if (raw) setSavedDishes(JSON.parse(raw));
      else setSavedDishes([]);
    } catch {
      setSavedDishes([]);
    }
  }, []);

  return (
    <div className="dashboard-stack">
      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Saved places"
          title="Favorite restaurants"
          subtitle="Your most ordered and most loved places."
        >
          <div className="list-stack">
            {favorites.map((restaurant) => (
              <ListCard
                key={restaurant.id || restaurant.title || restaurant.name}
                icon={restaurant.icon || AiOutlineHeart}
                title={restaurant.title || restaurant.name}
                meta={restaurant.meta || restaurant.cuisine}
                description={restaurant.description || `${restaurant.distance || ""} • ${restaurant.eta || ""}`}
                badge={restaurant.badge || "Saved"}
                tone={restaurant.tone || "mint"}
                actionLabel="View menu"
                onAction={() => onOpenFlow?.("restaurant", restaurant)}
              />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Saved dishes"
          title="Top repeat orders"
          subtitle="A quick reminder of the meals you keep coming back for."
        >
          <div className="list-stack">
              {(savedDishes.length ? savedDishes : (favoriteOrderHints.length ? favoriteOrderHints : favoriteDishes)).map((dish) => (
                <ListCard
                  key={`${dish.title || dish.name}-${dish.meta || dish.restaurantName || dish.name}`}
                  icon={dish.icon || AiOutlineStar}
                  title={dish.title || dish.name}
                  meta={dish.meta || dish.restaurantName || dish.meta}
                  description={dish.description || (dish.price ? `₹${dish.price}` : "")}
                  badge={dish.badge || "Saved"}
                  tone={dish.tone || "sunset"}
                />
              ))}
            </div>
        </SectionShell>
      </div>
    </div>
  );
}

function WalletSection({ onNavigate }) {
  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Cash flow"
        title="Wallet overview"
        subtitle="Balance, savings and saved payment methods are all visible here."
        actionLabel="View orders"
        onAction={() => onNavigate("orders")}
      >
        <div className="metric-grid">
          {walletStats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </div>
      </SectionShell>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Payments"
          title="Saved payment methods"
          subtitle="Your fallback options are ready for quick checkout."
        >
          <div className="list-stack">
            {walletMethods.map((method) => (
              <ListCard
                key={method.title}
                icon={method.icon}
                title={method.title}
                meta={method.meta}
                description={method.description}
                badge={method.badge}
                tone={method.tone}
              />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Recent movement"
          title="Transactions"
          subtitle="A clean ledger of credits, debits and cashback."
        >
          <div className="list-stack">
            {walletTransactions.map((transaction) => (
              <ListCard
                key={transaction.title}
                icon={transaction.icon}
                title={transaction.title}
                meta={transaction.meta}
                description={transaction.description}
                badge={transaction.badge}
                tone={transaction.tone}
              />
            ))}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function ReviewsSection() {
  const [savedReviews, setSavedReviews] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("foodiehub_reviews_v1");
      if (raw) setSavedReviews(JSON.parse(raw));
      else setSavedReviews([]);
    } catch {
      setSavedReviews([]);
    }
  }, []);
  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Reputation"
        title="Your review profile"
        subtitle="Rating trends and the places you rate most often."
      >
        <div className="metric-grid">
          {reviewStats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Recent feedback"
        title="Recent reviews"
        subtitle="A neat feed of the places you rated recently."
      >
        <div className="restaurant-grid">
          {(savedReviews.length ? savedReviews : reviewCards).map((review) => (
            <ListCard
              key={review.itemId || review.title}
              icon={review.icon || AiOutlineStar}
              title={review.itemName || review.title}
              meta={review.restaurantName || review.meta}
              description={review.description || (review.rating ? `Rated ${review.rating} star${review.rating>1?"s":""}` : "")}
              badge={review.badge || (review.rating ? `${review.rating}★` : undefined)}
              tone={review.tone || "mint"}
            />
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

function NotificationsSection({ onNavigate }) {
  return (
    <div className="dashboard-stack">
      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Delivery, refund and offer updates appear here."
          actionLabel="View orders"
          onAction={() => onNavigate("orders")}
        >
          <div className="list-stack">
            {notifications.map((item) => (
              <ListCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                meta={item.meta}
                description={item.description}
                badge={item.badge}
                tone={item.tone}
              />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Reminders"
          title="Important alerts"
          subtitle="A second space for the things that need attention soon."
        >
          <div className="list-stack">
            <ListCard
              icon={AiOutlineBell}
              title="Weekend offer expiring soon"
              meta="Use it before Sunday night"
              tone="sunset"
            />
            <ListCard
              icon={AiOutlineBell}
              title="New address review"
              meta="Check your default delivery address"
              tone="mint"
            />
            <ListCard
              icon={AiOutlineBell}
              title="Pending feedback"
              meta="Rate your last delivery in one tap"
              tone="sky"
            />
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function ProfileSection({ dashboardData, onProfileUpdated }) {
  const profileUser = dashboardData?.user || {};
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
    defaultAddress: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: profileUser?.name || "",
      email: profileUser?.email || "",
      phone: profileUser?.phone || "",
      avatarUrl: profileUser?.avatarUrl || "",
      defaultAddress: profileUser?.savedAddresses?.[0]?.line1 || "",
    });
  }, [profileUser]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put("/customer/profile", {
        name: form.name,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
        savedAddresses: form.defaultAddress
          ? [
              {
                label: "Home",
                line1: form.defaultAddress,
                city: profileUser?.savedAddresses?.[0]?.city || "",
                state: profileUser?.savedAddresses?.[0]?.state || "",
                pincode: profileUser?.savedAddresses?.[0]?.pincode || "",
                isDefault: true,
              },
            ]
          : [],
      });

      const nextStoredUser = {
        ...(JSON.parse(localStorage.getItem("user") || "{}")),
        name: form.name,
        email: form.email,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
      };
      localStorage.setItem("user", JSON.stringify(nextStoredUser));

      toast.success("Profile updated successfully");
      await onProfileUpdated?.();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Registration details"
        title="Your profile"
        subtitle="View and edit the details used during registration."
      >
        <div className="list-stack">
          <label className="field-group">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Enter your name"
            />
          </label>
          <label className="field-group">
            <span>Email (from registration)</span>
            <input value={form.email} readOnly />
          </label>
          <label className="field-group">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="Enter phone number"
            />
          </label>
          <label className="field-group">
            <span>Default Address</span>
            <textarea
              rows={3}
              value={form.defaultAddress}
              onChange={(event) => updateField("defaultAddress", event.target.value)}
              placeholder="Enter your default address"
            />
          </label>
          <button
            type="button"
            className="profile-save-btn"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save profile"}
            <AiOutlineArrowRight />
          </button>
        </div>
      </SectionShell>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Help center"
        title="Support channels"
        subtitle="Pick the fastest route to solve the issue."
      >
        <div className="restaurant-grid">
          {supportChannels.map((channel) => (
            <ListCard
              key={channel.title}
              icon={channel.icon}
              title={channel.title}
              meta={channel.meta}
              description={channel.description}
              badge={channel.badge}
              tone={channel.tone}
            />
          ))}
        </div>
      </SectionShell>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="FAQ"
          title="Common questions"
          subtitle="Useful answers before you open a ticket."
        >
          <div className="list-stack">
            {faqItems.map((item) => (
              <ListCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                meta={item.meta}
                description={item.description}
                tone={item.tone}
              />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Self help"
          title="Fast fixes"
          subtitle="Shortcuts for the things customers usually need."
        >
          <div className="list-stack">
            <ListCard
              icon={MdOutlineSupportAgent}
              title="Chat support"
              meta="Best for live order issues"
              tone="sunset"
            />
            <ListCard
              icon={AiOutlineQuestionCircle}
              title="Payment help"
              meta="Refunds, failed payments and wallet checks"
              tone="mint"
            />
            <ListCard
              icon={MdOutlineNotificationsNone}
              title="Order updates"
              meta="Track delays or live status changes"
              tone="sky"
            />
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="dashboard-stack">
      <SectionShell
        eyebrow="Preferences"
        title="Settings"
        subtitle="The controls that personalize the dashboard experience."
      >
        <div className="restaurant-grid">
          {settingsGroups.map((setting) => (
            <ListCard
              key={setting.title}
              icon={setting.icon}
              title={setting.title}
              meta={setting.meta}
              description={setting.description}
              badge={setting.badge}
              tone={setting.tone}
            />
          ))}
        </div>
      </SectionShell>

      <div className="dashboard-dual-grid">
        <SectionShell
          eyebrow="Security"
          title="Account safety"
          subtitle="Quick checks that keep the account protected."
        >
          <div className="list-stack">
            <ListCard
              icon={MdOutlineSecurity}
              title="Password and login"
              meta="Update access settings and verify devices"
              tone="mint"
            />
            <ListCard
              icon={MdOutlinePayment}
              title="Saved payment review"
              meta="Check the cards and UPI accounts linked here"
              tone="sunset"
            />
            <ListCard
              icon={MdOutlineNotificationsNone}
              title="Alert controls"
              meta="Decide which updates should reach you"
              tone="sky"
            />
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Display"
          title="Interface choices"
          subtitle="A few simple switches that shape the experience."
        >
          <div className="list-stack">
            <ListCard
              icon={MdOutlineTune}
              title="Cuisine filters"
              meta="Rank categories and dietary preferences"
              tone="sunset"
            />
            <ListCard
              icon={AiOutlineHeart}
              title="Favorites ordering"
              meta="Keep saved restaurants close to the top"
              tone="mint"
            />
            <ListCard
              icon={AiOutlineShop}
              title="Home shortcuts"
              meta="Fast access to the sections you use most"
              tone="sky"
            />
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeFlow, setActiveFlow] = useState(null);
  const [flowSaving, setFlowSaving] = useState(false);

  const handleOpenFlow = useCallback(
    (type, item) => {
      if (type === "restaurant") {
        const restaurantId = item?.id;
        if (!restaurantId) {
          toast.error("Restaurant id not found");
          return;
        }
            // Navigate to the restaurant menu (customer view)
            navigate(`/restaurant/${restaurantId}/menu`);
        return;
      }

      if (type === "reservation") {
        const restaurantId = item?.id;
        if (!restaurantId) {
          toast.error("Restaurant id not found");
          return;
        }
        navigate(`/restaurant/${restaurantId}/reserve`);
        return;
      }

      if (type === "event" || type === "order") {
        if (type === "event") {
          const eventId = item?.id;
          if (!eventId) {
            toast.error("Event id not found");
            return;
          }
          navigate(`/events/${eventId}/book`);
          return;
        }
        setActiveFlow({ type, payload: item });
        return;
      }
    },
    [navigate]
  );

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get("/customer/dashboard");
      if (response.data?.success) {
        setDashboardData(response.data.data || null);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleToggleFavorite = useCallback(
    async (restaurant) => {
      const restaurantId = restaurant?.id;
      if (!restaurantId) {
        toast.error("Restaurant id not found");
        return;
      }

      try {
        const response = await api.post("/customer/favorites/toggle", { restaurantId });
        if (response.data?.success) {
          toast.success(
            response.data?.action === "added"
              ? "Added to favorites"
              : "Removed from favorites"
          );
          await loadDashboard();
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Unable to update favorite");
      }
    },
    [loadDashboard]
  );

  const handleCloseFlow = useCallback(() => {
    if (flowSaving) {
      return;
    }
    setActiveFlow(null);
  }, [flowSaving]);

  const handleFlowSubmit = useCallback(
    async (payload) => {
      try {
        setFlowSaving(true);

        if (payload.type === "reservation") {
          await api.post("/customer/reservations", {
            restaurantId: payload.restaurantId,
            tableSize: payload.tableSize,
            guests: payload.guests,
            date: payload.date,
            time: payload.time,
            notes: payload.notes || "",
          });
          toast.success("Table reservation confirmed");
          setActiveSection("dineout");
        } else if (payload.type === "event") {
          await api.post("/customer/events/book", {
            eventId: payload.eventId,
            quantity: payload.quantity,
            paymentMethod: payload.paymentMethod,
            date: payload.date,
            time: payload.time,
          });
          toast.success("Event booking confirmed");
          setActiveSection("events");
        } else if (payload.type === "restaurant") {
          await api.post("/customer/orders", {
            restaurantId: payload.restaurantId,
            items: payload.items,
            paymentMethod: payload.paymentMethod,
            address: payload.address || "",
            notes: payload.notes || "",
          });
          toast.success("Order placed successfully");
          setActiveSection("orders");
        }

        setActiveFlow(null);
        await loadDashboard();
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Unable to complete request");
      } finally {
        setFlowSaving(false);
      }
    },
    [loadDashboard]
  );

  const handleProfileUpdated = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });
  const [activeSection, setActiveSection] = useState("home");
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section) {
      setActiveSection(section);
    }
    // Only when the location search changes
  }, [location.search]);

  const section = sectionMeta[activeSection] ?? sectionMeta.home;
  const SectionComponent =
    {
      home: HomeSection,
      restaurants: RestaurantsSection,
      dineout: DineOutSection,
      events: EventsSection,
      orders: OrdersSection,
      favorites: FavoritesSection,
      wallet: WalletSection,
      reviews: ReviewsSection,
      notifications: NotificationsSection,
      profile: ProfileSection,
      support: SupportSection,
      settings: SettingsSection,
    }[activeSection] ?? HomeSection;

  const userName = user?.name || "Guest";
  const rewardPoints = user?.rewardPoints ?? "1,250";
  const userInitial = getInitials(userName) || "G";

  return (
    <div className="customer-dashboard">
      <aside className="customer-sidebar">
        <div className="sidebar-brand">
          <button type="button" className="sidebar-brand__mark" onClick={() => setActiveSection("home")} aria-label="FoodieHub home">
            <MdOutlineRestaurantMenu />
          </button>
          <div className="sidebar-brand__text">
            <strong>DineX</strong>
            <span>Customer lounge</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-profile__avatar">{userInitial}</div>
          <div className="sidebar-profile__body">
            <span className="sidebar-profile__eyebrow">Welcome back</span>
            <h3>{userName}</h3>
            <p>Enjoy faster ordering, smarter tracking and easier bookings.</p>
          </div>
          <div className="sidebar-profile__points">
            <strong>{rewardPoints}</strong>
            <span>pts</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Customer sections">
          {sidebarItems.map((item) => (
            <SidebarButton
              key={item.id}
              item={item}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </nav>

        <div className="sidebar-rewards">
          <p className="sidebar-rewards__eyebrow">Foodie Rewards</p>
          <strong className="sidebar-rewards__points">1,250 pts</strong>
          <p className="sidebar-rewards__meta">Unlock free delivery, priority reservations and cashback.</p>
          <button type="button" className="sidebar-rewards__button" onClick={() => setActiveSection("wallet")}>
            View rewards
            <AiOutlineArrowRight />
          </button>
        </div>
      </aside>

      <main className="dashboard-main" ref={mainRef}>
        {activeSection !== "home" ? (
          <header className="dashboard-topbar">
            <div className="dashboard-topbar__copy">
              <p className="dashboard-topbar__eyebrow">Customer lounge</p>
              <h1>{section.title}</h1>
              <p className="dashboard-topbar__subtitle">{section.subtitle}</p>
            </div>
            <div className="dashboard-topbar__actions">
              <button type="button" className="topbar-icon-button" onClick={() => setActiveSection("notifications")}>
                <AiOutlineBell />
              </button>
              <button type="button" className="topbar-icon-button" onClick={() => setActiveSection("profile")}>
                <AiOutlineUser />
              </button>
            </div>
          </header>
        ) : null}

        <div className="dashboard-content">
          <SectionComponent
            onNavigate={setActiveSection}
            userName={userName}
            userInitial={userInitial}
            rewardPoints={rewardPoints}
            dashboardData={dashboardData}
            onOpenFlow={handleOpenFlow}
            onToggleFavorite={handleToggleFavorite}
            onProfileUpdated={handleProfileUpdated}
          />

        </div>
      </main>

      <CustomerFlowDrawer
        flow={activeFlow}
        user={dashboardData?.user || user}
        restaurants={dashboardData?.restaurants || []}
        onClose={handleCloseFlow}
        onSubmit={handleFlowSubmit}
        saving={flowSaving}
        onOpenFlow={handleOpenFlow}
      />
    </div>
  );
}

export default CustomerDashboard;


