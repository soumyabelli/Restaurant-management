import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import rest1 from "../../assets/rest1.jfif";
import rest2 from "../../assets/rest2.jfif";

function RestaurantDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try { user = storedUser ? JSON.parse(storedUser) : null; } catch { user = null; }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/restaurant/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.message || "Failed to fetch dashboard data");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: "40px", color: "red" }}>Error: {error}</div>;
  }

  if (!data) return null;

  const {
    restaurant,
    todayOrdersCount,
    yesterdayOrdersCount,
    todayRevenueSum,
    yesterdayRevenueSum,
    totalOrders,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    liveOrders,
    ordersByStatus,
    topSelling,
    revenueSeries,
  } = data;

  const name = restaurant?.name || user?.name || 'The Coastal Kitchen';
  const stats = {
    ordersToday: todayOrdersCount || 0,
    ordersYesterday: yesterdayOrdersCount || 0,
    revenue: todayRevenueSum || 0,
    revenueYesterday: yesterdayRevenueSum || 0,
    prepTime: '18 mins', // Could be dynamic if backed provides it
    totalRatings: restaurant?.rating || '4.6',
    totalReviews: 1248,
  };

  const orderChange = stats.ordersToday - stats.ordersYesterday;
  const orderChangePercent = stats.ordersYesterday ? (orderChange / stats.ordersYesterday * 100).toFixed(1) : orderChange > 0 ? 100 : 0;
  
  const revenueChange = stats.revenue - stats.revenueYesterday;
  const revenueChangePercent = stats.revenueYesterday ? (revenueChange / stats.revenueYesterday * 100).toFixed(1) : revenueChange > 0 ? 100 : 0;

  return (
    <>
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
          <button className="btn-outline" onClick={() => navigate(`/restaurant/${restaurant?.id || 'demo'}/menu`)}>View Restaurant Page</button>
          <button className="btn-primary">+ Add New Items to the Restaurants</button>
        </div>
      </header>

      <section className="rh-stats">
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">🧾</div>
            <div className="metric-value"> 
              <h3>{stats.ordersToday}</h3>
              <div className={`metric-change ${orderChange >= 0 ? 'positive' : 'negative'}`}>
                {orderChange >= 0 ? '▲' : '▼'} {Math.abs(orderChange)} <small>vs yesterday</small>
              </div>
            </div>
          </div>
          <p className="label">Today's Orders</p>
        </div>
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">💵</div>
            <div className="metric-value"> 
              <h3>₹{stats.revenue.toLocaleString()}</h3>
              <div className={`metric-change ${revenueChange >= 0 ? 'positive' : 'negative'}`}>
                {revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChangePercent)}% <small>vs yesterday</small>
              </div>
            </div>
          </div>
          <p className="label">Today's Revenue</p>
        </div>
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">⏱️</div>
            <div className="metric-value"> 
              <h3>{stats.prepTime}</h3>
              <div className="metric-change negative">▼ 2 mins <small> yesterday</small></div>
            </div>
          </div>
          <p className="label">Average Prep Time</p>
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
              <button className="tab active">New <span className="tab-count">{ordersByStatus.new || 0}</span></button>
              <button className="tab">Preparing <span className="tab-count">{ordersByStatus.preparing || 0}</span></button>
              <button className="tab">Ready <span className="tab-count">{ordersByStatus.ready || 0}</span></button>
              <button className="tab">Out for Delivery <span className="tab-count">{ordersByStatus.delivery || 0}</span></button>
            </div>
          </div>

          <div className="orders-list">
            {liveOrders && liveOrders.length > 0 ? (
              liveOrders.map(order => (
                <div className="order-item" key={order.id}>
                  <div className="order-left">
                    <div className="order-id">{order.orderCode}</div>
                    <div className="order-customer">{order.customer}</div>
                    <div className="order-items">{order.items}</div>
                    <div className="order-meta"><span className="tag">Delivery</span> <span className="distance">{order.status}</span></div>
                  </div>
                  <div className="order-right">
                    <div className="order-price">{order.amount}</div>
                    <button className="accept-btn">
                      {order.status === 'Confirmed' ? 'Accept' : order.status}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No live orders at the moment.</div>
            )}
          </div>
        </div>

        <div className="card menu-management">
          <div className="menu-top">
            <h3>Menu Management</h3>
            <button className="view-menu" onClick={() => navigate('/restaurant/menu-management')}>View Menu</button>
          </div>

          <div className="menu-counts">
            <div className="count-box total">
              <div className="num">{restaurant?.menu?.length || 0}</div>
              <div className="txt">Total Items</div>
            </div>
            <div className="count-box active">
              <div className="num">{restaurant?.menu?.filter(i => i.active !== false).length || 0}</div>
              <div className="txt">Active Items</div>
            </div>
            <div className="count-box out">
              <div className="num">0</div>
              <div className="txt">Out of Stock</div>
            </div>
            <div className="count-box inactive">
              <div className="num">{restaurant?.menu?.filter(i => i.active === false).length || 0}</div>
              <div className="txt">Inactive Items</div>
            </div>
          </div>

          <div className="top-selling">
            <ol>
              {topSelling && topSelling.length > 0 ? (
                topSelling.map((item, idx) => (
                  <li key={idx}>
                    <div style={{ fontSize: "24px", width: "56px", height: "56px", display: "grid", placeItems: "center", background: "#f1f5f9", borderRadius: "8px" }}>
                      {item.emoji || '🍽️'}
                    </div>
                    <div className="item-body">
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">{item.orders} orders • ₹{item.price}</div>
                    </div>
                  </li>
                ))
              ) : (
                <li>No top selling items yet.</li>
              )}
            </ol>

            <div className="add-new">+ Add New Item</div>
          </div>
        </div>

        <div className="card summary">
          <h3>Today's Summary</h3>
          <div className="summary-row"><span>Online Orders</span><strong>{stats.ordersToday}</strong></div>
          <div className="summary-row"><span>Dine-in Orders</span><strong>0</strong></div>
          <div className="summary-row"><span>Total Sales</span><strong>₹{stats.revenue.toLocaleString()}</strong></div>
          <div className="summary-row"><span>Total Orders</span><strong>{stats.ordersToday}</strong></div>
          <div className="summary-row"><span>Cancelled Orders</span><strong className="text-danger">{cancelledOrders || 0}</strong></div>
          <div className="summary-row"><span>Net Earnings</span><strong className="text-success">₹{(stats.revenue * 0.95).toLocaleString()}</strong></div>
        </div>
      </section>
    </>
  );
}

export default RestaurantDashboard;
