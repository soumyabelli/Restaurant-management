import { useEffect, useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function DeliveryDashboard() {
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const [availRes, mineRes] = await Promise.all([
        api.get("/delivery/available"),
        api.get("/delivery/my-orders"),
      ]);

      setAvailable(availRes.data || []);
      setMyOrders(mineRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
    // Poll for new available orders every 12 seconds
    const t = setInterval(fetchLists, 12000);
    return () => clearInterval(t);
  }, []);

  const acceptOrder = async (orderId) => {
    try {
      setProcessing(true);
      await api.post(`/delivery/${orderId}/accept`);
      toast.success("Order accepted");
      await fetchLists();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to accept order");
    } finally {
      setProcessing(false);
    }
  };

  const acceptAll = async () => {
    if (!available.length) return;
    try {
      setProcessing(true);
      await Promise.all(
        available.map((o) => api.post(`/delivery/${o._id || o.id}/accept`))
      );
      toast.success("Accepted all available orders");
      await fetchLists();
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept all orders");
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/delivery/${orderId}/status`, { status });
      toast.success(`Marked ${status}`);
      await fetchLists();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const renderOrderCard = (order, isMine = false) => {
    const id = order._id || order.id;
    const items = (order.items || []).map((it) => `${it.quantity} x ${it.name}`).join(", ");
    const customer = order.userId?.name || order.user?.name || "Customer";
    const phone = order.userId?.phone || order.user?.phone || "-";
    const restaurant = order.restaurantId?.name || order.restaurantName || "Restaurant";
    const address = order.address || order.userId?.address || "-";

    return (
      <div key={id} className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{order.orderCode || id}</strong>
            <div style={{ fontSize: 13, color: "#555" }}>{restaurant}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>₹{order.total?.toFixed ? order.total.toFixed(0) : order.total}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{order.status}</div>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 14 }}>{items}</div>

        <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
          <div>To: {customer} • {phone}</div>
          <div style={{ marginTop: 6 }}>Address: {address}</div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          {!isMine ? (
            <button type="button" onClick={() => acceptOrder(id)} disabled={processing} style={{ padding: "8px 12px" }}>
              {processing ? "Processing..." : "Accept Order"}
            </button>
          ) : (
            <>
              {order.status !== "On the way" && order.status !== "Delivered" && (
                <button type="button" onClick={() => updateStatus(id, "On the way")} style={{ padding: "8px 12px" }}>
                  Mark On the way
                </button>
              )}
              {order.status !== "Delivered" && (
                <button type="button" onClick={() => updateStatus(id, "Delivered")} style={{ padding: "8px 12px" }}>
                  Mark Delivered
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Delivery Dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={fetchLists} disabled={loading} style={{ padding: "8px 12px" }}>Refresh</button>
          <button type="button" onClick={acceptAll} disabled={processing || !available.length} style={{ padding: "8px 12px", background: "#10b981", color: "white", border: "none" }}>
            {processing ? "Working..." : `Accept All (${available.length})`}
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <section>
          <h2>Available Orders</h2>
          {loading ? <p>Loading...</p> : available.length ? available.map((o) => renderOrderCard(o, false)) : <p>No available orders.</p>}
        </section>

        <section>
          <h2>My Orders</h2>
          {loading ? <p>Loading...</p> : myOrders.length ? myOrders.map((o) => renderOrderCard(o, true)) : <p>No assigned orders yet.</p>}
        </section>
      </div>
    </div>
  );
}