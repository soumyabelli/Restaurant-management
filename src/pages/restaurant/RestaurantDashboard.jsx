import { useNavigate } from "react-router-dom";

function RestaurantDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 18, fontFamily: "system-ui,Segoe UI,Roboto,Arial" }}>
      <h1>Restaurant</h1>
      <p>Select a restaurant from the customer dashboard.</p>
      <button type="button" onClick={() => navigate("/customer/dashboard")}>Go to Customer Dashboard</button>
    </div>
  );
}

export default RestaurantDashboard;

