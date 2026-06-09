import { useEffect, useState, useMemo } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiRefreshCw, FiMapPin } from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";

function fmtMoney(v) {
  const n = Number(v || 0);
  return `₹${n.toFixed(0)}`;
}

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

      const avail = Array.isArray(availRes.data) ? availRes.data : availRes.data?.value || [];
      const mine = Array.isArray(mineRes.data) ? mineRes.data : mineRes.data?.value || [];
      setAvailable(avail);
      setMyOrders(mine);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
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
      await Promise.all(available.map((o) => api.post(`/delivery/${o._id || o.id}/accept`)));
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

  const combined = useMemo(() => [...available, ...myOrders], [available, myOrders]);

  const stats = useMemo(() => {
    const totalOrders = combined.length;
    const activeOrders = combined.filter((o) => o.active).length;
    const revenue = combined.reduce((s, o) => s + Number(o.total || o.amount || 0), 0);
    return { totalOrders, activeOrders, revenue, avgDeliveryTime: 32 };
  }, [combined]);

  const statusCounts = useMemo(() => {
    const map = {};
    combined.forEach((o) => {
      const st = o.status || "Unknown";
      map[st] = (map[st] || 0) + 1;
    });
    return map;
  }, [combined]);

  const topItems = useMemo(() => {
    const counts = {};
    combined.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.name || it.menuItemId || "item";
        counts[key] = counts[key] || { name: it.name || key, orders: 0 };
        counts[key].orders += Number(it.quantity || 1);
      });
    });
    return Object.values(counts).sort((a, b) => b.orders - a.orders).slice(0, 5);
  }, [combined]);

  const renderOrderRow = (o, isMine = false) => {
    const id = o._id || o.id;
    const items = (o.items || []).map((it) => `${it.quantity} x ${it.name}`).join(", ");
    const cust = o.userId?.name || o.user?.name || "Customer";
    const phone = o.userId?.phone || o.user?.phone || "-";
    const rest = o.restaurantId?.name || o.restaurantName || "Restaurant";

    return (
      <div key={id} className="od-row">
        <div className="od-left">
          <div className="od-code">{o.orderCode || id}</div>
          <div className="od-meta">{rest} • {items}</div>
        </div>
        <div className="od-right">
          <div className="od-amt">{fmtMoney(o.total || o.amount)}</div>
          <div className="od-status">{o.status}</div>
        </div>
        <div className="od-bottom">To: {cust} • {phone} — {o.address || "-"}</div>
        <div className="od-actions">
          {!isMine ? (
            <button onClick={() => acceptOrder(id)} disabled={processing}>{processing ? "Processing..." : "Accept"}</button>
          ) : (
            <>
              {o.status !== "On the way" && o.status !== "Delivered" && (
                <button onClick={() => updateStatus(id, "On the way")}>On the way</button>
              )}
              {o.status !== "Delivered" && <button onClick={() => updateStatus(id, "Delivered")}>Delivered</button>}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="delivery-dashboard">
      <div className="dd-header">
        <h1>Delivery Dashboard</h1>
        <div className="dd-actions">
          <button className="btn" onClick={fetchLists}><FiRefreshCw /></button>
          <button className="btn primary" onClick={acceptAll} disabled={!available.length || processing}>{processing ? 'Working...' : `Accept All (${available.length})`}</button>
        </div>
      </div>

      <div className="dd-stats">
        <div className="stat-card">
          <div className="stat-title">Total Orders</div>
          <div className="stat-value">{stats.totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Orders</div>
          <div className="stat-value">{stats.activeOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Revenue</div>
          <div className="stat-value">{fmtMoney(stats.revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Avg Delivery</div>
          <div className="stat-value">{stats.avgDeliveryTime} mins</div>
        </div>
      </div>

      <div className="dd-grid">
        <div className="col-left">
          <div className="card overview">
            <h3>Order Overview</h3>
            <div className="sparkline">{/* Simple placeholder sparkline */}
              <svg width="100%" height="64" viewBox="0 0 200 64" preserveAspectRatio="none">
                <polyline fill="none" stroke="#f97316" strokeWidth="3" points="0,50 30,40 60,30 90,22 120,28 150,18 180,26 200,24" />
              </svg>
            </div>
          </div>

          <div className="card recent">
            <h3>Recent Orders</h3>
            <div className="list">
              {combined.length === 0 && <div className="empty">No recent orders</div>}
              {combined.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8).map((o)=>renderOrderRow(o, myOrders.some(m=> (m._id||m.id) === (o._id||o.id))))}
            </div>
          </div>
        </div>

        <aside className="col-right">
          <div className="card status-card">
            <h3>Order Status</h3>
            <ul className="status-list">
              {Object.entries(statusCounts).length === 0 && <li>No orders</li>}
              {Object.entries(statusCounts).map(([k,v])=> (
                <li key={k}><strong>{v}</strong> {k}</li>
              ))}
            </ul>
          </div>

          <div className="card map-card">
            <h3>Live Delivery Tracking</h3>
            <div className="map-placeholder">
              <div className="pin"><FiMapPin size={24} /></div>
            </div>
          </div>

          <div className="card partners">
            <h3>Delivery Partners</h3>
            <ul>
              <li><AiOutlineUser /> Rahul Singh <span className="tag online">Online</span></li>
              <li><AiOutlineUser /> Amit Kumar <span className="tag online">Online</span></li>
              <li><AiOutlineUser /> Vikash Yadav <span className="tag busy">Busy</span></li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        .delivery-dashboard{padding:20px;max-width:1200px;margin:0 auto;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;color:#0f172a}
        .dd-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .dd-header h1{margin:0;font-size:22px}
        .dd-actions{display:flex;gap:8px}
        .btn{padding:8px 10px;border-radius:8px;border:1px solid #e6e6e6;background:white;cursor:pointer}
        .btn.primary{background:#ff7a29;color:white;border:none}
        .dd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
        .stat-card{background:white;padding:14px;border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,0.06);}
        .stat-title{font-size:12px;color:#64748b}
        .stat-value{font-size:20px;font-weight:800;margin-top:6px}
        .dd-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px}
        .col-left .card{background:white;padding:16px;border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,0.06);margin-bottom:16px}
        .card h3{margin:0 0 10px}
        .overview .sparkline{height:64px}
        .recent .list{display:flex;flex-direction:column;gap:10px}
        .od-row{background:#fff;border-radius:10px;padding:12px;border:1px solid #f1f5f9}
        .od-left{display:flex;flex-direction:column}
        .od-code{font-weight:800}
        .od-meta{font-size:13px;color:#6b7280}
        .od-right{position:absolute;right:20px;top:18px;text-align:right}
        .od-amt{font-weight:800}
        .od-status{font-size:12px;color:#64748b}
        .od-bottom{font-size:13px;color:#475569;margin-top:8px}
        .od-actions{display:flex;gap:8px;margin-top:8px}
        .col-right .card{background:white;padding:16px;border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,0.06);margin-bottom:16px}
        .status-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
        .map-placeholder{height:180px;background:linear-gradient(180deg,#f8fafc,#ffffff);border-radius:10px;display:flex;align-items:center;justify-content:center}
        .partners ul{list-style:none;padding:0;margin:0}
        .partners li{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f1f5f9}
        .tag{padding:4px 8px;border-radius:999px;font-size:12px}
        .tag.online{background:#ecfdf5;color:#065f46}
        .tag.busy{background:#fff7ed;color:#92400e}
        @media (max-width: 900px){.dd-grid{grid-template-columns:1fr}.dd-stats{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </div>
  );
}