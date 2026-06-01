import { useEffect, useState } from "react";

function CustomerDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div>
      <h1>
        Welcome {user?.name} 👋
      </h1>

      <p>DineX Customer Dashboard</p>
    </div>
  );
}

export default CustomerDashboard;