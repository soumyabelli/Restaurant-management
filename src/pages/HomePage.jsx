import '../styles/home.css'
import heroImage from '../assets/food.png'
import { Link } from 'react-router-dom'

const topNav = [
  { icon: 'FD', label: 'Food Delivery' },
  { icon: 'TR', label: 'Table Reservations' },
  { icon: 'ET', label: 'Events & Tickets' },
  { icon: 'OF', label: 'Offers' },
]

const features = [
  {
    icon: 'FD',
    title: 'Fast Delivery',
    text: 'Real-time tracking & speedy delivery',
    color: 'orange',
  },
  {
    icon: 'TR',
    title: 'Table Reservations',
    text: 'Book your perfect table anytime',
    color: 'violet',
  },
  {
    icon: 'ET',
    title: 'Events & Tickets',
    text: 'Discover and book amazing events',
    color: 'green',
  },
  {
    icon: 'RW',
    title: 'Rewards',
    text: 'Earn points and unlock exclusive benefits',
    color: 'gold',
  },
]

function HomePage() {
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
            <a key={item.label} href="#" className="nav-pill">
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
            <article className="feature-card" key={feature.title}>
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
      </section>
    </main>
  )
}

export default HomePage

