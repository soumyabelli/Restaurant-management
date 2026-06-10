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
        <div className="od-row-top">
          <div className="od-left">
            <div className="od-code">{o.orderCode || id}</div>
            <div className="od-meta">{rest} • {items}</div>
          </div>

          <div className="od-right">
            <div className="od-amt">{fmtMoney(o.total || o.amount)}</div>
            <div className={`od-status badge-${(o.status||'').toLowerCase().replace(/\s+/g,'-')}`}>{o.status}</div>
          </div>
        </div>

        <div className="od-row-bottom">
          <div className="od-bottom">To: {cust} • {phone} — {o.address || "-"}</div>
          <div className="od-actions">
            {!isMine ? (
              <button className="accept" onClick={() => acceptOrder(id)} disabled={processing}>{processing ? "..." : "Accept"}</button>
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
      </div>
    );
  };
  return (
    <div className="delivery-dashboard">
      <div className="header-row">
        <div>
          <h2>Good morning, Delivery!</h2>
          <p className="muted">Here's what's happening with your deliveries today.</p>
        </div>

        <div className="header-actions">
          <div className="small-card">
            <div className="small-title">Today</div>
            <div className="small-value">{new Date().toLocaleDateString()}</div>
          </div>

          <button className="icon-btn" onClick={fetchLists} aria-label="refresh"><FiRefreshCw /></button>
          <button className="btn primary" onClick={acceptAll} disabled={!available.length || processing}>{processing ? 'Working...' : `Accept All (${available.length})`}</button>
        </div>
      </div>

      <div className="dd-stats">
        <div className="stat-card orange">
          <div className="stat-top"><div className="stat-title">Total Orders</div><div className="stat-value">{stats.totalOrders}</div></div>
          <div className="stat-sub">{statusCounts && statusCounts.New ? `${statusCounts.New} new orders` : ''}</div>
        </div>

        <div className="stat-card green">
          <div className="stat-top"><div className="stat-title">Revenue</div><div className="stat-value">{fmtMoney(stats.revenue)}</div></div>
          <div className="stat-sub">{Math.round(Math.random()*30)}% from yesterday</div>
        </div>

        <div className="stat-card light">
          <div className="stat-top"><div className="stat-title">Active Orders</div><div className="stat-value">{stats.activeOrders}</div></div>
          <div className="stat-sub">Live orders in progress</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-top"><div className="stat-title">Avg. Delivery Time</div><div className="stat-value">{stats.avgDeliveryTime} min</div></div>
          <div className="stat-sub">{Math.round(Math.random()*10)} min from yesterday</div>
        </div>
      </div>

      <div className="grid">
        <main className="col-main">
          <div className="card overview">
            <div className="card-head">
              <h3>Order Overview</h3>
              <div className="card-actions">Today</div>
            </div>
            <div className="sparkline">
              <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                <polyline fill="none" stroke="#ff7a29" strokeWidth="3" points="0,60 40,50 80,38 120,30 160,24 200,28 240,20 280,30 320,26 360,32 400,28" />
              </svg>
            </div>
          </div>

          <div className="card recent">
            <div className="card-head">
              <h3>Recent Orders</h3>
              <div className="card-actions">View All</div>
            </div>

            <div className="table">
              <div className="thead">
                <div>Order ID</div>
                <div>Customer</div>
                <div>Items</div>
                <div>Amount</div>
                <div>Status</div>
              </div>
              <div className="tbody">
                {combined.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8).map((o)=>{
                  const mine = myOrders.some(m=> (m._id||m.id) === (o._id||o.id));
                  return (
                    <div key={(o._id||o.id)} className="tr">
                      <div>{o.orderCode || (o._id||o.id)}</div>
                      <div>{o.userId?.name || o.user?.name || 'Customer'}</div>
                      <div className="muted">{(o.items||[]).map(i=>i.name).slice(0,2).join(', ')}</div>
                      <div>{fmtMoney(o.total||o.amount)}</div>
                      <div>{o.status}</div>
                    </div>
                  )
                })}
                {combined.length === 0 && <div className="empty">No recent orders</div>}
              </div>
            </div>
          </div>
        </main>

        <aside className="col-aside">
          <div className="card status">
            <h3>Order Status</h3>
            <div className="status-grid">
              <div className="donut-wrapper">
                <div className="donut" style={{background: (()=>{
                  const pairs = [ ['New','#ff7a29'], ['Preparing','#f59e0b'], ['On the way','#3b82f6'], ['Delivered','#10b981'], ['Cancelled','#ef4444'] ];
                  const total = Math.max(1, stats.totalOrders);
                  let start = 0;
                  const parts = [];
                  pairs.forEach(([k,color])=>{
                    const c = statusCounts[k] || 0;
                    const pct = (c/total)*100;
                    if(pct>0) { parts.push(`${color} ${start}% ${start + pct}%`); start += pct; }
                  });
                  if(parts.length===0) return '#e5e7eb';
                  return `conic-gradient(${parts.join(',')})`;
                })() }}>
                  <div className="donut-center">{stats.totalOrders}</div>
                </div>
              </div>

              <div className="status-list">
                {Object.entries(statusCounts).length === 0 && <div className="muted">No orders</div>}
                {Object.entries(statusCounts).map(([k,v])=> (
                  <div key={k} className="status-row"><strong>{v}</strong><span className="muted">{k}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="card map">
            <h3>Live Delivery Tracking</h3>
            <div className="map-placeholder">
              <div className="map-pin"><FiMapPin size={28} /></div>
            </div>
            <div className="rider">Rider: Rahul Singh <span className="muted">ETA: 12 mins • 2.4 km away</span></div>
          </div>

          <div className="card sellers">
            <h3>Top Selling Items</h3>
            <ol>
              {topItems.length === 0 && <li className="muted">No data</li>}
              {topItems.map((it,idx)=> (
                <li key={idx}><span className="rank">{idx+1}</span> <div className="item-body"><div className="name">{it.name}</div><div className="muted">{it.orders} orders</div></div></li>
              ))}
            </ol>
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
        .delivery-dashboard{padding:26px;max-width:1200px;margin:0 auto;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;color:#0f172a}
        .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .header-row h2{margin:0;font-size:22px}
        .muted{color:#64748b;font-size:13px}
        .header-actions{display:flex;align-items:center;gap:12px}
        .small-card{background:#fff;padding:8px 12px;border-radius:10px;box-shadow:0 6px 18px rgba(15,23,42,0.04);text-align:center}
        .small-title{font-size:12px;color:#94a3b8}
        .small-value{font-weight:700}
        .icon-btn{background:#fff;border:1px solid #eef2f7;padding:8px;border-radius:10px;cursor:pointer}

        .dd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        .stat-card{background:white;padding:14px;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,0.04);}
        .stat-top{display:flex;justify-content:space-between;align-items:center}
        .stat-title{font-size:13px;color:#64748b}
        .stat-value{font-size:20px;font-weight:800}
        .stat-sub{font-size:12px;color:#94a3b8;margin-top:8px}
        .stat-card.orange .stat-value{color:#ff7a29}
        .stat-card.green .stat-value{color:#10b981}
        .stat-card.blue .stat-value{color:#2563eb}

        .grid{display:grid;grid-template-columns:2fr 1fr;gap:18px}
        .col-main .card, .col-aside .card{background:white;padding:16px;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,0.04);margin-bottom:16px}
        .card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .card-head h3{margin:0}

        .sparkline{height:80px}

        .table{border-top:1px solid #f1f5f9}
        .thead{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;padding:12px 8px;font-size:13px;color:#64748b}
        .tbody{display:flex;flex-direction:column}
        .tr{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;padding:10px 8px;border-bottom:1px solid #f8fafc;align-items:center}
        .tr .muted{color:#94a3b8}

        .od-row{background:#fff;border-radius:10px;padding:12px;border:1px solid #f1f5f9}
        .od-row-top{display:flex;justify-content:space-between;align-items:flex-start}
        .od-left{display:flex;flex-direction:column}
        .od-code{font-weight:800}
        .od-meta{font-size:13px;color:#6b7280}
        .od-right{text-align:right}
        .od-amt{font-weight:800}
        .od-status{font-size:12px;color:#64748b}
        .od-row-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
        .od-bottom{font-size:13px;color:#475569}
        .od-actions{display:flex;gap:8px}
        .od-actions button{padding:8px 10px;border-radius:8px;border:1px solid #e6e6e6;background:white;cursor:pointer}
        .od-actions .accept{background:#ff7a29;color:white;border:none}

        .status-grid{display:flex;gap:12px;align-items:center}
        .donut-wrapper{width:140px}
        .donut{width:120px;height:120px;border-radius:999px;display:flex;align-items:center;justify-content:center}
        .donut-center{background:white;width:70%;height:70%;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:800}
        .status-list{display:flex;flex-direction:column;gap:8px;margin-left:8px}
        .status-row{display:flex;justify-content:space-between;gap:12px}

        .map-placeholder{height:160px;background:linear-gradient(180deg,#f8fafc,#ffffff);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
        .rider{font-size:13px;color:#475569}

        .sellers ol{padding:0;margin:0;list-style:none;display:flex;flex-direction:column;gap:8px}
        .sellers li{display:flex;align-items:center;gap:12px}
        .rank{width:28px;height:28px;border-radius:6px;background:#f1f5f9;display:grid;place-items:center;font-weight:700}

        .partners ul{list-style:none;padding:0;margin:0}
        .partners li{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f1f5f9}
        .tag{padding:6px 10px;border-radius:999px;font-size:12px}
        .tag.online{background:#ecfdf5;color:#065f46}
        .tag.busy{background:#fff7ed;color:#92400e}

        @media (max-width: 980px){.grid{grid-template-columns:1fr}.dd-stats{grid-template-columns:repeat(2,1fr)}.thead{font-size:12px}}
      `}</style>
    </div>
  );
}