import { useEffect, useState } from "react";
import api from "../../api/client";

function DeliveryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get("/restaurant/delivery");
        if (res.data?.success) setOrders(res.data.data || []);
        else throw new Error(res.data?.message || "Failed to fetch delivery");
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Failed to fetch delivery");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading delivery...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>;

  return (
    <div>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Delivery</h1>
        </div>
      </header>

      <div className="card">
        <h3 style={{ marginBottom: 12, color: "#0f172a" }}>Active Delivery Orders</h3>
        {orders.length ? (
          <div className="orders-list">
            {orders.map((o) => (
              <div key={o.id} className="order-item" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="order-id">{o.orderCode}</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{o.customer}</div>
                  <div style={{ marginTop: 6 }}>{o.items}</div>
                </div>
                <div style={{ width: 180, textAlign: "right" }}>
                  <div style={{ fontWeight: 900 }}>₹{o.total}</div>
                  <div style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>{o.distance} • {o.estimatedTime}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b" }}>No active delivery orders.</p>
        )}
      </div>
    </div>
  );
}

export default DeliveryPage;

