import { useNavigate, useLocation } from "react-router-dom";
import { AiOutlineMenu, AiOutlineHome, AiOutlineShop, AiOutlineSetting, AiOutlineBell } from "react-icons/ai";
import rest1 from "../assets/rest1.jfif";

function RestaurantSidebar({ name, status = "Open" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try { user = storedUser ? JSON.parse(storedUser) : null; } catch { user = null; }
  
  const displayName = name || user?.name || 'The Coastal Kitchen';

  const menuItems = [
    // default restaurant menu (used when not in /delivery)
    { name: "Dashboard", path: "/restaurant/dashboard", icon: <AiOutlineHome /> },
    { name: "Menu Management", path: "/restaurant/menu-management", icon: <AiOutlineShop /> },
    { name: "Total Orders", path: "/restaurant/orders", icon: <AiOutlineBell /> },
    { name: "Delivery", path: "/restaurant/delivery", icon: <AiOutlineBell /> },
    { name: "Total Customers", path: "/restaurant/customers", icon: <AiOutlineBell /> },
    { name: "Reviews", path: "/restaurant/reviews", icon: <AiOutlineBell /> },
    { name: "Reviews and Ratings", path: "/restaurant/ratings", icon: <AiOutlineBell /> },
    { name: "Analytics", path: "/restaurant/analytics", icon: <AiOutlineBell /> },
    { name: "Payout", path: "/restaurant/payout", icon: <AiOutlineBell /> },
    { name: "Total Reservations", path: "/restaurant/reservations", icon: <AiOutlineMenu /> },
    { name: "Settings", path: "/restaurant/settings", icon: <AiOutlineSetting /> },
  ];

  const deliveryMenu = [
    { name: "Dashboard", path: "/delivery/dashboard", icon: <AiOutlineHome /> },
    { name: "New Orders", path: "/delivery/new-orders", icon: <AiOutlineBell />, badgeCount: 2 },
    { name: "My Deliveries", path: "/delivery/my-deliveries", icon: <AiOutlineShop /> },
    { name: "Earnings", path: "/delivery/earnings", icon: <AiOutlineBell /> },
    { name: "Wallet", path: "/delivery/wallet", icon: <AiOutlineBell /> },
    { name: "Performance", path: "/delivery/performance", icon: <AiOutlineBell /> },
    { name: "Incentives", path: "/delivery/incentives", icon: <AiOutlineBell /> },
    { name: "Help & Support", path: "/delivery/help", icon: <AiOutlineBell /> },
    { name: "Settings", path: "/delivery/settings", icon: <AiOutlineSetting /> },
  ];

  return (
    <aside className="rh-sidebar">
      <div className="rh-brand">
        <div className="rh-logo">FH</div>
        <div>
          <strong>GREEN BOWL CAFES</strong>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 14px 10px' }}>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          style={{
            border: '1px solid #e2e8f0',
            background: '#fff',
            borderRadius: 12,
            padding: '8px 12px',
            fontWeight: 800,
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <nav className="rh-nav">
        {(location.pathname.startsWith('/delivery') ? deliveryMenu : menuItems).map((item) => (
          <button
            key={item.name}
            className={`rh-nav-item ${location.pathname === item.path ? 'is-active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-left">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
            </span>
            {item.badgeCount ? <span className="nav-badge">{item.badgeCount}</span> : null}
          </button>
        ))}
      </nav>

      <div className="rh-mini-profile">
        <img src={rest1} alt="restaurant" />
        <div>
          <strong>{displayName}</strong>
          <div className="status">{status}</div>
        </div>
      </div>

      <div className="rh-refer">
        <div className="gift">🎁</div>
        <div className="refer-body">
          <div className="refer-title">Refer & Earn</div>
          <div className="muted">Invite friends and earn ₹1000 extra</div>
        </div>
      </div>
    </aside>
  );
}

export default RestaurantSidebar;
