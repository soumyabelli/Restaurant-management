import { useState, useEffect, useMemo } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiRefreshCw, FiMapPin, FiCheckCircle, FiClock } from "react-icons/fi";
import "../../styles/restaurant-dashboard.css";

const fmtMoney = (v) => `₹${Number(v || 0).toFixed(0)}`;

export default function MyDeliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "history"
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/delivery/my-orders");
      const data = Array.isArray(res.data) ? res.data : res.data?.value || [];
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your deliveries");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/delivery/${orderId}/status`, { status: newStatus });
      toast.success(`Marked as: ${newStatus}`);
      await fetchOrders(true);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const categorizedOrders = useMemo(() => {
    const active = [];
    const history = [];

    orders.forEach((o) => {
      const s = o.status;
      if (s === "Delivered" || s === "Cancelled") {
        history.push(o);
      } else {
        active.push(o);
      }
    });

    return { active, history };
  }, [orders]);

  const list = activeTab === "active" ? categorizedOrders.active : categorizedOrders.history;

  return (
    <div className="delivery-dashboard delivery-my-deliveries-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>My Deliveries</h2>
          <p className="muted">Track and manage your assigned orders and past completion logs.</p>
        </div>

        <button
          className="icon-btn"
          onClick={() => fetchOrders()}
          disabled={loading}
          aria-label="Refresh list"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "10px",
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FiRefreshCw className={loading ? "spin" : ""} style={{ width: "16px", height: "16px" }} />
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: activeTab === "active" ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
            color: activeTab === "active" ? "white" : "rgba(230,238,247,0.6)",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Active Deliveries ({categorizedOrders.active.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: activeTab === "history" ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
            color: activeTab === "history" ? "white" : "rgba(230,238,247,0.6)",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          History logs ({categorizedOrders.history.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          {[1, 2].map((idx) => (
            <div key={idx} className="card skeleton-card" style={{ height: "160px", position: "relative", overflow: "hidden" }}>
              <div className="shimmer" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>
            {activeTab === "active" ? "📦" : "📜"}
          </div>
          <h3>{activeTab === "active" ? "No active deliveries" : "No past deliveries found"}</h3>
          <p className="muted" style={{ marginTop: "6px" }}>
            {activeTab === "active"
              ? "Accept a new order from the 'New Orders' panel to start."
              : "Completed orders will be listed here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {list.map((order) => {
            const id = order._id || order.id;
            const items = order.items || [];
            const restaurantName = order.restaurantName || order.restaurantId?.name || "Kitchen";
            const restAddress = order.restaurantId?.address || "Restaurant Address";
            const destAddress = order.address || "Customer Address";
            const status = order.status;

            return (
              <div key={id} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: "15px", background: "rgba(99, 102, 241, 0.1)", padding: "4px 8px", borderRadius: "6px", color: "#818cf8" }}>
                    {order.orderCode || `#${id.slice(-6).toUpperCase()}`}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background:
                        status === "Delivered"
                          ? "rgba(16, 185, 129, 0.1)"
                          : status === "On the way"
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(245, 158, 11, 0.1)",
                      color:
                        status === "Delivered" ? "#10b981" : status === "On the way" ? "#3b82f6" : "#f59e0b",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: "rgba(230,238,247,0.4)", fontWeight: "700" }}>Pickup From</div>
                    <div style={{ fontWeight: "800", color: "#fff", marginTop: "2px" }}>{restaurantName}</div>
                    <div className="muted" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <FiMapPin style={{ flexShrink: 0 }} /> {restAddress}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: "rgba(230,238,247,0.4)", fontWeight: "700" }}>Deliver To</div>
                    <div style={{ fontWeight: "700", color: "#e6eef7", marginTop: "2px" }}>{order.userId?.name || "Customer"}</div>
                    <div className="muted" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <FiMapPin style={{ flexShrink: 0 }} /> {destAddress}
                    </div>
                  </div>
                </div>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "rgba(230,238,247,0.6)" }}>
                    {items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "11px", color: "rgba(230,238,247,0.4)", display: "block" }}>Order Value</span>
                      <strong style={{ fontSize: "16px" }}>{fmtMoney(order.total || order.amount)}</strong>
                    </div>

                    {activeTab === "active" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        {status !== "On the way" && (
                          <button
                            className="accept-btn"
                            onClick={() => handleUpdateStatus(id, "On the way")}
                            disabled={updatingId !== null}
                            style={{
                              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "none",
                              color: "white",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            {updatingId === id ? "..." : "Picked Up"}
                          </button>
                        )}
                        <button
                          className="accept-btn"
                          onClick={() => handleUpdateStatus(id, "Delivered")}
                          disabled={updatingId !== null}
                          style={{
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "none",
                            color: "white",
                            fontWeight: "700",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          {updatingId === id ? "..." : "Deliver"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .spin {
          animation: spin_loader 1s linear infinite;
        }
        @keyframes spin_loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .skeleton-card {
          background: linear-gradient(180deg,#071126,#0b1226) !important;
          border: 1px solid rgba(255,255,255,0.04) !important;
        }

        .shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
          animation: loading-shimmer 1.5s infinite;
        }

        @keyframes loading-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
