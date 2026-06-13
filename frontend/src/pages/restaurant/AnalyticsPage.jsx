import { useEffect, useState } from "react";
import api from "../../api/client";

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get("/restaurant/analytics");
        if (res.data?.success) setData(res.data.data);
        else throw new Error(res.data?.message || "Failed to fetch analytics");
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading analytics...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Analytics</h1>
        </div>
      </header>

      <section className="rh-stats" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">💵</div>
            <div className="metric-value">
              <h3>₹{data?.totals?.todayRevenue?.toLocaleString?.() ?? data?.totals?.todayRevenue ?? 0}</h3>
            </div>
          </div>
          <p className="label">Today Revenue</p>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">🧾</div>
            <div className="metric-value">
              <h3>{data?.totals?.totalOrders ?? 0}</h3>
            </div>
          </div>
          <p className="label">Total Orders</p>
        </div>
      </section>

      <div className="card">
        <h3 style={{ marginBottom: 12, color: "#0f172a" }}>Top Items</h3>
        {data?.topItems?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.topItems.map((it, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {it.emoji || "🍽️"} {it.name} — ₹{it.price} • {it.orders || it.count} orders
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#64748b" }}>No analytics data yet.</p>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;

