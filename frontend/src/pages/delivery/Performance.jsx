import React, { useState } from "react";
import { FiAward, FiStar, FiClock, FiCheckCircle, FiActivity } from "react-icons/fi";
import "../../styles/restaurant-dashboard.css";

export default function Performance() {
  const [activeTab, setActiveTab] = useState("rating");

  // Mock performance data
  const metrics = {
    rating: 4.85,
    onTimeRate: 96,
    acceptanceRate: 98,
    avgTime: 26, // minutes
    deliveriesCount: 38,
    nextTierTarget: 50,
    currentTier: "Silver",
    nextTier: "Gold",
  };

  const ratingHistory = [4.5, 4.6, 4.6, 4.8, 4.7, 4.9, 4.8, 4.9, 4.8, 4.9];
  const speedHistory = [32, 30, 28, 29, 27, 26, 25, 27, 26, 26];

  const pointsRating = ratingHistory.map((val, idx) => ({
    x: 40 + idx * 50,
    y: 180 - (val - 4.0) * 120, // scale ratings 4.0 - 5.0 in 0-180 height
    val: val.toFixed(1),
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

  return (
    <div className="delivery-performance-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>My Performance</h2>
          <p className="muted">Monitor your ratings, average delivery speeds, and career level progress.</p>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="rh-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#f59e0b" }}><FiStar /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{metrics.rating} ★</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Customer Rating</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#10b981" }}><FiClock /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{metrics.onTimeRate}%</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>On-Time Deliveries</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#6366f1" }}><FiCheckCircle /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{metrics.acceptanceRate}%</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Order Acceptance Rate</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#ec4899" }}><FiActivity /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{metrics.avgTime} min</h3>
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
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <FiAward size={22} style={{ color: "#6366f1" }} />
              <h3 style={{ margin: 0 }}>Courier Rank</h3>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <strong style={{ fontSize: "20px", color: "#334155" }}>{metrics.currentTier} Level</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Next: {metrics.nextTier}</span>
            </div>

            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: "0 0 16px 0" }}>
              Reach {metrics.nextTierTarget} completed deliveries to unlock Gold status bonuses and high-value orders pool.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
              <span>{metrics.deliveriesCount} / {metrics.nextTierTarget} Orders</span>
              <span>{Math.round((metrics.deliveriesCount / metrics.nextTierTarget) * 100)}%</span>
            </div>
            
            <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(metrics.deliveriesCount / metrics.nextTierTarget) * 100}%`,
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
