import { useCallback, useEffect, useMemo, useState } from "react";
import { FiClock, FiMapPin, FiRefreshCw, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";

import { socket } from "../../api/socket";
import "../../styles/restaurant-dashboard.css";
import { acceptDeliveryOrder, loadDeliveryList } from "./deliveryApi";
import {
  formatMoney,
  formatShortDateTime,
  formatTimeAgo,
  getCustomerPhone,
  getOrderId,
  getOrderItemsLabel,
  getRestaurantName,
  groupOrdersByCustomer,
} from "./deliveryOrderUtils";

export default function NewOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionOrderId, setActionOrderId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await loadDeliveryList("/delivery/available");
      setOrders(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      if (!silent) {
        toast.error(error?.response?.data?.message || "Failed to load new orders");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOrders();

    const handleSocketRefresh = () => {
      void fetchOrders({ silent: true });
    };

    socket.connect();
    socket.on("orderCreated", handleSocketRefresh);
    socket.on("orderStatusUpdated", handleSocketRefresh);

    const interval = setInterval(() => {
      void fetchOrders({ silent: true });
    }, 12000);

    return () => {
      socket.off("orderCreated", handleSocketRefresh);
      socket.off("orderStatusUpdated", handleSocketRefresh);
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const groupedOrders = useMemo(() => groupOrdersByCustomer(orders), [orders]);

  const summary = useMemo(() => {
    const totalValue = orders.reduce(
      (sum, order) => sum + Number(order?.total || order?.amount || 0),
      0
    );
    const latestOrder = orders.reduce((latest, order) => {
      if (!latest) {
        return order;
      }

      return new Date(order?.createdAt || 0) > new Date(latest?.createdAt || 0)
        ? order
        : latest;
    }, null);

    return {
      liveOrders: orders.length,
      customerGroups: groupedOrders.length,
      totalValue,
      latestOrder,
    };
  }, [groupedOrders.length, orders]);

  const handleAccept = useCallback(
    async (orderId) => {
      setActionOrderId(orderId);

      try {
        await acceptDeliveryOrder(orderId);
        toast.success("Order accepted");
        await fetchOrders({ silent: true });
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to accept order");
      } finally {
        setActionOrderId(null);
      }
    },
    [fetchOrders]
  );

  return (
    <div className="delivery-new-orders-page">
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
          <h2>New Orders</h2>
          <p className="muted">
            Live ready-to-collect orders are grouped by customer and refreshed automatically.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            className="badge"
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              color: "#065f46",
              border: "1px solid rgba(16, 185, 129, 0.18)",
            }}
          >
            Live queue
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              void fetchOrders();
            }}
            aria-label="Refresh new orders"
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
              <FiUsers />
            </div>
            <div className="metric-value">
              <h3>{summary.liveOrders}</h3>
              <div className="metric-change muted">Ready orders to accept</div>
            </div>
          </div>
          <p className="label">Live Orders</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">
              <FiMapPin />
            </div>
            <div className="metric-value">
              <h3>{summary.customerGroups}</h3>
              <div className="metric-change muted">Customer groups</div>
            </div>
          </div>
          <p className="label">Customers</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">
              <FiClock />
            </div>
            <div className="metric-value">
              <h3>{formatMoney(summary.totalValue)}</h3>
              <div className="metric-change muted">
                {summary.latestOrder
                  ? `Latest: ${formatTimeAgo(summary.latestOrder.createdAt)}`
                  : "Waiting for live orders"}
              </div>
            </div>
          </div>
          <p className="label">Queue Value</p>
        </div>
      </section>

      <div className="card" style={{ marginBottom: "18px" }}>
        <div className="card-head">
          <h3>Customer Queue</h3>
          <div className="card-actions">
            {lastUpdated ? `Updated ${formatShortDateTime(lastUpdated)}` : "Waiting for data"}
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="muted" style={{ padding: "12px 0" }}>
            Loading new orders...
          </div>
        ) : groupedOrders.length === 0 ? (
          <div className="muted" style={{ padding: "12px 0" }}>
            No ready orders right now. New customer requests will appear here automatically.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {groupedOrders.map((group) => {
              const primaryOrder = group.orders[0];
              const groupTotal = group.orders.reduce(
                (sum, order) => sum + Number(order?.total || order?.amount || 0),
                0
              );

              return (
                <div key={group.customerName} className="card" style={{ padding: "14px", borderRadius: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "#e2e8f0" }}>{group.customerName}</strong>
                      <span className="muted" style={{ fontSize: "13px" }}>
                        {getCustomerPhone(primaryOrder)} | {group.orders.length} order
                        {group.orders.length > 1 ? "s" : ""} waiting
                      </span>
                    </div>
                    <div className="badge" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#bfdbfe" }}>
                      {formatMoney(groupTotal)}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {group.orders.map((order) => {
                      const orderId = getOrderId(order);
                      const itemsLabel = getOrderItemsLabel(order);

                      return (
                        <div key={orderId} className="order-item">
                          <div className="order-left" style={{ maxWidth: "72%" }}>
                            <div className="order-id">{order.orderCode || orderId}</div>
                            <div className="order-customer" style={{ marginTop: "6px" }}>
                              {getRestaurantName(order)}
                            </div>
                            <div className="order-items">
                              {itemsLabel} | {getCustomerPhone(order)}
                            </div>
                            <div className="order-meta">
                              <span style={{ marginRight: "10px" }}>{order.address || "No delivery address"}</span>
                              <span>Placed {formatTimeAgo(order.createdAt)}</span>
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
                                  background: "rgba(16, 185, 129, 0.14)",
                                  color: "#86efac",
                                  fontWeight: 700,
                                }}
                              >
                                Ready
                              </span>
                              <button
                                type="button"
                                className="accept-btn"
                                onClick={() => {
                                  void handleAccept(orderId);
                                }}
                                disabled={actionOrderId === orderId}
                              >
                                {actionOrderId === orderId ? "Accepting..." : "Accept"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
