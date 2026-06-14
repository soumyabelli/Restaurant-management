import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/client";
import { FiGift, FiAward, FiZap, FiCheckCircle } from "react-icons/fi";
import "../../styles/restaurant-dashboard.css";

export default function Incentives() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/delivery/my-orders");
      const data = Array.isArray(res.data) ? res.data : res.data?.value || [];
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const todayCompletedCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(
      (o) => o.status === "Delivered" && new Date(o.createdAt).toDateString() === todayStr
    ).length;
  }, [orders]);

  const targetCount = 15;
  const progressPercent = Math.min(Math.round((todayCompletedCount / targetCount) * 100), 100);

  const activeSurges = [
    {
      time: "12:00 PM - 03:00 PM",
      label: "Lunch Rush Surge",
      multiplier: "1.2x Pay",
      active: false,
    },
    {
      time: "07:00 PM - 11:00 PM",
      label: "Dinner Peak Surge",
      multiplier: "1.5x Pay",
      active: true,
    },
  ];

  const milestones = [
    { name: "Deliver 10 orders today", bonus: "₹100 bonus", completed: todayCompletedCount >= 10 },
    { name: "Deliver 15 orders today", bonus: "₹300 bonus", completed: todayCompletedCount >= 15 },
    { name: "Weekly Super Rider (80 orders)", bonus: "₹1,500 bonus", completed: orders.length >= 80 },
  ];

  return (
    <div className="delivery-incentives-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>Incentives & Bonuses</h2>
          <p className="muted">Earn extra payout by completing daily milestones and working peak hours.</p>
        </div>
      </header>

      <div className="rh-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Progress Ring / Gauge */}
        <div className="card" style={{ background: "white", padding: "24px", borderRadius: "16px", display: "flex", alignItems: "center", justifyItems: "center", gap: "24px" }}>
          {/* Circular progress SVG */}
          <div style={{ position: "relative", width: "120px", height: "120px" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#6366f1"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <strong style={{ fontSize: "20px", color: "#0f172a" }}>{progressPercent}%</strong>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Completed</span>
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "18px" }}>Daily Target Tracker</h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 12px 0", lineHeight: "1.4" }}>
              You completed <strong>{todayCompletedCount}</strong> out of <strong>{targetCount}</strong> deliveries today.
            </p>
            <span style={{ fontSize: "13px", padding: "4px 8px", background: "#f5f3ff", borderRadius: "6px", color: "#4f46e5", fontWeight: "700" }}>
              Bonus Reward: ₹300
            </span>
          </div>
        </div>

        {/* Peak Surge Multipliers */}
        <div className="card" style={{ background: "white", padding: "24px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FiZap size={22} style={{ color: "#f59e0b" }} />
            <h3 style={{ margin: 0 }}>Active Surge Periods</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeSurges.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  borderRadius: "8px",
                  border: s.active ? "1.5px solid #f59e0b" : "1px solid #f1f5f9",
                  background: s.active ? "#fffbeb" : "white",
                }}
              >
                <div>
                  <strong style={{ display: "block", color: "#334155" }}>{s.label}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>⏱️ {s.time}</span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: s.active ? "#f59e0b" : "#f1f5f9",
                      color: s.active ? "white" : "#475569",
                    }}
                  >
                    {s.multiplier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestone List */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
        <h3 style={{ margin: "0 0 16px 0" }}>Weekly & Daily Targets</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {milestones.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #f1f5f9",
                background: m.completed ? "#ecfdf5" : "white",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ color: m.completed ? "#10b981" : "#cbd5e1" }}>
                  <FiCheckCircle size={22} />
                </div>
                <div>
                  <strong style={{ display: "block", color: m.completed ? "#065f46" : "#334155", textDecoration: m.completed ? "line-through" : "none" }}>
                    {m.name}
                  </strong>
                  <span style={{ fontSize: "12px", color: m.completed ? "#047857" : "#64748b" }}>{m.bonus}</span>
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    background: m.completed ? "#10b981" : "#f1f5f9",
                    color: m.completed ? "white" : "#64748b",
                  }}
                >
                  {m.completed ? "Collected" : "Locked"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
