import { Link } from 'react-router-dom'
import food2Image from '../assets/food2.png'
import '../styles/login.css'

const featureList = [
  { icon: 'FD', title: 'Fast Delivery', text: 'Real-time tracking & speedy deliveries' },
  { icon: 'TR', title: 'Table Reservations', text: 'Book your perfect table in seconds' },
  { icon: 'ET', title: 'Events & Experiences', text: 'Discover and book amazing events' },
]

function LoginPage() {
  return (
    <main className="login-page" style={{ backgroundImage: `url(${food2Image})` }}>
      <section className="login-shell">
        <aside className="promo-panel">
          <div className="promo-overlay">
            <h2 className="promo-brand">DineX</h2>
            <h1>Food, Moments, Delivered.</h1>
            <p>Your all-in-one platform for food delivery, table reservations, and exciting events near you.</p>

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

        <section className="form-panel">
          <div className="form-head">
            <button type="button" className="lang-btn">English v</button>
          </div>

          <div className="form-body">
            <h2>Welcome Back!</h2>
            <p>Login to continue your delicious journey</p>

            <label htmlFor="email">Email or Phone Number</label>
            <input id="email" type="text" placeholder="Enter your email or phone number" />

            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Enter your password" />

            <div className="remember-row">
              <label className="check-wrap">
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#">Forgot Password?</a>
            </div>

            <button type="button" className="login-btn">Login</button>

            <p className="signup-line">
              Don&apos;t have an account? <Link to="/">Sign Up</Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}

export default LoginPage
