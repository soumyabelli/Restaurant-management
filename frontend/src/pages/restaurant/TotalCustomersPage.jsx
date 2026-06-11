import { useState, useEffect } from "react";

function TotalCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/restaurant/customers", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch customers");
        }

        const json = await res.json();
        if (json.success) {
          setCustomers(json.data);
        } else {
          throw new Error(json.message || "Failed to fetch customers");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <>
      <header className="rh-top">
        <div className="rh-top-left">
          <h1>Total Customers</h1>
        </div>
      </header>

      <div className="card">
        <h3 style={{ marginBottom: "16px", color: "#0f172a" }}>Customer Directory</h3>
        
        {loading && <p>Loading customers...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {!loading && !error && customers.length === 0 && (
          <p style={{ color: "#64748b" }}>No customers found.</p>
        )}

        {!loading && !error && customers.length > 0 && (
          <div className="orders-list">
            {customers.map(cust => (
              <div className="order-item" key={cust.id} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                <div style={{ flex: "0 0 50px", height: "50px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#475569" }}>
                  {cust.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="order-left" style={{ flex: "1 1 200px" }}>
                  <div className="order-id" style={{ fontSize: "16px", color: "#0f172a" }}>
                    {cust.name}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "14px", color: "#64748b" }}>
                    {cust.email}
                  </div>
                  {cust.phone && (
                    <div style={{ marginTop: "2px", fontSize: "13px", color: "#94a3b8" }}>
                      📞 {cust.phone}
                    </div>
                  )}
                </div>
                
                <div className="order-right" style={{ flex: "0 0 150px", textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#4f46e5" }}>
                    ₹{cust.totalSpent.toLocaleString()}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "13px", color: "#64748b" }}>
                    {cust.totalOrders} order{cust.totalOrders !== 1 ? 's' : ''}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "11px", color: "#94a3b8" }}>
                    Last Order: {new Date(cust.lastOrderDate).toLocaleDateString()}
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

export default TotalCustomersPage;
