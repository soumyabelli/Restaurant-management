import { useState, useEffect } from "react";

function TotalOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/restaurant/orders", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch orders");
        }

        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
        } else {
          throw new Error(json.message || "Failed to fetch orders");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const totalAmount = orders.reduce((acc, order) => acc + (order.total || 0), 0);

  return (
    <>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Total Orders</h1>
        </div>
      </header>

      <section className="rh-stats" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "20px" }}>
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">🧾</div>
            <div className="metric-value"> 
              <h3>{orders.length}</h3>
            </div>
          </div>
          <p className="label">Total Orders Placed</p>
        </div>
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">💵</div>
            <div className="metric-value"> 
              <h3>₹{totalAmount.toLocaleString()}</h3>
            </div>
          </div>
          <p className="label">Total Revenue Generated</p>
        </div>
      </section>

      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#0f172a" }}>Order Details</h3>
        
        {loading && <p>Loading orders...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {!loading && !error && orders.length === 0 && (
          <p style={{ color: "#64748b" }}>No orders found.</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map(order => (
              <div className="order-item" key={order.id} style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <div className="order-left" style={{ flex: "1 1 300px" }}>
                  <div className="order-id">{order.orderCode} <span style={{ fontWeight: "normal", color: "#64748b", fontSize: "12px", marginLeft: "8px" }}>{order.time}</span></div>
                  <div className="order-customer" style={{ fontSize: "15px", color: "#334155" }}>Customer: {order.customer}</div>
                  <div className="order-items" style={{ marginTop: "8px" }}><strong>Items:</strong> {order.items}</div>
                  {order.address && <div className="order-meta" style={{ marginTop: "4px" }}>📍 {order.address}</div>}
                </div>
                
                <div className="order-right" style={{ flex: "0 0 150px", textAlign: "right", justifyContent: "center" }}>
                  <div className="order-price" style={{ fontSize: "18px" }}>{order.amount}</div>
                  <div style={{ marginTop: "8px" }}>
                    <span className="tag" style={{ background: order.status === "Delivered" ? "#ecfdf5" : order.status === "Cancelled" ? "#fef2f2" : "#eef2ff", color: order.status === "Delivered" ? "#065f46" : order.status === "Cancelled" ? "#991b1b" : "#1d4ed8" }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                    Payment: {order.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default TotalOrdersPage;
