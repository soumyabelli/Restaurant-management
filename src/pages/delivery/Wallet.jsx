import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FiArrowUpRight, FiArrowDownLeft, FiPlus, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { AiOutlineWallet } from "react-icons/ai";
import api from "../../api/client";
import "../../styles/restaurant-dashboard.css";

const fmtMoney = (v) => `₹${Number(v || 0).toFixed(0)}`;

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/delivery/wallet");
      setBalance(res.data.walletBalance ?? 0);
      setTransactions(res.data.transactions || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setUpiId(u.upiId || "");
        setBankAcc(u.bankAcc || "");
      } catch (e) {
        console.error(e);
      }
    }
    fetchWallet();
  }, []);

  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(cashoutAmount);

    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amt > balance) {
      toast.error("Insufficient balance in your wallet");
      return;
    }

    if (method === "upi" && !upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }

    if (method === "bank" && !bankAcc.trim()) {
      toast.error("Please enter your bank account number");
      return;
    }

    setProcessing(true);

    try {
      const payload = {
        amount: amt,
        method,
        upiId: method === "upi" ? upiId : undefined,
        bankAcc: method === "bank" ? bankAcc : undefined,
      };

      const res = await api.post("/delivery/wallet/withdraw", payload);
      setBalance(res.data.walletBalance);
      
      // Update local storage user details to keep it sync'd
      if (user) {
        const updatedUser = { ...user, walletBalance: res.data.walletBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      toast.success(`Successfully cashed out ${fmtMoney(amt)}!`);
      setIsModalOpen(false);
      setCashoutAmount("");
      
      // Refresh transactions
      fetchWallet();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Cashout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="delivery-wallet-page" style={{ padding: "40px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ textAlign: "center" }}>
          <FiRefreshCw className="spin" style={{ fontSize: "30px", marginBottom: "12px", animation: "spin_loader 1s linear infinite", color: "#6366f1" }} />
          <h3>Loading Wallet...</h3>
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
    <div className="delivery-wallet-page">
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="rh-top-left">
          <h2>My Wallet</h2>
          <p className="muted">Check your balance, payouts, and withdraw funds instantly.</p>
        </div>
      </header>

      <div className="rh-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Wallet Balance Card */}
        <div className="card" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", boxShadow: "0 10px 25px -5px rgba(15,23,42,0.3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8" }}>
              <AiOutlineWallet size={18} />
              <span style={{ fontSize: "14px", fontWeight: "600" }}>Current Wallet Balance</span>
            </div>
            <h1 style={{ fontSize: "40px", fontWeight: "800", margin: "12px 0 0 0" }}>{fmtMoney(balance)}</h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "#6366f1",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "700",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#4f46e5")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#6366f1")}
          >
            Withdraw Funds <FiArrowUpRight />
          </button>
        </div>

        {/* Quick Help / Bank Details Card */}
        <div className="card" style={{ background: "white", padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: "0 0 8px 0" }}>Instant Cashout Details</h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
              You can withdraw your earnings instantly via UPI or IMPS Bank Transfer. Transfers take up to 2 minutes to settle in your account.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block" }}>Linked UPI Account</strong>
              <span style={{ color: "#64748b" }}>{upiId || "delivery@ybl"}</span>
            </div>
            <span style={{ color: "#6366f1", fontWeight: "700", cursor: "pointer" }} onClick={() => setIsModalOpen(true)}>Edit</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card" style={{ background: "white", padding: "20px", borderRadius: "12px" }}>
        <h3 style={{ margin: "0 0 16px 0" }}>Transaction History</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {transactions.map((tx) => {
            const formattedDate = tx.createdAt
              ? new Date(tx.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : tx.date || "Just now";

            return (
              <div
                key={tx._id || tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: tx.type === "credit" ? "#ecfdf5" : "#fef2f2",
                      color: tx.type === "credit" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {tx.type === "credit" ? <FiArrowDownLeft size={20} /> : <FiArrowUpRight size={20} />}
                  </div>
                  <div>
                    <strong style={{ display: "block", color: "#0f172a" }}>{tx.title}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{formattedDate}</span>
                  </div>
                </div>
                <div>
                  <strong
                    style={{
                      fontSize: "16px",
                      color: tx.type === "credit" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {fmtMoney(tx.amount)}
                  </strong>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "16px 0" }}>
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Cashout Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: "450px", background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Withdraw Funds</h2>

            <form onSubmit={handleCashoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
                  Withdrawal Amount (Max: {fmtMoney(balance)})
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter amount (₹)"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
                  Transfer Method
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: method === "upi" ? "2px solid #6366f1" : "1px solid #cbd5e1",
                      background: method === "upi" ? "#f5f3ff" : "white",
                      color: method === "upi" ? "#4f46e5" : "#475569",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("bank")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: method === "bank" ? "2px solid #6366f1" : "1px solid #cbd5e1",
                      background: method === "bank" ? "#f5f3ff" : "white",
                      color: method === "bank" ? "#4f46e5" : "#475569",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {method === "upi" ? (
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
                    UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. name@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Account Number"
                    value={bankAcc}
                    onChange={(e) => setBankAcc(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    background: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                  disabled={processing}
                >
                  {processing ? "Transferring..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
