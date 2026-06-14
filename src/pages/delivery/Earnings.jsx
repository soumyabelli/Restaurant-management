import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiRefreshCw, FiTrendingUp, FiShoppingBag, FiDollarSign } from "react-icons/fi";
import "../../styles/restaurant-dashboard.css";

const fmtMoney = (v) => `₹${Number(v || 0).toFixed(0)}`;

export default function Earnings() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBar, setSelectedBar] = useState(null);

  const fetchEarnings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/delivery/wallet");
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load earnings data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const stats = useMemo(() => {
    let today = 0;
    let weekly = 0;
    let monthly = 0;
    let creditCount = 0;
    const now = new Date();

    transactions.forEach((tx) => {
      if (tx.type !== "credit") return;
      creditCount++;
      const val = Number(tx.amount || 0);
      const date = new Date(tx.createdAt);

      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) today += val;
      if (diffDays <= 7) weekly += val;
      if (diffDays <= 30) monthly += val;
    });

    return { today, weekly, monthly, count: creditCount };
  }, [transactions]);

  // Last 7 days chart data
  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dayName: days[d.getDay()],
        dateStr: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        amount: 0,
      };
    }).reverse();

    transactions.forEach((tx) => {
      if (tx.type !== "credit") return;
      const val = Number(tx.amount || 0);
      const oDate = new Date(tx.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });

      const item = result.find((r) => r.dateStr === oDate);
      if (item) {
        item.amount += val;
      }
    });

    return result;
  }, [transactions]);

  const maxChartVal = useMemo(() => {
    const vals = chartData.map((c) => c.amount);
    return Math.max(...vals, 400); // minimum scale limit
  }, [chartData]);

  const creditLogs = useMemo(() => {
    return transactions.filter((tx) => tx.type === "credit");
  }, [transactions]);

  return (
    <div className="delivery-earnings-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>Earnings & Payouts</h2>
          <p className="muted">Track your daily income, commission share, and weekly summaries.</p>
        </div>
        <button className="icon-btn" onClick={() => fetchEarnings()} aria-label="refresh" disabled={loading}>
          <FiRefreshCw className={loading ? "spin" : ""} />
        </button>
      </header>

      {/* KPI Cards */}
      <section className="rh-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#6366f1" }}><FiDollarSign /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{fmtMoney(stats.today)}</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Today's Earnings</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#10b981" }}><FiTrendingUp /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{fmtMoney(stats.weekly)}</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Weekly Earnings</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#f59e0b" }}><FiShoppingBag /></div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{fmtMoney(stats.monthly)}</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Monthly Earnings</p>
        </div>

        <div className="stat" style={{ padding: "20px", borderRadius: "12px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="stat-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="metric-icon" style={{ fontSize: "24px", color: "#ef4444" }}>📦</div>
            <div className="metric-value">
              <h3 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>{stats.count}</h3>
            </div>
          </div>
          <p className="label" style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>Total Deliveries</p>
        </div>
      </section>

      <div className="rh-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Interactive SVG Bar Chart */}
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>Daily Performance (Last 7 Days)</h3>
            {selectedBar !== null && (
              <span style={{ fontSize: "13px", padding: "4px 8px", background: "#f1f5f9", borderRadius: "6px", color: "#475569" }}>
                {chartData[selectedBar].dateStr}: <strong>{fmtMoney(chartData[selectedBar].amount)}</strong>
              </span>
            )}
          </div>

          <div style={{ height: "220px", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-around", paddingTop: "20px" }}>
            {chartData.map((c, idx) => {
              const pct = (c.amount / maxChartVal) * 100;
              return (
                <div
                  key={idx}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "40px", cursor: "pointer" }}
                  onMouseEnter={() => setSelectedBar(idx)}
                  onMouseLeave={() => setSelectedBar(null)}
                >
                  <div
                    style={{
                      height: `${pct || 4}%`,
                      width: "100%",
                      borderRadius: "6px 6px 0 0",
                      background: selectedBar === idx ? "linear-gradient(to top, #4f46e5, #818cf8)" : "linear-gradient(to top, #6366f1, #a5b4fc)",
                      transition: "height 0.3s, background 0.2s",
                      position: "relative",
                    }}
                  />
                  <span style={{ fontSize: "12px", marginTop: "8px", fontWeight: "700", color: "#475569" }}>{c.dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payout Summary */}
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Earnings Structure</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>Base Delivery Fare</span>
              <strong>₹40.00 / order</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>Order Commission</span>
              <strong>15% of order subtotal</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>Customer Tips</span>
              <strong>Keep 100%</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
              <span style={{ color: "#64748b" }}>Weekly Payout Date</span>
              <strong style={{ color: "#4f46e5" }}>Every Monday</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Earnings Log */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", marginTop: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0" }}>Recent Delivery Logs</h3>
        {creditLogs.length === 0 ? (
          <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>No completed deliveries found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {creditLogs.slice(0, 10).map((tx) => {
              const val = Number(tx.amount || 0);
              const base = 40;
              const commission = val - base;

              return (
                <div
                  key={tx._id || tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <strong style={{ display: "block", color: "#0f172a" }}>{tx.title}</strong>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      {new Date(tx.createdAt).toLocaleDateString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ display: "block", color: "#10b981", fontSize: "16px" }}>+{fmtMoney(val)}</strong>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      (Base: ₹{base} + Comm: ₹{Math.max(0, commission)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .spin {
          animation: spin_loader 1s linear infinite;
        }
        @keyframes spin_loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
