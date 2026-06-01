import { useState } from 'react'
import { Link } from 'react-router-dom'
import food2Image from '../assets/food2.png'
import '../styles/login.css'

const featureList = [
  {
    icon: 'FD',
    title: 'Fast Delivery',
    text: 'Real-time tracking & speedy deliveries',
  },
  {
    icon: 'TR',
    title: 'Table Reservations',
    text: 'Book your perfect table in seconds',
  },
  {
    icon: 'ET',
    title: 'Events & Experiences',
    text: 'Discover and book amazing events',
  },
]

const roles = [
  {
    id: 'customer',
    label: 'Customer',
    icon: '👤',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: '🍽️',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    icon: '🚚',
  },
]

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('customer')

  return (
    <main
      className="login-page"
      style={{ backgroundImage: `url(${food2Image})` }}
    >
      <section className="login-shell">
        {/* LEFT SIDE */}
        <aside className="promo-panel">
          <div className="promo-overlay">
            <h2 className="promo-brand">DineX</h2>

            <h1>Food, Moments, Delivered.</h1>

            <p>
              Your all-in-one platform for food delivery,
              table reservations, and exciting events near
              you.
            </p>

            <div className="promo-features">
              {featureList.map((item) => (
                <article
                  className="promo-item"
                  key={item.title}
                >
                  <span>{item.icon}</span>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE */}
        <section className="form-panel">
          <div className="form-head">
            <button
              type="button"
              className="lang-btn"
            >
              English ▼
            </button>
          </div>

          <div className="form-body">

            {/* ROLE SELECTOR */}
            <div className="role-selector">
              <h3>Choose Your Role</h3>

              <div className="role-grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-card ${
                      selectedRole === role.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedRole(role.id)
                    }
                  >
                    <span className="role-icon">
                      {role.icon}
                    </span>

                    <p>{role.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <h2>
              Welcome Back,{' '}
              {selectedRole.charAt(0).toUpperCase() +
                selectedRole.slice(1)}
              !
            </h2>

            <p>
              Login to continue your delicious
              journey
            </p>

            <label htmlFor="email">
              Email or Phone Number
            </label>

            <input
              id="email"
              type="text"
              placeholder="Enter your email or phone number"
            />

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
            />

            <div className="remember-row">
              <label className="check-wrap">
                <input type="checkbox" />
                Remember me
              </label>

              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button
              type="button"
              className="login-btn"
            >
              Login as{' '}
              {selectedRole.charAt(0).toUpperCase() +
                selectedRole.slice(1)}
            </button>

            <p className="signup-line">
              Don&apos;t have an account?{' '}
              <Link to="/register">
                Sign Up
              </Link>
            </p>

            <div className="admin-login">
              <span>Administrator?</span>

              <Link to="/admin/login">
                Admin Login
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default LoginPage