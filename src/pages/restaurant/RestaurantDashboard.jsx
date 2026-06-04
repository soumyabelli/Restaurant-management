import { useNavigate } from "react-router-dom";
import rest1 from "../../assets/rest1.jfif";
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
            <strong>FoodieHub</strong>
            <small>For Restaurants</small>
          </div>
        </div>

        <nav className="rh-nav">
          <button className="rh-nav-item is-active"><AiOutlineHome /> Dashboard</button>
          <button className="rh-nav-item"><AiOutlineShop /> Menu Management</button>
          <button className="rh-nav-item"><AiOutlineBell /> Orders</button>
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
            <h1>{name}</h1>
            <div className="rh-badges">
              <span className="badge">Open</span>
              <span className="badge">{stats.totalRatings} ★</span>
            </div>
          </div>
          <div className="rh-top-right">
            <button className="btn-outline" onClick={() => navigate(`/restaurant/${user?.id || 'demo'}/menu`)}>View Restaurant Page</button>
            <button className="btn-primary">+ Add New Item</button>
          </div>
        </header>

        <section className="rh-stats">
          <div className="stat"> 
            <p className="label">Today's Orders</p>
            <h3>{stats.ordersToday}</h3>
          </div>
          <div className="stat"> 
            <p className="label">Today's Revenue</p>
            <h3>₹{stats.revenue.toLocaleString()}</h3>
          </div>
          <div className="stat"> 
            <p className="label">Avg. Prep Time</p>
            <h3>{stats.prepTime}</h3>
          </div>
          <div className="stat"> 
            <p className="label">Total Reviews</p>
            <h3>{stats.totalReviews}</h3>
          </div>
        </section>

        <section className="rh-grid">
          <div className="card live-orders">
            <h3>Live Orders</h3>
            <ul>
              <li>#ORD12345 — Priya Sharma — ₹549 — Preparing</li>
              <li>#ORD12346 — Rohit Verma — ₹279 — Ready</li>
              <li>#ORD12347 — Ananya Iyer — ₹689 — Preparing</li>
            </ul>
          </div>

          <div className="card menu-management">
            <h3>Menu Management</h3>
            <ol>
              <li>Butter Chicken — ₹320 — 125 orders</li>
              <li>Chicken Biryani — ₹290 — 98 orders</li>
              <li>Garlic Naan — ₹60 — 87 orders</li>
            </ol>
          </div>

          <div className="card summary">
            <h3>Today's Summary</h3>
            <div className="summary-row"><span>Online Orders</span><strong>22</strong></div>
            <div className="summary-row"><span>Dine-in Orders</span><strong>10</strong></div>
            <div className="summary-row"><span>Total Sales</span><strong>₹{stats.revenue.toLocaleString()}</strong></div>
          </div>
        </section>
      </main>

      <style>{`
        .rh-root{display:flex;height:100vh;font-family:system-ui,Segoe UI,Roboto,Arial;color:#0f172a}
        .rh-sidebar{width:260px;background:linear-gradient(180deg,#0f172a,#1f2937);color:#fff;padding:20px;display:flex;flex-direction:column;justify-content:space-between}
        .rh-brand{display:flex;align-items:center;gap:10px}
        .rh-logo{width:44px;height:44px;border-radius:8px;background:#ff7a59;display:grid;place-items:center;font-weight:800}
        .rh-nav{margin-top:24px;display:flex;flex-direction:column;gap:8px}
        .rh-nav-item{background:transparent;border:none;color:#cbd5e1;padding:10px 12px;border-radius:8px;text-align:left;display:flex;gap:8px;align-items:center;cursor:pointer}
        .rh-nav-item.is-active{background:#111827;color:#fff}
        .rh-mini-profile{display:flex;gap:10px;align-items:center;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px}
        .rh-mini-profile img{width:48px;height:48px;border-radius:8px;object-fit:cover}
        .rh-main{flex:1;padding:20px;overflow:auto;background:#f8fafc}
        .rh-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .rh-badges{display:flex;gap:8px;align-items:center;margin-top:6px}
        .badge{background:#eef2ff;color:#1d4ed8;padding:6px 10px;border-radius:999px;font-weight:700}
        .btn-outline{background:transparent;border:1px solid #cbd5e1;padding:8px 12px;border-radius:10px;margin-right:8px}
        .btn-primary{background:linear-gradient(135deg,#6d28d9,#0ea5e9);color:#fff;border:none;padding:8px 12px;border-radius:10px}
        .rh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
        .stat{background:#fff;padding:14px;border-radius:12px;box-shadow:0 6px 20px rgba(15,23,42,0.06)}
        .stat .label{color:#64748b;margin-bottom:8px}
        .rh-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}
        .card{background:#fff;padding:14px;border-radius:12px;box-shadow:0 6px 20px rgba(15,23,42,0.06)}
        .menu-management{grid-column:2/3}
        .summary{grid-column:2/3}
        .live-orders{grid-column:1/2}
        .summary-row{display:flex;justify-content:space-between;margin-top:8px}
        @media(max-width:900px){.rh-stats{grid-template-columns:1fr 1fr}.rh-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}

export default RestaurantDashboard;

