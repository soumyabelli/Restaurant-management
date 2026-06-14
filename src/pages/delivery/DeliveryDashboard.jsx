import { useEffect, useState, useMemo } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";
import { FiRefreshCw, FiMapPin } from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";
import "../../styles/restaurant-dashboard.css";

function fmtMoney(v) {
  const n = Number(v || 0);
  return `₹${n.toFixed(0)}`;
}

const getBezierPoint = (t, p0, p1, p2, p3) => {
  const oneMinusT = 1 - t;
  const mt2 = oneMinusT * oneMinusT;
  const mt3 = mt2 * oneMinusT;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * oneMinusT * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * oneMinusT * t2 * p2.y + t3 * p3.y
  };
};

const getRoutePoint = (t) => {
  const clampedT = Math.max(0, Math.min(1, t));
  const p0 = { x: 40, y: 180 };
  const p1 = { x: 100, y: 40 };
  const p2 = { x: 200, y: 200 };
  const p3 = { x: 260, y: 60 };

  const pt = getBezierPoint(clampedT, p0, p1, p2, p3);
  
  // Estimate tangent
  const delta = 0.01;
  const nextT = Math.min(1, clampedT + delta);
  const prevT = Math.max(0, clampedT - delta);
  const ptNext = getBezierPoint(nextT, p0, p1, p2, p3);
  const ptPrev = getBezierPoint(prevT, p0, p1, p2, p3);
  
  const angle = Math.atan2(ptNext.y - ptPrev.y, ptNext.x - ptPrev.x) * (180 / Math.PI);
  return { x: pt.x, y: pt.y, angle };
};

const gridLines = (() => {
  const lines = [];
  for (let i = 20; i < 300; i += 30) {
    lines.push(<line key={`h-${i}`} x1="0" y1={i} x2="300" y2={i} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />);
    lines.push(<line key={`v-${i}`} x1={i} y1="0" x2={i} y2="240" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />);
  }
  return lines;
})();

const blocks = [
  { x: 15, y: 15, w: 50, h: 40, label: "Park", color: "#06181f" },
  { x: 80, y: 15, w: 70, h: 50, label: "Sector 1", color: "#0c1735" },
  { x: 165, y: 15, w: 115, h: 30, label: "Market", color: "#0c1735" },
  
  { x: 15, y: 70, w: 50, h: 80, label: "Sector 2", color: "#0c1735" },
  { x: 120, y: 80, w: 60, h: 70, label: "Mall", color: "#0c1735" },
  { x: 230, y: 60, w: 55, h: 60, label: "Sector 3", color: "#0c1735" },
  
  { x: 80, y: 165, w: 60, h: 60, label: "Sector 4", color: "#0c1735" },
  { x: 155, y: 165, w: 75, h: 60, label: "Sector 5", color: "#0c1735" },
  { x: 245, y: 135, w: 40, h: 90, label: "Sector 6", color: "#0c1735" },
];

