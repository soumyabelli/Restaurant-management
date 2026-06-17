const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getCustomerKey = (order) =>
  String(
    order?.userId?.name ||
      order?.user?.name ||
      order?.customerName ||
      order?.customer ||
      "Customer"
  )
    .trim()
    .toLowerCase() || "customer";

export const formatMoney = (value) => currencyFormatter.format(Number(value || 0));

export const getOrderId = (order) => order?._id || order?.id || "";

export const getCustomerName = (order) =>
  String(
    order?.userId?.name ||
      order?.user?.name ||
      order?.customerName ||
      order?.customer ||
      "Customer"
  ).trim() || "Customer";

export const getCustomerPhone = (order) =>
  String(order?.userId?.phone || order?.user?.phone || order?.phone || "-");

export const getRestaurantName = (order) =>
  String(order?.restaurantId?.name || order?.restaurantName || "Restaurant");

export const getOrderItemsLabel = (order, limit = 2) => {
  const items = Array.isArray(order?.items) ? order.items : [];

  if (!items.length) {
    return "No items";
  }

  return items
    .slice(0, limit)
    .map((item) => `${Number(item?.quantity || 1)} x ${item?.name || "Item"}`)
    .join(", ");
};

export const normalizeOrderDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export const formatShortDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatTimeAgo = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    return `${Math.max(1, Math.round(diffMs / minute))}m ago`;
  }

  if (diffMs < day) {
    return `${Math.max(1, Math.round(diffMs / hour))}h ago`;
  }

  if (diffMs < 7 * day) {
    return `${Math.max(1, Math.round(diffMs / day))}d ago`;
  }

  return formatShortDateTime(value);
};

export const isDeliveredOrder = (status) => String(status || "").toLowerCase() === "delivered";

export const isCancelledOrder = (status) => String(status || "").toLowerCase() === "cancelled";

export const isActiveDelivery = (order) =>
  !isDeliveredOrder(order?.status) && !isCancelledOrder(order?.status);

export const sortOrdersByCustomerThenDate = (orders = []) =>
  [...orders].sort((a, b) => {
    const customerA = getCustomerName(a).toLowerCase();
    const customerB = getCustomerName(b).toLowerCase();

    if (customerA !== customerB) {
      return customerA.localeCompare(customerB);
    }

    return normalizeOrderDate(b?.createdAt) - normalizeOrderDate(a?.createdAt);
  });

export const groupOrdersByCustomer = (orders = []) => {
  const groups = new Map();

  sortOrdersByCustomerThenDate(orders).forEach((order) => {
    const key = getCustomerKey(order);

    if (!groups.has(key)) {
      groups.set(key, {
        customerName: getCustomerName(order),
        orders: [],
      });
    }

    groups.get(key).orders.push(order);
  });

  return Array.from(groups.values());
};

export const splitDeliveryOrders = (orders = []) => {
  const active = [];
  const delivered = [];

  orders.forEach((order) => {
    if (isDeliveredOrder(order?.status)) {
      delivered.push(order);
    } else if (isActiveDelivery(order)) {
      active.push(order);
    }
  });

  return {
    active: sortOrdersByCustomerThenDate(active),
    delivered: sortOrdersByCustomerThenDate(delivered),
  };
};
