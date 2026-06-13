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

  const fmtINR = (n) => {
    const x = Number(n || 0);
    try {
      return x.toLocaleString("en-IN");
    } catch {
      return String(x);
    }
  };

  return (
    <div>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Payout</h1>
        </div>
      </header>

      <section className="rh-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16, display: "grid" }}>
        <div className="stat" style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20 }}>💵</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>₹{fmtINR(data?.totalRevenue)}</div>
          </div>
          <p className="label" style={{ margin: "8px 0 0", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            Total Revenue
          </p>
        </div>

        <div className="stat" style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20 }}>🧮</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>₹{fmtINR(data?.platformFee)}</div>
          </div>
          <p className="label" style={{ margin: "8px 0 0", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            Platform Fee
          </p>
        </div>

        <div className="stat" style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20 }}>🏷️</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>₹{fmtINR(data?.gst)}</div>
          </div>
          <p className="label" style={{ margin: "8px 0 0", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            GST
          </p>
        </div>

        <div className="stat" style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20 }}>📤</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>₹{fmtINR(data?.netEarnings)}</div>
          </div>
          <p className="label" style={{ margin: "8px 0 0", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            Net Earnings
          </p>
        </div>
      </section>

      <div className="card" style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "#fff", marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12, color: "#0f172a" }}>Weekly Breakdown</h3>

        {data?.weeklyBreakdown?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            {data.weeklyBreakdown.map((w, idx) => (
              <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{w.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: w.status === "Paid" ? "#16a34a" : "#1d4ed8" }}>
                    {w.status}
                  </div>
                </div>
                <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{w.range}</div>
                <div style={{ marginTop: 10, fontWeight: 1000, color: "#0f172a" }}>
                  ₹{fmtINR(w.net)} <span style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>(Net)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b" }}>No payout data yet.</p>
        )}

        {data?.nextPayoutDate ? (
          <p style={{ marginTop: 12, color: "#64748b", fontWeight: 700 }}>
            Next payout: {data.nextPayoutDate}
          </p>
        ) : null}
      </div>

      <div className="card" style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "#fff" }}>
        <h3 style={{ marginBottom: 12, color: "#0f172a" }}>Recent Payout Transactions</h3>
        {data?.transactions?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.transactions.map((t) => (
              <div key={t.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{t.type}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{t.orderCode} • {new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontWeight: 1000, color: "#4f46e5" }}>₹{fmtINR(t.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b" }}>No transactions yet.</p>
        )}
      </div>
    </div>
  );
}


export default PayoutPage;

