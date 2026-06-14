import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FiSettings, FiTruck, FiBell, FiLock, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import "../../styles/restaurant-dashboard.css";

export default function Settings() {
  const navigate = useNavigate();
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [vehicle, setVehicle] = useState({
    type: "motorcycle",
    number: "",
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    surgeAlerts: true,
    weeklyPayouts: true,
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get("/delivery/settings");
      setOnlineStatus(res.data.onlineStatus ?? true);
      if (res.data.vehicleDetails) setVehicle(res.data.vehicleDetails);
      if (res.data.bankDetails) setBankDetails(res.data.bankDetails);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load settings from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.put("/delivery/settings", { vehicleDetails: vehicle });
      toast.success("Vehicle details successfully updated in database");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vehicle details");
    }
  };

  const saveBank = async (e) => {
    e.preventDefault();
    try {
      await api.put("/delivery/settings", { bankDetails: bankDetails });
      toast.success("Bank details successfully linked for payouts");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save bank details");
    }
  };

  const handleDutyToggle = async () => {
    const nextStatus = !onlineStatus;
    try {
      await api.put("/delivery/settings", { onlineStatus: nextStatus });
      setOnlineStatus(nextStatus);
      toast.success(
        nextStatus
          ? "You are now ONLINE. Preparing for order alerts."
          : "You are now OFFLINE. No orders will be assigned."
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle availability status");
    }
  };

  const handleNotifyToggle = (key) => {
    const val = !notifications[key];
    const newNotifications = { ...notifications, [key]: val };
    setNotifications(newNotifications);
    localStorage.setItem("delivery_notifications", JSON.stringify(newNotifications));
    toast.success("Notification preference updated");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="delivery-settings-page" style={{ padding: "40px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ textAlign: "center" }}>
          <FiRefreshCw className="spin" style={{ fontSize: "30px", marginBottom: "12px", animation: "spin_loader 1s linear infinite", color: "#6366f1" }} />
          <h3>Loading Settings...</h3>
        </div>
        <style>{`
          @keyframes spin_loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="delivery-settings-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>Courier Settings</h2>
          <p className="muted">Manage vehicle parameters, notification alerts, payout accounts, and status.</p>
        </div>
      </header>

      {/* Online/Offline Banner Card */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0" }}>Duty Switcher</h3>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Toggle to declare whether you are available to receive orders.
            </span>
          </div>
          <button
            onClick={handleDutyToggle}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "700",
              background: onlineStatus ? "#ecfdf5" : "#f1f5f9",
              color: onlineStatus ? "#10b981" : "#475569",
              transition: "all 0.2s"
            }}
          >
            {onlineStatus ? "🟢 ONLINE" : "🔴 OFFLINE"}
          </button>
        </div>
      </div>

      <div className="rh-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Vehicle Details */}
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FiTruck size={20} style={{ color: "#6366f1" }} />
            <h3 style={{ margin: 0 }}>Vehicle Information</h3>
          </div>

          <form onSubmit={saveVehicle} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#64748b" }}>Vehicle Type</label>
              <select
                value={vehicle.type}
                onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="motorcycle">Motorcycle / Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#64748b" }}>License Plate Number</label>
              <input
                type="text"
                placeholder="e.g. KA-20-EQ-5432"
                value={vehicle.number}
                onChange={(e) => setVehicle({ ...vehicle, number: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <button type="submit" style={{ padding: "10px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", marginTop: "4px" }}>
              Save Vehicle Info
            </button>
          </form>
        </div>

        {/* Notifications & Security */}
        <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FiBell size={20} style={{ color: "#6366f1" }} />
            <h3 style={{ margin: 0 }}>Notification Preferences</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={notifications.newOrders}
                onChange={() => handleNotifyToggle("newOrders")}
                style={{ width: "16px", height: "16px" }}
              />
              <div>
                <strong style={{ display: "block" }}>New Orders Radar</strong>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Get sound alert when a restaurant marks food as ready.</span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={notifications.surgeAlerts}
                onChange={() => handleNotifyToggle("surgeAlerts")}
                style={{ width: "16px", height: "16px" }}
              />
              <div>
                <strong style={{ display: "block" }}>Peak Hours Surge Multipliers</strong>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Get alerts when earnings multipliers are active in your area.</span>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={notifications.weeklyPayouts}
                onChange={() => handleNotifyToggle("weeklyPayouts")}
                style={{ width: "16px", height: "16px" }}
              />
              <div>
                <strong style={{ display: "block" }}>Payout Confirmations</strong>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Get notifications upon successful bank transaction completions.</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", marginTop: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <FiLock size={20} style={{ color: "#6366f1" }} />
          <h3 style={{ margin: 0 }}>Linked Payout Bank Details</h3>
        </div>

        <form onSubmit={saveBank} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#64748b" }}>Bank Name</label>
            <input
              type="text"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#64748b" }}>IFSC Code</label>
            <input
              type="text"
              value={bankDetails.ifscCode}
              onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#64748b" }}>Account Number</label>
            <input
              type="password"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <button type="submit" style={{ gridColumn: "span 2", padding: "10px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
            Save Bank Details
          </button>
        </form>
      </div>

      {/* Logout Action */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px", marginTop: "20px", borderTop: "4px solid #ef4444" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", color: "#ef4444" }}>Sign Out</h3>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Sign out from the DineX Courier portal and end your active session.
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "700",
              background: "#fef2f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Logout <FiLogOut />
          </button>
        </div>
      </div>
    </div>
  );
}
