import React, { useState, useEffect } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiAward, FiStar, FiClock, FiCheckCircle, FiActivity, FiRefreshCw } from "react-icons/fi";
import "../../styles/restaurant-dashboard.css";

export default function Performance() {
  const [activeTab, setActiveTab] = useState("rating");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/delivery/performance");
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load performance metrics");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const ratingHistory = metrics?.ratingHistory || [4.5, 4.6, 4.6, 4.8, 4.7, 4.9, 4.8, 4.9, 4.8, 4.8];
  const speedHistory = metrics?.speedHistory || [32, 30, 28, 29, 27, 26, 25, 27, 26, 26];

  const pointsRating = ratingHistory.map((val, idx) => ({
    x: 40 + idx * 50,
    y: 180 - (val - 4.0) * 120, // scale ratings 4.0 - 5.0 in 0-180 height
    val: Number(val).toFixed(1),
  }));

  const pointsSpeed = speedHistory.map((val, idx) => ({
    x: 40 + idx * 50,
    y: 180 - ((40 - val) / 20) * 150, // scale speeds 20min - 40min
    val: `${val} min`,
  }));

  const currentPoints = activeTab === "rating" ? pointsRating : pointsSpeed;
  const pathD = currentPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M${pt.x},${pt.y}` : `${acc} L${pt.x},${pt.y}`),
    ""
  );

  if (loading) {
    return (
      <div className="delivery-performance-page" style={{ padding: "40px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ textAlign: "center" }}>
          <FiRefreshCw className="spin" style={{ fontSize: "30px", marginBottom: "12px", animation: "spin_loader 1s linear infinite", color: "#6366f1" }} />
          <h3>Loading Performance Stats...</h3>
        </div>
        <style>{`
          @keyframes spin_loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const riderRating = metrics?.rating ?? 4.8;
  const onTimeRate = metrics?.onTimeRate ?? 96;
  const acceptanceRate = metrics?.acceptanceRate ?? 98;
  const avgTime = metrics?.avgTime ?? 26;
  const deliveriesCount = metrics?.deliveriesCount ?? 0;
  const nextTierTarget = metrics?.nextTierTarget ?? 50;
  const currentTier = metrics?.currentTier || "Bronze";
  const nextTier = metrics?.nextTier || "Silver";

  return (
    <div className="delivery-performance-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>My Performance</h2>
          <p className="muted">Monitor your ratings, average delivery speeds, and career level progress.</p>
        </div>
        <button className="icon-btn" onClick={() => fetchStats()} aria-label="refresh" disabled={loading}>
          <FiRefreshCw className={loading ? "spin" : ""} />
        </button>
      </header>

      {/* KPI Cards */}
      <section className="rh-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#f59e0b" }}><FiStar /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{riderRating.toFixed(2)} ★</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Customer Rating</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#10b981" }}><FiClock /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{onTimeRate}%</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>On-Time Deliveries</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#6366f1" }}><FiCheckCircle /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{acceptanceRate}%</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Order Acceptance Rate</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#ec4899" }}><FiActivity /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{avgTime} min</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Avg Delivery Time</p>
        </div>
      </section>

      <div className="rh-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* SVG Performance Line Graph */}
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>Performance Trend</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setActiveTab("rating")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: activeTab === "rating" ? "none" : "1px solid #cbd5e1",
                  background: activeTab === "rating" ? "#6366f1" : "transparent",
                  color: activeTab === "rating" ? "white" : "#475569",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Rating
              </button>
              <button
                onClick={() => setActiveTab("speed")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: activeTab === "speed" ? "none" : "1px solid #cbd5e1",
                  background: activeTab === "speed" ? "#6366f1" : "transparent",
                  color: activeTab === "speed" ? "white" : "#475569",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Speed
              </button>
            </div>
          </div>

          <div style={{ height: "240px", position: "relative", padding: "10px 20px 20px 20px" }}>
            <svg width="100%" height="100%" viewBox="0 0 540 200" style={{ overflow: "visible" }}>
              {/* Grid Lines */}
              <line x1="30" y1="180" x2="520" y2="180" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="120" x2="520" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="60" x2="520" y2="60" stroke="#f1f5f9" strokeWidth="1" />

              {/* Line Path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={activeTab === "rating" ? "#f59e0b" : "#ec4899"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {currentPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="white"
                    stroke={activeTab === "rating" ? "#f59e0b" : "#ec4899"}
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#475569"
                  >
                    {pt.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Level Progression Card */}
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <FiAward size={22} style={{ color: "#6366f1" }} />
              <h3 style={{ margin: 0 }}>Courier Rank</h3>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <strong style={{ fontSize: "20px", color: "#334155" }}>{currentTier} Level</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Next: {nextTier}</span>
            </div>

            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: "0 0 16px 0" }}>
              Reach {nextTierTarget} completed deliveries to unlock {nextTier} status bonuses and high-value orders pool.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
              <span>{deliveriesCount} / {nextTierTarget} Orders</span>
              <span>{Math.min(100, Math.round((deliveriesCount / nextTierTarget) * 100))}%</span>
            </div>
            
            <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, (deliveriesCount / nextTierTarget) * 100)}%`,
                  height: "100%",
                  background: "linear-gradient(to right, #6366f1, #818cf8)",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guide Tips */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", marginTop: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0" }}>How to Improve Your Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div style={{ border: "1px solid #f1f5f9", padding: "16px", borderRadius: "8px" }}>
            <strong style={{ display: "block", color: "#f59e0b", marginBottom: "6px" }}>⭐ Customer Rating</strong>
            <p style={{ color: "#64748b", margin: 0, fontSize: "13px", lineHeight: "1.4" }}>
              Be polite at pickup and dropoff. Always carry food in insulating delivery bags to ensure it reaches warm and fresh.
            </p>
          </div>

          <div style={{ border: "1px solid #f1f5f9", padding: "16px", borderRadius: "8px" }}>
            <strong style={{ display: "block", color: "#10b981", marginBottom: "6px" }}>⏱️ On-Time Deliveries</strong>
            <p style={{ color: "#64748b", margin: 0, fontSize: "13px", lineHeight: "1.4" }}>
              Accept orders promptly, follow navigation instructions carefully, and call customers in advance if you struggle to find the address.
            </p>
          </div>

          <div style={{ border: "1px solid #f1f5f9", padding: "16px", borderRadius: "8px" }}>
            <strong style={{ display: "block", color: "#6366f1", marginBottom: "6px" }}>🚚 Acceptance Rate</strong>
            <p style={{ color: "#64748b", margin: 0, fontSize: "13px", lineHeight: "1.4" }}>
              Avoid rejecting orders during peak hours. Keeping your acceptance rate above 90% qualifies you for the daily bonus incentives pool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