export default function DeliveryDashboard() {
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // demo fallback data to preview the dashboard when unauthenticated
  const demoAvailable = [
    {
      _id: 'demo1',
      orderCode: '#FD1001',
      items: [{ name: 'Paneer Tikka Pizza', quantity: 1 }],
      total: 485,
      status: 'New',
      createdAt: new Date().toISOString(),
      userId: { name: 'Rohit Sharma', phone: '9876543210' },
      restaurantName: 'Spice Corner',
      address: 'MG Road',
    },
    {
      _id: 'demo2',
      orderCode: '#FD1002',
      items: [{ name: 'Veg Burger', quantity: 2 }],
      total: 250,
      status: 'Preparing',
      createdAt: new Date().toISOString(),
      userId: { name: 'Priya Patel', phone: '9123456780' },
      restaurantName: 'Burger Hub',
      address: 'Park Street',
    },
  ];

  const demoMyOrders = [
    {
      _id: 'my1',
      orderCode: '#FD1010',
      items: [{ name: 'Chicken Biryani', quantity: 1 }],
      total: 675,
      status: 'On the way',
      createdAt: new Date().toISOString(),
      userId: { name: 'Aman Verma', phone: '9012345678' },
      restaurantName: 'Biryani Palace',
      address: 'Lake Road',
    },
  ];

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
      // If unauthenticated, try demo delivery auto-login, otherwise fallback to demo data
      if (!localStorage.getItem('token') || err?.response?.status === 401) {
        try {
          const login = await api.post('/auth/login', { email: 'delivery@gmail.com', password: '123', role: 'delivery' });
          if (login?.data?.token) {
            localStorage.setItem('token', login.data.token);
            localStorage.setItem('user', JSON.stringify(login.data.user || { role: 'delivery' }));
            // retry fetch
            const [availRes2, mineRes2] = await Promise.all([
              api.get('/delivery/available'),
              api.get('/delivery/my-orders'),
            ]);
            const avail = Array.isArray(availRes2.data) ? availRes2.data : availRes2.data?.value || [];
            const mine = Array.isArray(mineRes2.data) ? mineRes2.data : mineRes2.data?.value || [];
            setAvailable(avail);
            setMyOrders(mine);
            return;
          }
        } catch (loginErr) {
          console.error('Auto-login failed', loginErr);
          toast('No token provided — showing demo data');
          setAvailable(demoAvailable);
          setMyOrders(demoMyOrders);
          return;
        }
      }
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

  const groupedAvailable = useMemo(() => {
    const map = {};
    (available || []).forEach((o) => {
      const r = o.restaurantId?.name || o.restaurantName || 'Unknown Restaurant';
      if (!map[r]) map[r] = [];
      map[r].push(o);
    });
    return map;
  }, [available]);

  const currentOrder = useMemo(() => {
    if ((myOrders || []).length) return myOrders[0];
    return null;
  }, [myOrders]);

  const [trackerT, setTrackerT] = useState(0.0);

  useEffect(() => {
    if (!currentOrder) {
      setTrackerT(0.0);
      return;
    }

    const status = currentOrder.status;
    if (status === "On the way") {
      const interval = setInterval(() => {
        setTrackerT((prev) => {
          if (prev >= 1.0) {
            return 0.0;
          }
          return prev + 0.005;
        });
      }, 80);
      return () => clearInterval(interval);
    } else if (status === "Delivered") {
      setTrackerT(1.0);
    } else {
      setTrackerT(0.0);
    }
  }, [currentOrder?.status, currentOrder?._id]);

  const { x, y, angle } = useMemo(() => getRoutePoint(trackerT), [trackerT]);

  const trackingText = useMemo(() => {
    if (!currentOrder) return "";
    const status = currentOrder.status;
    if (status === "On the way") {
      const remainingKm = ((1 - trackerT) * 5.7).toFixed(1);
      const eta = Math.ceil((1 - trackerT) * 15);
      return `On the way • ETA: ${eta} mins (${remainingKm} km left)`;
    } else if (status === "Delivered") {
      return "Order delivered successfully!";
    } else {
      return "At Restaurant • Waiting for pickup";
    }
  }, [currentOrder?.status, trackerT]);

  const stats = useMemo(() => {
    const myCompleted = myOrders.filter(o => o.status === "Delivered");
    const myActive = myOrders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
    const completedCount = myCompleted.length;
    const activeCount = myActive.length;
    const revenue = myCompleted.reduce((s, o) => s + Number(o.total || o.amount || 0), 0);
    return { totalOrders: completedCount, activeOrders: activeCount, revenue, avgDeliveryTime: 32 };
  }, [myOrders]);

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

  const earnings = useMemo(() => {
    const total = stats.revenue || 0;
    const base = Math.round(total * 0.6);
    const incentives = Math.round(total * 0.25);
    const tips = Math.round(total * 0.15);
    return { total, base, incentives, tips };
  }, [stats]);

  const summary = useMemo(() => {
    return {
      completed: statusCounts['Delivered'] || 0,
      cancelled: statusCounts['Cancelled'] || 0,
      acceptanceRate: 96,
      onTime: 92,
      hoursOnline: '6h 45m',
    };
  }, [statusCounts]);

  const incentive = useMemo(() => ({ target: 15, done: 10, percent: Math.round((10 / 15) * 100) }), []);

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

      <section className="rh-stats">
        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">📦</div>
            <div className="metric-value">
              <h3>{stats.totalOrders}</h3>
              <div className="metric-change muted">{stats.totalOrders} completed</div>
            </div>
          </div>
          <p className="label">Total Deliveries</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">💵</div>
            <div className="metric-value">
              <h3>{fmtMoney(stats.revenue)}</h3>
              <div className="metric-change muted">{Math.round(Math.random()*30)}% vs yesterday</div>
            </div>
          </div>
          <p className="label">Revenue</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">🚚</div>
            <div className="metric-value">
              <h3>{stats.activeOrders}</h3>
              <div className="metric-change muted">Live in progress</div>
            </div>
          </div>
          <p className="label">Active Orders</p>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div className="metric-icon">⏱️</div>
            <div className="metric-value">
              <h3>{stats.avgDeliveryTime} min</h3>
              <div className="metric-change muted">{Math.round(Math.random()*10)} min from yesterday</div>
            </div>
          </div>
          <p className="label">Avg. Delivery Time</p>
        </div>
      </section>

      <div className="online-banner card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div className="badge">You're Online</div>
            <div className="muted" style={{marginTop:6}}>Orders will be assigned automatically</div>
          </div>
          <div>
            <img src="/src/assets/rest6.jfif" alt="rider" style={{height:72,borderRadius:8}} />
          </div>
        </div>
      </div>

      <div className="rh-grid">
        <main className="col-main">
          <div className="card current-order-card">
            <div className="card-head">
              <h3>Current Order</h3>
              <div className="card-actions">{currentOrder ? 'In progress' : 'No active delivery'}</div>
            </div>
            {currentOrder ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'start'}}>
                <div>
                  <div style={{fontWeight:800,fontSize:18}}>{currentOrder.restaurantName || currentOrder.restaurantId?.name}</div>
                  <div className="muted" style={{marginTop:6}}>{currentOrder.orderCode || currentOrder._id}</div>

                  <div style={{marginTop:12}}>
                    <div className="muted">Pickup</div>
                    <div style={{fontWeight:700}}>{currentOrder.address || currentOrder.restaurantAddress || 'Restaurant address'}</div>
                    <div className="distance muted">2.1 km</div>
                  </div>

                  <div style={{marginTop:12}}>
                    <div className="muted">Dropoff</div>
                    <div style={{fontWeight:700}}>{currentOrder.userId?.name || currentOrder.user?.name || 'Customer'}</div>
                    <div className="muted">{currentOrder.address || '-'} • 5.7 km</div>
                  </div>

                  <div style={{marginTop:14}}>
                    <div className="muted">Order Amount</div>
                    <div style={{fontWeight:800,fontSize:18}}>{fmtMoney(currentOrder.total || currentOrder.amount)}</div>
                  </div>

                  <div style={{marginTop:12}}>
                    <button className="accept-btn">Navigate to Restaurant</button>
                  </div>
                </div>

                <div>
                  <div className="map-placeholder" style={{height:240,borderRadius:12,overflow:'hidden',position:'relative'}}>
                    <svg viewBox="0 0 300 240" style={{width:'100%',height:'100%',background:'#080f24',display:'block'}}>
                      {/* Grid Lines */}
                      {gridLines}

                      {/* City Blocks */}
                      {blocks.map((b, idx) => (
                        <g key={idx}>
                          <rect
                            x={b.x}
                            y={b.y}
                            width={b.w}
                            height={b.h}
                            rx="6"
                            fill={b.color}
                            stroke="rgba(255, 255, 255, 0.03)"
                            strokeWidth="1"
                          />
                          <text
                            x={b.x + b.w / 2}
                            y={b.y + b.h / 2 + 4}
                            fill="rgba(255, 255, 255, 0.15)"
                            fontSize="10"
                            textAnchor="middle"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {b.label}
                          </text>
                        </g>
                      ))}

                      {/* Background Road/Route Path */}
                      <path
                        d="M 40 180 C 100 40, 200 200, 260 60"
                        fill="none"
                        stroke="#1b254b"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 40 180 C 100 40, 200 200, 260 60"
                        fill="none"
                        stroke="#2e3b75"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="4 4"
                      />

                      {/* Active Route Glow & Path */}
                      {trackerT > 0 && (
                        <>
                          <path
                            d="M 40 180 C 100 40, 200 200, 260 60"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="10"
                            strokeLinecap="round"
                            opacity="0.25"
                            pathLength="100"
                            strokeDasharray={`${trackerT * 100} 100`}
                          />
                          <path
                            d="M 40 180 C 100 40, 200 200, 260 60"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="4"
                            strokeLinecap="round"
                            pathLength="100"
                            strokeDasharray={`${trackerT * 100} 100`}
                          />
                        </>
                      )}

                      {/* Restaurant Pin & Pulsing Ring */}
                      <circle cx="40" cy="180" r="10" fill="#ff7a29" opacity="0.25">
                        <animate attributeName="r" values="8;16;8" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="40" cy="180" r="4" fill="#ff7a29" />
                      <text x="40" y="186" fontSize="16" textAnchor="middle" style={{ userSelect: 'none' }}>🏪</text>

                      {/* Customer Pin & Pulsing Ring */}
                      <circle cx="260" cy="60" r="10" fill="#10b981" opacity="0.25">
                        <animate attributeName="r" values="8;16;8" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="260" cy="60" r="4" fill="#10b981" />
                      <text x="260" y="66" fontSize="16" textAnchor="middle" style={{ userSelect: 'none' }}>🏠</text>

                      {/* Rider Icon */}
                      <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
                        <text
                          x="0"
                          y="6"
                          fontSize="22"
                          textAnchor="middle"
                          transform="scale(-1, 1)"
                          style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', userSelect: 'none' }}
                        >
                          🛵
                        </text>
                      </g>
                    </svg>
                  </div>
                  <div style={{marginTop:8,fontSize:13,color:'#64748b',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>Rider: Rahul Singh</span>
                    <span style={{fontWeight:600,color:'#3b82f6'}}>{trackingText}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="muted">No active order assigned to you. Accept an order from New Orders below.</div>
            )}
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
          <div className="card new-orders">
            <div className="card-head">
              <h3>New Orders</h3>
              <div className="tab-count">{available.length}</div>
            </div>

            <div className="orders-list">
              {Object.keys(groupedAvailable).length === 0 && <div className="muted">No new orders</div>}
              {Object.entries(groupedAvailable).map(([rest, orders])=> (
                <div key={rest} className="card" style={{padding:12,borderRadius:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontWeight:800}}>{rest}</div>
                    <div className="muted">{orders.length} orders</div>
                  </div>
                  <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:8}}>
                    {orders.map((o)=> (
                      <div key={o._id||o.id} className="order-item">
                        <div className="order-left">
                          <div className="order-id">{o.orderCode || (o._id||o.id)}</div>
                          <div className="order-customer">{(o.items||[]).map(i=>i.name).slice(0,2).join(', ')}</div>
                          <div className="order-meta muted">{o.userId?.name || o.user?.name || 'Customer'}</div>
                        </div>
                        <div className="order-right">
                          <div className="order-price">{fmtMoney(o.total||o.amount)}</div>
                          <div style={{display:'flex',gap:8}}>
                            <button className="accept-btn" onClick={()=>acceptOrder(o._id||o.id)}>Accept</button>
                            <button className="btn-outline" onClick={()=>toast('Rejected')}>Reject</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <aside className="col-aside">
          <div className="card earnings card-dark">
            <h3>Today's Earnings</h3>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div className="earnings-amount">{fmtMoney(earnings.total || 1245.6)}</div>
                <div className="metric-change" style={{color:'#10b981',marginTop:6}}>▲ {fmtMoney((earnings.total||0) - (earnings.total||0)*0.22)} more than yesterday</div>
              </div>
              <div style={{textAlign:'right'}}>
                <button className="cashout-btn">Cash Out</button>
              </div>
            </div>

            <div className="earnings-breakdown" style={{marginTop:12}}>
              <div className="muted">Base Earnings <span style={{float:'right'}}>{fmtMoney(earnings.base)}</span></div>
              <div className="muted">Incentives <span style={{float:'right'}}>{fmtMoney(earnings.incentives)}</span></div>
              <div className="muted">Tips <span style={{float:'right'}}>{fmtMoney(earnings.tips)}</span></div>
            </div>
          </div>

          <div className="card summary card-dark">
            <h3>Today's Summary</h3>
            <div className="summary-row">
              <div>Completed Orders</div>
              <div><strong>{summary.completed}</strong></div>
            </div>
            <div className="summary-row">
              <div>Cancelled Orders</div>
              <div><strong>{summary.cancelled}</strong></div>
            </div>
            <div className="summary-row">
              <div>Acceptance Rate</div>
              <div><strong>{summary.acceptanceRate}%</strong></div>
            </div>
            <div className="summary-row">
              <div>On-time Delivery</div>
              <div><strong>{summary.onTime}%</strong></div>
            </div>
            <div className="summary-row">
              <div>Hours Online</div>
              <div><strong>{summary.hoursOnline}</strong></div>
            </div>
          </div>

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
                  if(parts.length===0) return '#1f2937';
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
            <div className="map-placeholder" style={{height:200,borderRadius:12,overflow:'hidden',position:'relative',background:'#080f24',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {currentOrder ? (
                <svg viewBox="0 0 300 240" style={{width:'100%',height:'100%',background:'#080f24',display:'block'}}>
                  {/* Grid Lines */}
                  {gridLines}

                  {/* City Blocks */}
                  {blocks.map((b, idx) => (
                    <g key={idx}>
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.w}
                        height={b.h}
                        rx="6"
                        fill={b.color}
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="1"
                      />
                    </g>
                  ))}

                  {/* Background Road/Route Path */}
                  <path
                    d="M 40 180 C 100 40, 200 200, 260 60"
                    fill="none"
                    stroke="#1b254b"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* Active Route Glow & Path */}
                  {trackerT > 0 && (
                    <path
                      d="M 40 180 C 100 40, 200 200, 260 60"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray={`${trackerT * 100} 100`}
                    />
                  )}

                  {/* Pins */}
                  <circle cx="40" cy="180" r="4" fill="#ff7a29" />
                  <text x="40" y="186" fontSize="16" textAnchor="middle" style={{ userSelect: 'none' }}>🏪</text>
                  <circle cx="260" cy="60" r="4" fill="#10b981" />
                  <text x="260" y="66" fontSize="16" textAnchor="middle" style={{ userSelect: 'none' }}>🏠</text>

                  {/* Rider Icon */}
                  <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
                    <text
                      x="0"
                      y="6"
                      fontSize="22"
                      textAnchor="middle"
                      transform="scale(-1, 1)"
                      style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', userSelect: 'none' }}
                    >
                      🛵
                    </text>
                  </g>
                </svg>
              ) : (
                <div className="map-pin"><FiMapPin size={28} /></div>
              )}
            </div>
            <div className="rider">
              {currentOrder ? (
                <>Rider: Rahul Singh <span className="muted" style={{marginLeft:8}}>{trackingText}</span></>
              ) : (
                <>Rider: Rahul Singh <span className="muted">ETA: 12 mins • 2.4 km away</span></>
              )}
            </div>
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

        {/* layout styles are provided by restaurant-dashboard.css from the shared layout */}
    </div>
  );
}