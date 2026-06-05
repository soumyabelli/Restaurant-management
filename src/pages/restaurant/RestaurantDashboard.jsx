import { useNavigate } from "react-router-dom";
import rest1 from "../../assets/rest1.jfif";
import rest2 from "../../assets/rest2.jfif";
import { AiOutlineMenu, AiOutlineHome, AiOutlineShop, AiOutlineSetting, AiOutlineBell } from "react-icons/ai";

function RestaurantDashboard() {
  const navigate = useNavigate();

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try { user = storedUser ? JSON.parse(storedUser) : null; } catch { user = null; }

  const name = user?.name || 'The Coastal Kitchen';
  const rating = user?.rating || '4.6';

  const stats = {
    ordersToday: 32,
    revenue: 24680,
    prepTime: '18 mins',
    totalRatings: rating,
    totalReviews: 1248,
  };

  return (
    <div className="rh-root">
      <aside className="rh-sidebar">
        <div className="rh-brand">
          <div className="rh-logo">FH</div>
          <div>
            <strong>Green Bowl Cafe</strong>
          </div>
        </div>

        <nav className="rh-nav">
          <button className="rh-nav-item is-active"><AiOutlineHome /> Dashboard</button>
          <button className="rh-nav-item"><AiOutlineShop /> Menu Management</button>
          <button className="rh-nav-item"><AiOutlineBell /> Orders</button>
          <button className="rh-nav-item"><AiOutlineBell /> Delivery</button>
          <button className="rh-nav-item"><AiOutlineBell /> Customers</button>
          <button className="rh-nav-item"><AiOutlineBell /> Reviews</button>
          <button className="rh-nav-item"><AiOutlineBell /> Reviews and Ratings</button>
          <button className="rh-nav-item"><AiOutlineBell /> Analytics</button>
          <button className="rh-nav-item"><AiOutlineBell /> Payout</button>
          <button className="rh-nav-item"><AiOutlineMenu /> Reservations</button>
          <button className="rh-nav-item"><AiOutlineSetting /> Settings</button>
        </nav>

        <div className="rh-mini-profile">
          <img src={rest1} alt="restaurant" />
          <div>
            <strong>{name}</strong>
            <div className="status">Open</div>
          </div>
        </div>
      </aside>

      <main className="rh-main">
        <header className="rh-top">
          <div className="rh-top-left">
            <div className="rh-header-restaurant">
              <img src={rest1} alt="restaurant" className="rest-avatar" />
              <div>
                <h1>{name}</h1>
                <div className="rh-badges">
                  <span className="badge">Open</span>
                  <span className="badge">{stats.totalRatings} ★</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rh-top-right">
            <button className="btn-outline" onClick={() => navigate(`/restaurant/${user?.id || 'demo'}/menu`)}>View Restaurant Page</button>
            <button className="btn-primary">+ Add New Item</button>
          </div>
        </header>

        <section className="rh-stats">
          <div className="stat"> 
            <div className="stat-top">
              <div className="metric-icon">🧾</div>
              <div className="metric-value"> 
                <h3>{stats.ordersToday}</h3>
                <div className="metric-change positive">▲ 23% <small>vs yesterday</small></div>
              </div>
            </div>
            <p className="label">Today's Orders</p>
          </div>
          <div className="stat"> 
            <div className="stat-top">
              <div className="metric-icon">💵</div>
              <div className="metric-value"> 
                <h3>₹{stats.revenue.toLocaleString()}</h3>
                <div className="metric-change positive">▲ 18.6% <small>vs yesterday</small></div>
              </div>
            </div>
            <p className="label">Today's Revenue</p>
          </div>
          <div className="stat"> 
            <div className="stat-top">
              <div className="metric-icon">⏱️</div>
              <div className="metric-value"> 
                <h3>{stats.prepTime}</h3>
                <div className="metric-change negative">▼ 2 mins <small>vs yesterday</small></div>
              </div>
            </div>
            <p className="label">Avg. Prep Time</p>
          </div>
          <div className="stat"> 
            <div className="stat-top">
              <div className="metric-icon">⭐</div>
              <div className="metric-value"> 
                <h3>{stats.totalRatings}</h3>
                <div className="metric-change positive">▲ 0.2 <small>vs last 7 days</small></div>
              </div>
            </div>
            <p className="label">Total Ratings</p>
          </div>
        </section>

        <section className="rh-grid">
          <div className="card live-orders">
            <div className="card-header">
              <h3>Live Orders</h3>
              <div className="tabs">
                <button className="tab active">New <span className="tab-count">4</span></button>
                <button className="tab">Preparing <span className="tab-count">5</span></button>
                <button className="tab">Ready <span className="tab-count">2</span></button>
                <button className="tab">Out for Delivery <span className="tab-count">1</span></button>
              </div>
            </div>

            <div className="orders-list">
              <div className="order-item">
                <div className="order-left">
                  <div className="order-id">#ORD12345</div>
                  <div className="order-customer">Priya Sharma</div>
                  <div className="order-items">2 x Butter Chicken, 1 x Garlic Naan</div>
                  <div className="order-meta"><span className="tag">Delivery</span> <span className="distance">2.4 km away</span></div>
                </div>
                <div className="order-right">
                  <div className="order-price">₹549</div>
                  <button className="accept-btn">Accept</button>
                </div>
              </div>

              <div className="order-item">
                <div className="order-left">
                  <div className="order-id">#ORD12346</div>
                  <div className="order-customer">Rohit Verma</div>
                  <div className="order-items">1 x Veg Biryani, 1 x Raita</div>
                  <div className="order-meta"><span className="tag">Delivery</span> <span className="distance">1.8 km away</span></div>
                </div>
                <div className="order-right">
                  <div className="order-price">₹279</div>
                  <button className="accept-btn">Accept</button>
                </div>
              </div>

              <div className="order-item">
                <div className="order-left">
                  <div className="order-id">#ORD12347</div>
                  <div className="order-customer">Ananya Iyer</div>
                  <div className="order-items">1 x Prawn Curry, 2 x Steamed Rice</div>
                  <div className="order-meta"><span className="tag">Delivery</span> <span className="distance">3.1 km away</span></div>
                </div>
                <div className="order-right">
                  <div className="order-price">₹689</div>
                  <button className="accept-btn">Accept</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card menu-management">
            <div className="menu-top">
              <h3>Menu Management</h3>
              <button className="view-menu">View Menu</button>
            </div>

            <div className="menu-counts">
              <div className="count-box total">
                <div className="num">120</div>
                <div className="txt">Total Items</div>
              </div>
              <div className="count-box active">
                <div className="num">85</div>
                <div className="txt">Active Items</div>
              </div>
              <div className="count-box out">
                <div className="num">15</div>
                <div className="txt">Out of Stock</div>
              </div>
              <div className="count-box inactive">
                <div className="num">20</div>
                <div className="txt">Inactive Items</div>
              </div>
            </div>

            <div className="top-selling">
              <ol>
                <li>
                  <img src={rest2} alt="item" />
                  <div className="item-body">
                    <div className="item-name">Butter Chicken</div>
                    <div className="item-meta">125 orders • ₹320</div>
                  </div>
                </li>
                <li>
                  <img src={rest2} alt="item" />
                  <div className="item-body">
                    <div className="item-name">Chicken Biryani</div>
                    <div className="item-meta">98 orders • ₹290</div>
                  </div>
                </li>
                <li>
                  <img src={rest2} alt="item" />
                  <div className="item-body">
                    <div className="item-name">Garlic Naan</div>
                    <div className="item-meta">87 orders • ₹60</div>
                  </div>
                </li>
              </ol>

              <div className="add-new">+ Add New Item</div>
            </div>
          </div>

          <div className="card summary">
            <h3>Today's Summary</h3>
            <div className="summary-row"><span>Online Orders</span><strong>22</strong></div>
            <div className="summary-row"><span>Dine-in Orders</span><strong>10</strong></div>
            <div className="summary-row"><span>Total Sales</span><strong>₹{stats.revenue.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Total Orders</span><strong>32</strong></div>
            <div className="summary-row"><span>Cancelled Orders</span><strong className="text-danger">2 • ₹680</strong></div>
            <div className="summary-row"><span>Net Earnings</span><strong className="text-success">₹23,450</strong></div>
          </div>
        </section>
      </main>

      <style>{`
        .rh-root{display:flex;height:100vh;font-family:Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;color:#0f172a;background:#f8fafc}
        .rh-sidebar{width:280px;background:linear-gradient(180deg,#0b1226 0%, #2b0f6f 100%);color:#fff;padding:24px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:6px 0 30px rgba(11,17,38,0.4);border-right:1px solid rgba(255,255,255,0.03)}
        .rh-brand{display:flex;align-items:center;gap:12px}
        .rh-logo{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ff7a59,#ffb86b);display:grid;place-items:center;font-weight:800;box-shadow:0 6px 18px rgba(255,122,89,0.25)}
        .rh-nav{margin-top:28px;display:flex;flex-direction:column;gap:8px}
        .rh-nav-item{background:transparent;border:none;color:rgba(255,255,255,0.85);padding:12px 14px;border-radius:10px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;transition:background .18s,transform .12s}
        .rh-nav-item:hover{background:rgba(255,255,255,0.04);transform:translateX(4px)}
        .rh-nav-item.is-active{background:linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.03)}
        .rh-mini-profile{display:flex;gap:12px;align-items:center;padding:12px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border-radius:10px}
        .rh-mini-profile img{width:56px;height:56px;border-radius:10px;object-fit:cover;box-shadow:0 6px 18px rgba(2,6,23,0.4)}
        .rh-main{flex:1;padding:28px;overflow:auto;background:linear-gradient(180deg,#f6f8fb 0%, #ffffff 100%)}
        .rh-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .rh-header-restaurant{display:flex;gap:12px;align-items:center}
        .rest-avatar{width:56px;height:56px;border-radius:12px;object-fit:cover;box-shadow:0 6px 18px rgba(2,6,23,0.12)}
        .rh-top-left h1{font-size:20px;margin:0;letter-spacing:-0.2px;color:#0f172a}
        .rh-badges{display:flex;gap:10px;align-items:center;margin-top:6px}
        .badge{padding:6px 12px;border-radius:999px;font-weight:700;font-size:13px;display:inline-block}
        .badge:first-child{background:#ecfdf5;color:#065f46}
        .badge:nth-child(2){background:linear-gradient(90deg,#7c3aed,#06b6d4);color:#fff;box-shadow:0 6px 18px rgba(99,102,241,0.12)}
        .btn-outline{background:transparent;border:1px solid #e6eef7;padding:9px 14px;border-radius:10px;margin-right:8px;color:#0f172a}
        .btn-primary{background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;padding:9px 14px;border-radius:10px;box-shadow:0 8px 22px rgba(99,102,241,0.12)}

        /* Metric widgets */
        .rh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}
        .stat{background:#fff;padding:16px;border-radius:14px;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid rgba(15,23,42,0.03)}
        .stat-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}
        .metric-icon{width:44px;height:44px;border-radius:10px;background:#f8fafc;display:grid;place-items:center;font-size:18px}
        .metric-value h3{margin:0;font-size:20px;font-weight:800}
        .metric-change{font-size:12px;color:#16a34a;margin-top:6px}
        .metric-change.negative{color:#ef4444}
        .metric-change small{color:#94a3b8;margin-left:6px}
        .stat .label{color:#64748b;margin-top:6px;font-weight:600}

        /* Grid and cards */
        .rh-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:start}
        .card{background:#fff;padding:18px;border-radius:14px;box-shadow:0 10px 30px rgba(15,23,42,0.06);border:1px solid rgba(15,23,42,0.03);transition:transform .12s,box-shadow .12s}
        .card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(2,6,23,0.08)}

        /* Live orders */
        .live-orders{position:relative;overflow:visible}
        .live-orders::before{content:"";position:absolute;left:0;top:0;height:100%;width:6px;border-radius:8px;background:linear-gradient(180deg,#06b6d4,#7c3aed)}
        .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .tabs{display:flex;gap:8px}
        .tab{background:transparent;border:none;padding:8px 10px;border-radius:8px;color:#64748b;cursor:pointer}
        .tab.active{color:#6d28d9;border-bottom:2px solid rgba(124,58,237,0.18)}
        .tab-count{background:#fff;padding:4px 8px;border-radius:999px;margin-left:8px;font-weight:700;color:#6d28d9;border:1px solid rgba(124,58,237,0.06)}

        .orders-list{display:flex;flex-direction:column;gap:10px}
        .order-item{display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:10px;border:1px solid #f1f5f9;background:#fff}
        .order-left{max-width:70%}
        .order-id{font-weight:800;color:#0f172a}
        .order-customer{font-weight:700;color:#334155;margin-top:4px}
        .order-items{color:#64748b;font-size:13px;margin-top:6px}
        .order-meta{margin-top:8px;color:#94a3b8;font-size:13px}
        .tag{background:#eef2ff;color:#1d4ed8;padding:4px 8px;border-radius:999px;margin-right:8px;font-weight:700}
        .distance{font-size:13px;color:#64748b}

        .order-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
        .order-price{font-weight:800;color:#0f172a}
        .accept-btn{background:linear-gradient(135deg,#7c3aed,#06b6d4);border:none;color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;box-shadow:0 8px 22px rgba(99,102,241,0.12)}

        /* Menu management */
        .menu-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .view-menu{background:transparent;border:none;color:#6d28d9;font-weight:700;cursor:pointer}
        .menu-counts{display:flex;gap:10px;margin-bottom:12px}
        .count-box{background:#fff;padding:10px;border-radius:10px;box-shadow:0 6px 18px rgba(15,23,42,0.04);border:1px solid rgba(15,23,42,0.03);text-align:center;flex:1}
        .count-box .num{font-weight:800;color:#0f172a;font-size:18px}
        .count-box .txt{font-size:12px;color:#64748b;margin-top:6px}
        .count-box.total{background:linear-gradient(180deg,#eef2ff,#f9fafb)}
        .count-box.active{background:linear-gradient(180deg,#ecfdf5,#f9fff9)}
        .count-box.out{background:linear-gradient(180deg,#fff7ed,#fffaf0)}
        .count-box.inactive{background:linear-gradient(180deg,#fff1f2,#fff7f9)}

        .top-selling ol{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
        .top-selling li{display:flex;gap:12px;align-items:center;background:#fff;padding:8px;border-radius:10px;border:1px solid #f1f5f9}
        .top-selling img{width:56px;height:56px;border-radius:8px;object-fit:cover}
        .item-body .item-name{font-weight:700}
        .item-meta{color:#94a3b8;font-size:13px;margin-top:6px}
        .add-new{margin-top:12px;padding:10px;border-radius:10px;border:1px dashed #e6eef7;color:#6d28d9;text-align:center;cursor:pointer}

        .text-danger{color:#ef4444;font-weight:700}
        .text-success{color:#059669;font-weight:700}

        .summary-row{display:flex;justify-content:space-between;margin-top:10px;color:#475569}
        @media(max-width:1000px){.rh-stats{grid-template-columns:1fr 1fr}.rh-grid{grid-template-columns:1fr}.rh-sidebar{display:none}.rh-root{height:auto}}
      `}</style>
    </div>
  );
}

export default RestaurantDashboard;

