import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiRefreshCw, FiMapPin, FiClock } from "react-icons/fi";
import { socket } from "../../api/socket";
import "../../styles/restaurant-dashboard.css";

const fmtMoney = (v) => `₹${Number(v || 0).toFixed(0)}`;

export default function NewOrders() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const totalOrdersCount = available.length;
  const totalOrdersSum = available.reduce((acc, order) => acc + (order.total || order.amount || 0), 0);
  const totalEarningsSum = available.reduce((acc, order) => {
    const subtotal = order.total || order.amount || 0;
    return acc + 40 + Math.round(subtotal * 0.15);
  }, 0);

  const fetchAvailable = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/delivery/available");
      const data = Array.isArray(res.data) ? res.data : res.data?.value || [];
      setAvailable(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load incoming orders");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();

    // Connect socket and listen to events in real-time
    socket.connect();
    
    const handleSocketEvent = () => {
      fetchAvailable(true);
    };

    socket.on("orderCreated", handleSocketEvent);
    socket.on("orderStatusUpdated", handleSocketEvent);

    // Poll for new orders every 10 seconds
    const interval = setInterval(() => fetchAvailable(true), 10000);
    
    return () => {
      socket.off("orderCreated", handleSocketEvent);
      socket.off("orderStatusUpdated", handleSocketEvent);
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleAccept = async (orderId) => {
    setProcessingId(orderId);
    try {
      await api.post(`/delivery/${orderId}/accept`);
      toast.success("Order accepted successfully! Heading to your dashboard.");
      navigate("/delivery/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to accept order");
      fetchAvailable();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (orderId) => {
    // Local filter out of UI
    setAvailable((prev) => prev.filter((o) => (o._id || o.id) !== orderId));
    toast.success("Order ignored");
  };

  return (
    <div className="delivery-dashboard delivery-new-orders-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>New Orders Radar</h2>
          <p className="muted">
            Incoming orders prepared and waiting for pickup. Last updated: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            🟢 Scanning Live
          </span>
          <button
            className="icon-btn"
            onClick={() => fetchAvailable()}
            disabled={loading}
            aria-label="Refresh orders"
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
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            <FiRefreshCw className={loading ? "spin" : ""} style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </header>

      {/* Summary Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: "12px", color: "rgba(230,238,247,0.45)", fontWeight: "600" }}>Incoming Orders</span>
          <h3 style={{ margin: "4px 0 0 0", color: "#fff", fontSize: "22px", fontWeight: "800" }}>{totalOrdersCount}</h3>
        </div>
        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: "12px", color: "rgba(230,238,247,0.45)", fontWeight: "600" }}>Total Sum of Orders</span>
          <h3 style={{ margin: "4px 0 0 0", color: "#a5b4fc", fontSize: "22px", fontWeight: "800" }}>{fmtMoney(totalOrdersSum)}</h3>
        </div>
        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: "12px", color: "rgba(230,238,247,0.45)", fontWeight: "600" }}>Est. Total Payouts</span>
          <h3 style={{ margin: "4px 0 0 0", color: "#10b981", fontSize: "22px", fontWeight: "800" }}>{fmtMoney(totalEarningsSum)}</h3>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[1, 2].map((idx) => (
            <div key={idx} className="card skeleton-card" style={{ height: "240px", position: "relative", overflow: "hidden" }}>
              <div className="shimmer" />
            </div>
          ))}
        </div>
      ) : available.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px", background: "linear-gradient(180deg,#071126,#0b1226)" }}>
          <div className="radar-animation" style={{ display: "inline-block", position: "relative", width: "80px", height: "80px", marginBottom: "20px" }}>
            <div className="pulse-ring ring-1" />
            <div className="pulse-ring ring-2" />
            <div className="pulse-center" style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", position: "absolute", top: "28px", left: "28px", boxShadow: "0 0 15px #10b981" }} />
          </div>
          <h3>Scanning for new orders...</h3>
          <p className="muted" style={{ maxWidth: "400px", margin: "10px auto 0 auto" }}>
            All caught up! We will alert you immediately when a restaurant finishes preparing a new order.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {available.map((order) => {
            const id = order._id || order.id;
            const items = order.items || [];
            const restaurantName = order.restaurantName || order.restaurantId?.name || "Premium Kitchen";
            const restAddress = order.restaurantId?.address || "Restaurant Address";
            const destAddress = order.address || "Customer Address";
            
            // Estimated Payout: ₹40 base fare + 15% of order total commission
            const subtotal = order.total || order.amount || 0;
            const payout = 40 + Math.round(subtotal * 0.15);

            return (
              <div key={id} className="card" style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ fontWeight: 800, fontSize: "16px", background: "rgba(99, 102, 241, 0.1)", padding: "4px 8px", borderRadius: "6px", color: "#818cf8" }}>
                      {order.orderCode || `#${id.slice(-6).toUpperCase()}`}
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span className="badge" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#a5b4fc", fontSize: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                        {items.reduce((sum, item) => sum + (item.quantity || 1), 0)} Items
                      </span>
                      <span className="badge" style={{ 
                        background: order.status === "Ready" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                        color: order.status === "Ready" ? "#10b981" : "#f59e0b", 
                        border: order.status === "Ready" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)", 
                        fontSize: "12px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "4px" 
                      }}>
                        <span style={{ 
                          width: "6px", 
                          height: "6px", 
                          borderRadius: "50%", 
                          background: order.status === "Ready" ? "#10b981" : "#f59e0b", 
                          display: "inline-block" 
                        }} />
                        {order.status === "Ready" ? "Ready for Pickup" : order.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", textTransform: "uppercase", color: "rgba(230,238,247,0.4)", fontWeight: "700" }}>Pickup From</div>
                      <div style={{ fontWeight: "800", fontSize: "16px", color: "#fff", marginTop: "2px" }}>{restaurantName}</div>
                      <div className="muted" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <FiMapPin style={{ flexShrink: 0 }} /> {restAddress}
                      </div>
                    </div>

                    <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

                    <div>
                      <div style={{ fontSize: "12px", textTransform: "uppercase", color: "rgba(230,238,247,0.4)", fontWeight: "700" }}>Deliver To</div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#e6eef7", marginTop: "2px" }}>{order.userId?.name || "Customer"}</div>
                      <div className="muted" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <FiMapPin style={{ flexShrink: 0 }} /> {destAddress}
                      </div>
                    </div>

                    <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

                    <div>
                      <div style={{ fontSize: "12px", textTransform: "uppercase", color: "rgba(230,238,247,0.4)", fontWeight: "700" }}>Items Summary</div>
                      <div style={{ fontSize: "13px", color: "#e6eef7", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {items.map((item, idx) => (
                          <span key={idx} style={{ background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "rgba(230,238,247,0.4)", display: "block" }}>Order Value</span>
                      <strong style={{ fontSize: "20px", color: "#e6eef7" }}>{fmtMoney(subtotal)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "rgba(230,238,247,0.4)", display: "block" }}>Est. Earnings</span>
                      <strong style={{ fontSize: "20px", color: "#10b981" }}>{fmtMoney(payout)}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-outline"
                      onClick={() => handleReject(id)}
                      disabled={processingId !== null}
                      style={{
                        padding: "10px 16px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "rgba(230,238,247,0.6)",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.color = "rgba(230,238,247,0.6)";
                      }}
                    >
                      Ignore
                    </button>
                    <button
                      className="accept-btn"
                      onClick={() => handleAccept(id)}
                      disabled={processingId !== null}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "700",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                        transition: "all 0.2s",
                        minWidth: "100px"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = "0 6px 18px rgba(16, 185, 129, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {processingId === id ? "Accepting..." : "Accept"}
                    </button>
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
          box-shadow: 0 14px 40px rgba(2,6,23,0.6) !important;
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

        .pulse-ring {
          border: 3px solid #10b981;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          animation: radar-pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          opacity: 0;
        }

        .ring-1 {
          animation-delay: 0s;
        }
        .ring-2 {
          animation-delay: 1s;
        }

        @keyframes radar-pulse {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
