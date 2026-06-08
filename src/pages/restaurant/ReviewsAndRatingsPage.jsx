import { useState, useEffect } from "react";

function ReviewsAndRatingsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/restaurant/reviews", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const json = await res.json();
        if (json.success) {
          setReviews(json.data);
        } else {
          throw new Error(json.message || "Failed to fetch reviews");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Reviews & Ratings</h1>
        </div>
      </header>

      <section className="rh-stats" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "20px" }}>
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">⭐</div>
            <div className="metric-value"> 
              <h3>{averageRating}</h3>
            </div>
          </div>
          <p className="label">Average Rating</p>
        </div>
        <div className="stat"> 
          <div className="stat-top">
            <div className="metric-icon">📝</div>
            <div className="metric-value"> 
              <h3>{reviews.length}</h3>
            </div>
          </div>
          <p className="label">Total Reviews</p>
        </div>
      </section>

      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#0f172a" }}>Customer Reviews</h3>
        
        {loading && <p>Loading reviews...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {!loading && !error && reviews.length === 0 && (
          <p style={{ color: "#64748b" }}>No reviews found.</p>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="orders-list">
            {reviews.map(review => (
              <div className="order-item" key={review.id} style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ flex: "0 0 50px", height: "50px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#475569" }}>
                  {review.customerAvatar ? (
                    <img src={review.customerAvatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    review.customerName.charAt(0).toUpperCase()
                  )}
                </div>
                
                <div className="order-left" style={{ flex: "1 1 300px" }}>
                  <div className="order-id" style={{ fontSize: "16px", color: "#0f172a" }}>
                    {review.customerName}
                    <span style={{ fontWeight: "normal", color: "#64748b", fontSize: "12px", marginLeft: "8px" }}>
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ marginTop: "6px", display: "flex", gap: "2px" }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < review.rating ? "#eab308" : "#cbd5e1", fontSize: "16px" }}>★</span>
                    ))}
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "15px", color: "#334155", lineHeight: "1.5" }}>
                    "{review.comment}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ReviewsAndRatingsPage;
