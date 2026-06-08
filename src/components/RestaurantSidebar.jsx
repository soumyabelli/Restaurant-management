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

  return (
    <aside className="rh-sidebar">
      <div className="rh-brand">
        <div className="rh-logo">FH</div>
        <div>
          <strong>Green Bowl Cafe</strong>
        </div>
      </div>

      <nav className="rh-nav">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`rh-nav-item ${location.pathname === item.path ? 'is-active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon} {item.name}
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
    </aside>
  );
}

export default RestaurantSidebar;
