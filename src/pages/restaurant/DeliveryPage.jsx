import { useState, useEffect, useMemo } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiRefreshCw, FiTruck, FiUser, FiMapPin, FiPhone, FiAlertCircle } from "react-icons/fi";
import "../../styles/restaurant-dashboard.css";

const fmtMoney = (v) => `₹${Number(v || 0).toFixed(0)}`;

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/restaurant/delivery");
      setDeliveries(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load delivery logs");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // Poll for updates every 12 seconds
    const interval = setInterval(() => fetchDeliveries(true), 12000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/restaurant/orders/${orderId}/status`, { status: nextStatus });
      toast.success(`Order marked as: ${nextStatus}`);
      await fetchDeliveries(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute status cards
  const stats = useMemo(() => {
    let unassigned = 0;
    let inTransit = 0;
    let preparingCount = 0;
    let readyCount = 0;

    deliveries.forEach((d) => {
      if (!d.partner) {
        unassigned++;
      } else if (d.status === "On the way") {
        inTransit++;
      }

      if (d.status === "Preparing") preparingCount++;
      if (d.status === "Ready") readyCount++;
    });

    return {
      totalActive: deliveries.length,
      unassigned,
      inTransit,
      preparingCount,
      readyCount,
    };
  }, [deliveries]);

  return (
    <div className="restaurant-delivery-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h1>Delivery Monitor</h1>
          <p className="muted" style={{ margin: "4px 0 0 0" }}>
            Track live orders, dispatch updates, and monitor assigned courier partners.
          </p>
        </div>

        <button
          className="btn-outline"
          onClick={() => fetchDeliveries()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", padding: "10px 16px" }}
        >
          <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
        </button>
      </header>

      {/* KPI Stats widgets */}
      <section className="rh-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon" style={{ color: "#6366f1" }}>📦</div>
            <div className="metric-value">
              <h3>{stats.totalActive}</h3>
            </div>
          </div>
          <p className="label">Active Deliveries</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon" style={{ color: "#f59e0b" }}>⏳</div>
            <div className="metric-value">
              <h3>{stats.unassigned}</h3>
            </div>
          </div>
          <p className="label">Unassigned / Searching</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon" style={{ color: "#3b82f6" }}>🚚</div>
            <div className="metric-value">
              <h3>{stats.inTransit}</h3>
            </div>
          </div>
          <p className="label">Out for Delivery</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon" style={{ color: "#10b981" }}>🍽️</div>
            <div className="metric-value">
              <h3>{stats.readyCount}</h3>
            </div>
          </div>
          <p className="label">Food Prepared (Ready)</p>
        </div>
      </section>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          {[1, 2].map((idx) => (
            <div key={idx} className="card skeleton-card" style={{ height: "200px", position: "relative", overflow: "hidden" }}>
              <div className="shimmer" />
            </div>
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛵</div>
          <h3>No active delivery orders</h3>
          <p className="muted" style={{ marginTop: "6px" }}>
            When customers place a delivery order, it will appear here for dispatch tracking.
          </p>
        </div>
      ) : (
        <div className="rh-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {deliveries.map((delivery) => {
              const id = delivery._id || delivery.id;
              const items = delivery.items || "";
              const rider = delivery.partner;
              const status = delivery.status;

              return (
                <div key={id} className="card" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px", background: "white", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px", background: "#f3f4f6", padding: "4px 8px", borderRadius: "6px", color: "#4b5563" }}>
                        {delivery.orderCode || `#${id.slice(-6).toUpperCase()}`}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>
                        {new Date(delivery.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        className="badge"
                        style={{
                          background:
                            status === "On the way"
                              ? "#e0f2fe"
                              : status === "Ready"
                              ? "#ecfdf5"
                              : status === "Preparing"
                              ? "#fffbeb"
                              : "#f3f4f6",
                          color:
                            status === "On the way"
                              ? "#0369a1"
                              : status === "Ready"
                              ? "#047857"
                              : status === "Preparing"
                              ? "#b45309"
                              : "#374151",
                          fontWeight: "700",
                          fontSize: "12px",
                        }}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#1f2937", fontSize: "15px" }}>{items}</div>
                      
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280" }}>
                          <FiUser style={{ flexShrink: 0 }} /> {delivery.customer || "Customer"} 
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                          <FiMapPin style={{ flexShrink: 0 }} /> {delivery.customerAddress}
                        </div>
                      </div>
                    </div>

                    {/* Rider details */}
                    <div style={{ borderLeft: "1px solid #f1f5f9", paddingLeft: "20px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px" }}>Assigned Courier</div>
                      {rider ? (
                        <div style={{ marginTop: "6px" }}>
                          <div style={{ fontWeight: "800", color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FiTruck style={{ color: "#6366f1" }} /> {rider.name}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FiPhone /> {rider.phone}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: "6px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                          <div className="radar-circle" />
                          <span>Searching for rider...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for kitchen updates */}
                  <div style={{ height: "1px", background: "#f1f5f9" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      Est. Distance: <strong>{delivery.distance}</strong> • ETA: <strong>{delivery.estimatedTime}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {status === "Confirmed" && (
                        <button
                          className="accept-btn"
                          onClick={() => handleUpdateStatus(id, "Preparing")}
                          disabled={updatingId !== null}
                          style={{ padding: "6px 12px", fontSize: "13px", background: "#f59e0b" }}
                        >
                          Start Preparing
                        </button>
                      )}
                      {status === "Preparing" && (
                        <button
                          className="accept-btn"
                          onClick={() => handleUpdateStatus(id, "Ready")}
                          disabled={updatingId !== null}
                          style={{ padding: "6px 12px", fontSize: "13px" }}
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        className="btn-outline"
                        onClick={() => handleUpdateStatus(id, "Cancelled")}
                        disabled={updatingId !== null}
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#374151")}
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
          background: #fff !important;
          border: 1px solid #f1f5f9 !important;
        }

        .shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.02), transparent);
          animation: loading-shimmer 1.5s infinite;
        }

        @keyframes loading-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .radar-circle {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          animation: radar-glow 1.5s infinite;
        }

        @keyframes radar-glow {
          0% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
          100% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
}
