import '../styles/home.css';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/food.png'
import { Link } from 'react-router-dom'

import { useState } from 'react';


const topNav = [
  { label: 'Home', icon: '🏠', href: '/' },
  { label: 'Menu', icon: '📋', href: '/menu' },
  { label: 'Contact', icon: '📞', href: '/contact' },
];

// Sidebar navigation items for different sections
const sidebarNav = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Menu Management', href: '/restaurant/dashboard' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Delivery', href: '/delivery/dashboard' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Reviews', href: '/admin/reviews' },
  { label: 'Reviews and Ratings', href: '/admin/reviews-ratings' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Payout', href: '/admin/payout' },
  { label: 'Reservations', href: '/restaurant/reservations' },
  { label: 'Settings', href: '/admin/settings' },
];

const features = [
  {
    title: 'Fast Delivery',
    text: 'Get your food delivered quickly.',
    icon: '🚀',
    color: 'red',
  },
  {
    title: 'Easy Booking',
    text: 'Reserve tables with ease.',
    icon: '📅',
    color: 'blue',
  },
];



function HomePage() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);

  const handleNavClick = (item) => {
    // Navigate to the route if href exists, otherwise just set selected item for sidebar details
    if (item.href) {
      navigate(item.href);
    } else {
      setSelectedItem(item);
    }
  };

  const handleFeatureClick = (feature) => {
    setSelectedItem(feature);
  };

  return (
    <main className="dine-page" style={{ backgroundImage: `url(${heroImage})` }}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-pin">DX</span>
          <span className="brand-text">
            Dine<span>X</span>
          </span>
        </div>

        <nav className="main-nav" aria-label="Primary navigation">
          {topNav.map((item) => (
            <a key={item.label} href={item.href} className="nav-pill" onClick={(e) => { e.preventDefault(); handleNavClick(item); }}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="actions">
          <button type="button" className="ghost-btn">English v</button>
          <button type="button" className="ghost-btn">Help</button>
        </div>
      </header>

      <section className="hero-content">
        <h1>
          All Your Cravings,
          <br />
          <span>One</span> Destination
        </h1>

        <p>
          Delicious food delivery, exclusive table reservations,
          <br />
          and exciting events - all in one place.
        </p>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title} onClick={() => handleFeatureClick(feature)}>
              <div className={`feature-icon ${feature.color}`}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>

        <Link to="/login" className="cta-btn">
          Login / Get Started <span aria-hidden="true">{'->'}</span>
        </Link>

        <div className="review-card">
          <div className="avatars" aria-hidden="true">
            <span>A</span>
            <span>B</span>
            <span>C</span>
          </div>
          <div>
            <p className="stars">*****</p>
            <p>Join 2M+ happy customers and enjoy unmatched dining experiences.</p>
          </div>
        </div>

        {/* Sidebar for selected item details */}
        {selectedItem && (
          <aside className="sidebar">
            <button className="close-btn" onClick={() => setSelectedItem(null)}>✖</button>
            <h2>{selectedItem.title || selectedItem.label}</h2>
            <p>{selectedItem.text || selectedItem.helper}</p>
            {selectedItem.icon && <div className="detail-icon" style={{ fontSize: '2rem' }}>{selectedItem.icon}</div>}
          </aside>
        )}
        {/* Sidebar navigation list */}
        <nav className="sidebar-nav">
          <ul>
            {sidebarNav.map((item) => (
              <li key={item.label}>
                <a href={item.href} onClick={(e) => { e.preventDefault(); handleNavClick(item); }}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </main>
  );
}
export default HomePage;