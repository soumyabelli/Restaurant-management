import { useEffect, useState } from "react";
import api from "../../api/client";

function PayoutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get("/restaurant/payout");
        if (res.data?.success) setData(res.data.data);
        else throw new Error(res.data?.message || "Failed to fetch payout");
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Failed to fetch payout");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading payout...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Payout</h1>
        </div>
      </header>

      <section className="rh-stats" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">💵</div>
            <div className="metric-value">
              <h3>₹{data?.totalRevenue?.toLocaleString?.() ?? data?.totalRevenue ?? 0}</h3>
            </div>
          </div>
          <p className="label">Total Revenue</p>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">📤</div>
            <div className="metric-value">
              <h3>₹{data?.netEarnings?.toLocaleString?.() ?? data?.netEarnings ?? 0}</h3>
            </div>
          </div>
          <p className="label">Net Earnings</p>
        </div>
      </section>

      <div className="card">
        <h3 style={{ marginBottom: 12, color: "#0f172a" }}>Weekly Breakdown</h3>
        {data?.weeklyBreakdown?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.weeklyBreakdown.map((w, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {w.label}: ₹{w.net?.toLocaleString?.() ?? w.net} ({w.status})
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#64748b" }}>No payout data yet.</p>
        )}
        {data?.nextPayoutDate ? <p style={{ marginTop: 12, color: "#64748b" }}>Next payout: {data.nextPayoutDate}</p> : null}
      </div>
    </div>
  );
}

export default PayoutPage;

