import { useState, useEffect } from "react";

function TotalReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/restaurant/reservations", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch reservations");
        }

        const json = await res.json();
        if (json.success) {
          setReservations(json.data);
        } else {
          throw new Error(json.message || "Failed to fetch reservations");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  return (
    <>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Total Reservations</h1>
        </div>
      </header>

      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#0f172a" }}>Upcoming & Past Reservations</h3>
        
        {loading && <p>Loading reservations...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {!loading && !error && reservations.length === 0 && (
          <p style={{ color: "#64748b" }}>No reservations found.</p>
        )}

        {!loading && !error && reservations.length > 0 && (
          <div className="orders-list">
            {reservations.map(res => (
              <div className="order-item" key={res.id} style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <div className="order-left" style={{ flex: "1 1 300px" }}>
                  <div className="order-id">
                    {res.customer}
                    <span style={{ fontWeight: "normal", color: "#64748b", fontSize: "14px", marginLeft: "8px" }}>
                      ({res.guests} Guests)
                    </span>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "15px", color: "#334155" }}>
                    📅 {res.date} at {res.time}
                  </div>
                  {res.tableNumber && (
                    <div style={{ marginTop: "4px", fontSize: "14px", color: "#475569" }}>
                      🪑 Table Number: {res.tableNumber}
                    </div>
                  )}
                  {res.notes && (
                    <div style={{ marginTop: "8px", fontSize: "14px", color: "#64748b", fontStyle: "italic" }}>
                      Notes: {res.notes}
                    </div>
                  )}
                </div>
                
                <div className="order-right" style={{ flex: "0 0 150px", textAlign: "right", justifyContent: "center" }}>
                  <div style={{ marginBottom: "8px", fontSize: "12px", color: "#64748b" }}>
                    ID: {res.bookingCode || res.id.slice(-6).toUpperCase()}
                  </div>
                  <div>
                    <span className="tag" style={{ 
                      background: res.status === "Confirmed" ? "#ecfdf5" : res.status === "Cancelled" ? "#fef2f2" : "#eef2ff", 
                      color: res.status === "Confirmed" ? "#065f46" : res.status === "Cancelled" ? "#991b1b" : "#1d4ed8" 
                    }}>
                      {res.status || "Reserved"}
                    </span>
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

export default TotalReservationsPage;
