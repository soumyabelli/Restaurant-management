import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import food2Image from '../assets/food2.png'
import '../styles/login.css'

const featureList = [
  {
    icon: '🚀',
    title: 'Fast Delivery',
    text: 'Real-time tracking & speedy deliveries',
  },
  {
    icon: '🍽️',
    title: 'Table Reservations',
    text: 'Book your perfect table in seconds',
  },
  {
    icon: '🎟️',
    title: 'Events & Experiences',
    text: 'Discover and book amazing events',
  },
]

const roles = [
  { id: 'customer', label: 'Customer', icon: '👤' },
  { id: 'restaurant', label: 'Restaurant Owner', icon: '🍽️' },
  { id: 'delivery', label: 'Delivery', icon: '🚚' },
]

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('customer')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)

      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        { email, password, role: selectedRole }
      )

      const user = response.data?.user || response.data

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }

      const map = {
        customer: '/customer/dashboard',
        restaurant: '/restaurant/dashboard',
        delivery: '/delivery/dashboard',
        admin: '/admin/dashboard',
      }

      navigate(map[user?.role] || '/')
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-submit when navigated with prefilled credentials
    if (location?.state?.autoLogin && email && password) {
      const t = setTimeout(() => {
        handleLogin()
      }, 300)
      return () => clearTimeout(t)
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.autoLogin, email, password])

  useEffect(() => {
    // If already logged in, redirect to user's dashboard.
    // However, don't auto-redirect when user is actively on the login page
    // (so they can switch roles or sign-in as a different account).
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const user = JSON.parse(stored)
        const map = {
          customer: '/customer/dashboard',
          restaurant: '/restaurant/dashboard',
          delivery: '/delivery/dashboard',
          admin: '/admin/dashboard',
        }

        // if we're already on the login route, allow the page to stay
        if (location?.pathname === '/login') {
          return
        }

        navigate(map[user.role] || '/')
      }
    } catch (e) {
      // ignore JSON parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.pathname])

  const background = location?.state?.backgroundImage || food2Image

  return (
    <main className="login-page" style={{ backgroundImage: `url(${background})` }}>
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
                <article className="promo-item" key={item.title}>
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
            <button type="button" className="lang-btn">
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
                    className={`role-card ${selectedRole === role.id ? 'active' : ''}`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <span className="role-icon">{role.icon}</span>
                    <p>{role.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <h2>
              Welcome Back,{' '}
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}!
            </h2>

            <p>Login to continue your delicious journey</p>

            <label htmlFor="email">Email or Phone Number</label>

            <input
              id="email"
              type="text"
              placeholder="Enter your email or phone number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="remember-row">
              <label className="check-wrap">
                <input type="checkbox" /> Remember me
              </label>

              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button type="button" className="login-btn" onClick={handleLogin}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="signup-line">
              Don&apos;t have an account? <Link to="/register">Sign Up</Link>
            </p>

            <div className="admin-login">
              <span>Administrator?</span>

              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault()
                  setEmail('admin@gmail.com')
                  setPassword('123')
                }}
              >
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