import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiRefreshCw, FiTruck } from "react-icons/fi";
import toast from "react-hot-toast";
import "../../styles/restaurant-dashboard.css";
import { loadDeliveryList, updateDeliveryOrderStatus } from "./deliveryApi";
import {
  formatMoney,
  formatShortDateTime,
  formatTimeAgo,
  getCustomerName,
  getCustomerPhone,
  getOrderId,
  getOrderItemsLabel,
  getRestaurantName,
  isActiveDelivery,
  splitDeliveryOrders,
} from "./deliveryOrderUtils";

const getStatusTone = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "delivered") {
    return {
      background: "rgba(16, 185, 129, 0.14)",
      color: "#86efac",
    };
  }

  if (normalized === "on the way") {
    return {
      background: "rgba(59, 130, 246, 0.14)",
      color: "#bfdbfe",
    };
  }

  if (normalized === "ready") {
    return {
      background: "rgba(245, 158, 11, 0.14)",
      color: "#fde68a",
    };
  }

  return {
    background: "rgba(148, 163, 184, 0.14)",
    color: "#cbd5e1",
  };
};

export default function MyDeliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionOrderId, setActionOrderId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrders = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await loadDeliveryList("/delivery/my-orders");
      setOrders(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      if (!silent) {
        toast.error(error?.response?.data?.message || "Failed to load your deliveries");
      }
      setOrders([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(() => {
      fetchOrders({ silent: true });
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const sections = useMemo(() => {
    const { active, delivered } = splitDeliveryOrders(orders);

    return {
      active,
      delivered,
      activeGroups: splitDeliveryOrders(active).active.length ? [] : [],
    };
  }, [orders]);

  const activeGroups = useMemo(() => {
    const { active } = splitDeliveryOrders(orders);
    const grouped = new Map();

    active.forEach((order) => {
      const customerName = getCustomerName(order);
      const key = customerName.toLowerCase();

      if (!grouped.has(key)) {
        grouped.set(key, {
          customerName,
          orders: [],
        });
      }

      grouped.get(key).orders.push(order);
    });

    return Array.from(grouped.values());
  }, [orders]);

  const deliveredGroups = useMemo(() => {
    const { delivered } = splitDeliveryOrders(orders);
    const grouped = new Map();

    delivered.forEach((order) => {
      const customerName = getCustomerName(order);
      const key = customerName.toLowerCase();

      if (!grouped.has(key)) {
        grouped.set(key, {
          customerName,
          orders: [],
        });
      }

      grouped.get(key).orders.push(order);
    });

    return Array.from(grouped.values());
  }, [orders]);

  const summary = useMemo(() => {
    const activeOrders = sections.active;
    const deliveredOrders = sections.delivered;
    const payout = deliveredOrders.reduce(
      (sum, order) => sum + Math.round(Number(order?.total || order?.amount || 0) * 0.15 + 40),
      0
    );

    const todayDelivered = deliveredOrders.filter((order) => {
      const orderDate = new Date(order?.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length;

    return {
      activeCount: activeOrders.length,
      deliveredCount: deliveredOrders.length,
      payout,
      todayDelivered,
    };
  }, [sections.active, sections.delivered]);

  const handleStatusChange = async (orderId, status) => {
    setActionOrderId(orderId);

    try {
      await updateDeliveryOrderStatus(orderId, status);
      toast.success(`Marked ${status}`);
      await fetchOrders({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update delivery status");
    } finally {
      setActionOrderId(null);
    }
  };

  const renderOrderRow = (order, allowActions) => {
    const orderId = getOrderId(order);
    const tone = getStatusTone(order.status);
    const canMoveToWay = allowActions && String(order?.status || "").toLowerCase() !== "on the way";
    const canMarkDelivered = allowActions && String(order?.status || "").toLowerCase() !== "delivered";

    return (
      <div key={orderId} className="order-item">
        <div className="order-left" style={{ maxWidth: "72%" }}>
          <div className="order-id">{order.orderCode || orderId}</div>
          <div className="order-customer" style={{ marginTop: "6px" }}>
            {getCustomerName(order)}
          </div>
          <div className="order-items">
            {getRestaurantName(order)} • {getOrderItemsLabel(order)}
          </div>
          <div className="order-meta">
            <span style={{ marginRight: "10px" }}>{order.address || "No delivery address"}</span>
            <span>Updated {formatTimeAgo(order.updatedAt || order.createdAt)}</span>
          </div>
        </div>

        <div className="order-right">
          <div className="order-price">{formatMoney(order.total || order.amount)}</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "999px",
                background: tone.background,
                color: tone.color,
                fontWeight: 700,
              }}
            >
              {order.status || "Active"}
            </span>

            {allowActions ? (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {canMoveToWay && (
                  <button
                    type="button"
                    className="accept-btn"
                    onClick={() => handleStatusChange(orderId, "On the way")}
                    disabled={actionOrderId === orderId}
                  >
                    {actionOrderId === orderId ? "Updating..." : "Mark On the Way"}
                  </button>
                )}
                {canMarkDelivered && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => handleStatusChange(orderId, "Delivered")}
                    disabled={actionOrderId === orderId}
                  >
                    {actionOrderId === orderId ? "Updating..." : "Mark Delivered"}
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#86efac",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                <FiCheckCircle />
                Delivered
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="delivery-my-deliveries-page">
      <header
        className="rh-top"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="rh-top-left">
          <h2>My Deliveries</h2>
          <p className="muted">
            Active assignments stay at the top, while completed deliveries move into history automatically.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className="badge"
            style={{
              background: "rgba(59, 130, 246, 0.12)",
              color: "#bfdbfe",
              border: "1px solid rgba(59, 130, 246, 0.18)",
            }}
          >
            {summary.activeCount} active
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => fetchOrders()}
            aria-label="Refresh my deliveries"
            disabled={loading}
          >
            <FiRefreshCw style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </header>

      <section
        className="rh-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">
              <FiTruck />
            </div>
            <div className="metric-value">
              <h3>{summary.activeCount}</h3>
              <div className="metric-change muted">Orders waiting for completion</div>
            </div>
          </div>
          <p className="label">Active Deliveries</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">
              <FiClock />
            </div>
            <div className="metric-value">
              <h3>{summary.deliveredCount}</h3>
              <div className="metric-change muted">{summary.todayDelivered} delivered today</div>
            </div>
          </div>
          <p className="label">Delivered Orders</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">
              <FiCheckCircle />
            </div>
            <div className="metric-value">
              <h3>{formatMoney(summary.payout)}</h3>
              <div className="metric-change muted">Estimated payout from delivered jobs</div>
            </div>
          </div>
          <p className="label">Earned Value</p>
        </div>
      </section>

      <div className="card" style={{ marginBottom: "18px" }}>
        <div className="card-head">
          <h3>Active Deliveries</h3>
          <div className="card-actions">{lastUpdated ? `Updated ${formatShortDateTime(lastUpdated)}` : "Waiting for data"}</div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="muted" style={{ padding: "12px 0" }}>
            Loading your deliveries...
          </div>
        ) : activeGroups.length === 0 ? (
          <div className="muted" style={{ padding: "12px 0" }}>
            No active deliveries right now. Accepted orders will appear here automatically.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {activeGroups.map((group) => (
              <div key={group.customerName} className="card" style={{ padding: "14px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <strong style={{ display: "block", color: "#e2e8f0" }}>{group.customerName}</strong>
                    <span className="muted" style={{ fontSize: "13px" }}>
                      {getCustomerPhone(group.orders[0])} • {group.orders.length} active order
                      {group.orders.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#86efac" }}>
                    {formatMoney(group.orders.reduce((sum, order) => sum + Number(order?.total || 0), 0))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {group.orders.map((order) => renderOrderRow(order, isActiveDelivery(order)))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Delivered History</h3>
          <div className="card-actions">{deliveredGroups.length} customer groups</div>
        </div>

        {deliveredGroups.length === 0 ? (
          <div className="muted" style={{ padding: "12px 0" }}>
            Completed deliveries will move here once you mark them delivered.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {deliveredGroups.map((group) => (
              <div key={group.customerName} className="card" style={{ padding: "14px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <strong style={{ display: "block", color: "#e2e8f0" }}>{group.customerName}</strong>
                    <span className="muted" style={{ fontSize: "13px" }}>
                      {getCustomerPhone(group.orders[0])} • Delivered {group.orders.length} order
                      {group.orders.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#86efac" }}>
                    {formatMoney(group.orders.reduce((sum, order) => sum + Number(order?.total || 0), 0))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {group.orders.map((order) => renderOrderRow(order, false))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
