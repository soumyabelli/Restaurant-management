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

const roleContent = {
  customer: {
    title: 'Food, Moments, Delivered.',
    description: 'Your all-in-one platform for food delivery, table reservations, and exciting events near you.',
    bg: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
    bgImage: food2Image,
    features: [
      { icon: '🚀', title: 'Fast Delivery', text: 'Real-time tracking & speedy deliveries' },
      { icon: '🍽️', title: 'Table Reservations', text: 'Book your perfect table in seconds' },
      { icon: '🎟️', title: 'Events & Experiences', text: 'Discover and book amazing events' },
    ],
    welcomeTitle: 'Welcome Back, Customer!',
    welcomeSub: 'Login to continue your delicious journey',
    labelEmail: 'Email or Phone Number',
    placeholderEmail: 'Enter your email or phone number',
    signupLabel: "Don't have an account? Sign Up",
    signupLink: '/register',
    autofillLabel: 'Autofill Customer Acc',
    autofillEmail: 'customer@gmail.com'
  },
  restaurant: {
    title: 'Scale Your Restaurant Business.',
    description: 'Manage incoming orders, configure food menus, track daily statistics, and read reviews.',
    bg: 'linear-gradient(135deg, rgba(8, 17, 39, 0.95) 0%, rgba(10, 160, 111, 0.95) 100%)',
    bgImage: '/src/assets/rest6.jfif',
    features: [
      { icon: '📊', title: 'Merchant Analytics', text: 'View revenue trends and dashboard stats' },
      { icon: '📜', title: 'Menu Manager', text: 'Instantly add, remove or edit food items' },
      { icon: '💬', title: 'Customer Feedback', text: 'Respond directly to reviews and ratings' },
    ],
    welcomeTitle: 'Partner Dashboard Login',
    welcomeSub: 'Access your kitchen orders and store management',
    labelEmail: 'Merchant Email Address',
    placeholderEmail: 'merchant@restaurant.com',
    signupLabel: "Partner with DineX? Register Restaurant",
    signupLink: '#',
    autofillLabel: 'Autofill Merchant Acc',
    autofillEmail: 'rest1@gmail.com'
  },
  delivery: {
    title: 'Deliver Fast Food. Ride & Earn.',
    description: 'Deliver orders, navigate efficiently with live GPS routing, and manage your credit earnings wallet.',
    bg: 'linear-gradient(135deg, rgba(11, 18, 36, 0.95) 0%, rgba(245, 158, 11, 0.95) 100%)',
    bgImage: '/src/assets/rest6.jfif',
    features: [
      { icon: '🛵', title: 'Fast Food Delivery', text: 'Accept nearby ready orders immediately' },
      { icon: '🗺️', title: 'GPS Route Tracker', text: 'Smooth coordinate Bezier curve routing' },
      { icon: '👛', title: 'Rider Wallet', text: 'Cash out your balance to bank accounts instantly' },
    ],
    welcomeTitle: 'Rider Portal Login',
    welcomeSub: 'Go online, accept orders, and track your wallet payout',
    labelEmail: 'Rider Mobile / Email',
    placeholderEmail: 'rider@delivery.com',
    signupLabel: "Become a rider partner? Apply Here",
    signupLink: '#',
    autofillLabel: 'Autofill Rider Acc',
    autofillEmail: 'delivery@gmail.com'
  }
};

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('customer')
  const [activeContent, setActiveContent] = useState(roleContent.customer)
  const [fade, setFade] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleRoleChange = (role) => {
    if (role === selectedRole) return;
    setFade(false);
    setTimeout(() => {
      setSelectedRole(role);
      setActiveContent(roleContent[role]);
      setFade(true);
    }, 200);
  };

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
    <main 
      className="login-page" 
      style={{ 
        backgroundImage: `url(${activeContent.bgImage})`, 
        transition: 'background-image 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: activeContent.bg, 
          opacity: 0.85, 
          transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none'
        }} 
      />
      <section className="login-shell">
        {/* LEFT SIDE */}
        <aside 
          className="promo-panel"
          style={{ 
            opacity: fade ? 1 : 0, 
            transform: fade ? 'translateX(0)' : 'translateX(-12px)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 2
          }}
        >
          <div className="promo-overlay">
            <h2 className="promo-brand">DineX</h2>

            <h1>{activeContent.title}</h1>

            <p>{activeContent.description}</p>

            <div className="promo-features">
              {activeContent.features.map((item) => (
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
        <section className="form-panel" style={{ zIndex: 2 }}>
          <div className="form-head">
            <button type="button" className="lang-btn">
              English ▼
            </button>
          </div>

          <div 
            className="form-body"
            style={{ 
              opacity: fade ? 1 : 0, 
              transform: fade ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >

            {/* ROLE SELECTOR */}
            <div className="role-selector">
              <h3>Choose Your Role</h3>

              <div className="role-grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-card ${selectedRole === role.id ? 'active' : ''}`}
                    onClick={() => handleRoleChange(role.id)}
                    style={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: selectedRole === role.id ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: selectedRole === role.id ? '0 10px 20px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <span className="role-icon">{role.icon}</span>
                    <p>{role.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <h2>
              {activeContent.welcomeTitle}
            </h2>

            <p>{activeContent.welcomeSub}</p>

            <label htmlFor="email">{activeContent.labelEmail}</label>

            <input
              id="email"
              type="text"
              placeholder={activeContent.placeholderEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ transition: 'all 0.3s ease' }}
            />

            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ transition: 'all 0.3s ease' }}
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
              {activeContent.signupLabel.split('?')[0]}? <Link to={activeContent.signupLink}>{activeContent.signupLabel.split('?')[1] || 'Sign Up'}</Link>
            </p>

            <div className="admin-login" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '24px' }}>
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>Quick Test:</span>
                <button
                  type="button"
                  style={{ marginLeft: '6px', fontWeight: '700', color: '#ff6b35', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setEmail(activeContent.autofillEmail);
                    setPassword('123');
                  }}
                >
                  {activeContent.autofillLabel}
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Admin Portal?{' '}
                <button
                  type="button"
                  style={{ color: '#9ca3af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setEmail('admin@gmail.com');
                    setPassword('123');
                    handleRoleChange('customer');
                  }}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default LoginPage