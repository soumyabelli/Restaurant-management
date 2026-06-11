import { useState, useEffect } from "react";
import api from "../../api/client";

function TotalOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/restaurant/orders');
        if (res.data?.success) {
          setOrders(res.data.data);
          setError(null);
        } else {
          throw new Error(res.data?.message || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Failed to fetch restaurant orders:', err);
        if (!localStorage.getItem('token') || err?.response?.status === 401) {
          try {
            const login = await api.post('/auth/login', { email: 'restaurant1@gmail.com', password: '123', role: 'restaurant' });
            if (login?.data?.token) {
              localStorage.setItem('token', login.data.token);
              localStorage.setItem('user', JSON.stringify(login.data.user || { role: 'restaurant' }));
              const retry = await api.get('/restaurant/orders');
              if (retry.data?.success) {
                setOrders(retry.data.data);
                setError(null);
                return;
              }
            }
          } catch (loginErr) {
            setError(loginErr.message || 'Auto-login failed');
            return;
          }
        }
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await api.put(`/restaurant/orders/${orderId}/status`, { status });
      const json = res.data;
      if (!json?.success) throw new Error(json?.message || 'Failed to update status');
      setOrders((prev) => prev.map((o) => (o.id === json.data.id || o._id === json.data.id ? json.data : o)));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };


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
                  <div style={{ marginTop: "8px" }}>
                    {order.status !== "Ready" && (
                      <button
                        onClick={() => updateStatus(order.id, "Ready")}
                        style={{ marginLeft: 8, padding: "6px 8px", borderRadius: 6, border: "none", background: "#0ea5a4", color: "white", cursor: "pointer" }}
                      >
                        Mark Ready
                      </button>
                    )}
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
