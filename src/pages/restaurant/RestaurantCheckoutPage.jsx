import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import toast from "react-hot-toast";

const STORAGE_KEY = "foodiehub_cart_v1";

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getCart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParseJSON(raw, { restaurantId: null, items: {} });
}

function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function RestaurantCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => getCart());
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi | cash | wallet
  const [placing, setPlacing] = useState(false);
  const [notes, setNotes] = useState("");

  const cartItemsArray = useMemo(() => {
    const items = cart?.items || {};
    return Object.entries(items).map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity: Number(quantity || 0),
    }));
  }, [cart]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer/restaurants/${id}`);
        if (!cancelled) setRestaurant(res.data?.data || null);
      } catch (e) {
        console.error(e);
        toast.error("Unable to load restaurant");
        if (!cancelled) setRestaurant(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!cart?.restaurantId) {
      // nothing selected
      return;
    }

    // If user changed restaurant, keep cart consistent
    if (String(cart.restaurantId) !== String(id)) {
      setCart({ restaurantId: id, items: {} });
    }
  }, [cart?.restaurantId, id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const pricing = useMemo(() => {
    const menu = restaurant?.menu || [];
    const priceById = new Map(menu.map((m) => [String(m.id || m._id), Number(m.price || 0)]));

    const subtotal = cartItemsArray.reduce((sum, line) => {
      const price = priceById.get(String(line.menuItemId)) || 0;
      return sum + price * line.quantity;
    }, 0);

    const deliveryFee = subtotal >= 299 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;

    return { subtotal, deliveryFee, tax, total };
  }, [cartItemsArray, restaurant]);

  const itemCount = useMemo(
    () => cartItemsArray.reduce((s, x) => s + x.quantity, 0),
    [cartItemsArray]
  );

  const paymentOptions = [
    {
      key: "upi",
      icon: "📱",
      title: "UPI",
      subtitle: "Instant payment",
      helper: "Recommended",
    },
    {
      key: "cash",
      icon: "💵",
      title: "Cash on Delivery",
      subtitle: "Pay when order arrives",
      helper: "Simple",
    },
    {
      key: "wallet",
      icon: "👛",
      title: "Wallet",
      subtitle: "Use account balance",
      helper: "Fast checkout",
    },
  ];

  const placeOrder = async () => {
    if (!restaurant) {
      toast.error("Restaurant not loaded");
      return;
    }

    if (itemCount <= 0) {
      toast.error("Select items first");
      return;
    }

    const payload = {
      restaurantId: id,
      items: cartItemsArray
        .filter((x) => x.quantity > 0)
        .map((x) => ({ menuItemId: x.menuItemId, quantity: x.quantity })),
      paymentMethod,
      notes: notes || "",
    };

    try {
      setPlacing(true);
      const res = await api.post(`/customer/orders`, payload);
      if (res.data?.success) {
        toast.success("Order placed successfully");
        clearCart();
        navigate("/customer/dashboard");
      } else {
        toast.error(res.data?.message || "Unable to place order");
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Unable to place order");
    } finally {
      setPlacing(false);
    }
  };

  const goBackToMenu = () => {
    navigate(`/restaurant/${id}/menu`);
  };

  return (
    <div className="page page--checkout">
      <div className="page__header checkout-header">
        <button type="button" className="link-button" onClick={goBackToMenu}>
          ← Back to menu
        </button>
        <div>
          <h1>{restaurant?.name || "Checkout"}</h1>
          <p>{restaurant?.cuisine || ""}</p>
        </div>
      </div>

      {loading ? (
        <div className="content">Loading checkout...</div>
      ) : (
        <div className="checkout-layout">
          <div className="content">
            <div className="checkout-steps">
              <span>1. Menu</span>
              <span className="is-active">2. Payment</span>
              <span>3. Place order</span>
            </div>

            <div className="card">
              <h2>Your items</h2>
              {cartItemsArray.length ? (
                <div className="items-list">
                  {cartItemsArray.map((line) => {
                    const item = restaurant?.menu?.find(
                      (m) => String(m.id || m._id) === String(line.menuItemId)
                    );
                    if (!item) return null;
                    return (
                      <div key={line.menuItemId} className="items-row">
                        <div className="items-row__left">
                          <div className="items-row__name">{item.name}</div>
                          <div className="items-row__meta">Qty: {line.quantity}</div>
                        </div>
                        <div className="items-row__right">
                          ₹{(Number(item.price || 0) * line.quantity).toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">No items selected. Go back and add items.</div>
              )}
            </div>

            <div className="card">
              <h2>Payment method</h2>
              <div className="payment-opts">
                {paymentOptions.map((option) => (
                  <label
                    key={option.key}
                    className={`pay-opt ${paymentMethod === option.key ? "is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.key}
                      checked={paymentMethod === option.key}
                      onChange={() => setPaymentMethod(option.key)}
                    />
                    <span className="pay-opt__body">
                      <strong>
                        <span className="pay-opt__icon">{option.icon}</span> {option.title}
                      </strong>
                      <small>{option.subtitle}</small>
                    </span>
                    <span className="pay-opt__chip">{option.helper}</span>
                  </label>
                ))}
              </div>

              <div className="field">
                <div className="field__label">Order notes (optional)</div>
                <textarea
                  className="field__input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Less spicy, no onions..."
                />
              </div>
            </div>
          </div>

          <aside className="summary">
            <div className="summary__card">
              <h2>Summary</h2>

              <div className="summary-row">
                <span>Items</span>
                <strong>{itemCount}</strong>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{pricing.subtotal.toFixed(0)}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <strong>{pricing.deliveryFee === 0 ? "Free" : `₹${pricing.deliveryFee.toFixed(0)}`}</strong>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <strong>₹{pricing.tax.toFixed(0)}</strong>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>₹{pricing.total.toFixed(0)}</strong>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={placeOrder}
                disabled={placing || itemCount <= 0}
              >
                {placing ? "Placing your order..." : `Place order with ${paymentMethod.toUpperCase()}`}
              </button>

              <div className="summary-hint">Secure checkout • Live order tracking after confirmation</div>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .page{
          padding:20px;
          max-width:1180px;
          margin:0 auto;
          font-family:system-ui,Segoe UI,Roboto,Arial;
          min-height:100vh;
          background:radial-gradient(circle at top left,#f1f5ff 0%,#f8fafc 35%,#ffffff 100%);
          color:#0f172a;
        }
        .page__header{display:flex;align-items:flex-start;gap:14px;justify-content:space-between;margin-bottom:16px;}
        .checkout-header{
          border:1px solid #e2e8f0;
          border-radius:16px;
          padding:16px;
          background:linear-gradient(135deg,#ffffff,#f8fafc);
          box-shadow:0 12px 28px rgba(15,23,42,0.08);
        }
        .checkout-header h1{margin:0 0 6px;}
        .checkout-header p{margin:0;color:#64748b;}
        .checkout-layout{display:grid;grid-template-columns: 1fr 360px;gap:18px;align-items:start;}
        .checkout-steps{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
        .checkout-steps span{font-size:12px;padding:5px 10px;border-radius:999px;background:#f1f5f9;color:#475569;font-weight:700;}
        .checkout-steps .is-active{background:#dbeafe;color:#1d4ed8;}
        .card{
          border:1px solid #e2e8f0;
          border-radius:16px;
          padding:14px;
          margin-bottom:14px;
          background:#fff;
          box-shadow:0 10px 22px rgba(15,23,42,0.08);
        }
        .content{width:100%;}
        h2{margin:0 0 10px;font-size:18px;}
        .empty{color:#666;font-size:13px;}
        .items-list{display:flex;flex-direction:column;gap:10px;}
        .items-row{
          display:flex;
          justify-content:space-between;
          gap:12px;
          border:1px solid #e5edf7;
          border-radius:12px;
          padding:10px 12px;
          background:#f8fbff;
        }
        .items-row__name{font-weight:800;}
        .items-row__meta{font-size:12px;color:#666;margin-top:4px;}
        .items-row__right{font-weight:900;}
        .payment-opts{display:flex;flex-direction:column;gap:10px;}
        .pay-opt{
          border:1px solid #e2e8f0;
          border-radius:12px;
          padding:12px;
          display:flex;
          align-items:center;
          gap:10px;
          cursor:pointer;
          user-select:none;
          justify-content:space-between;
          transition:all .2s ease;
        }
        .pay-opt:hover{border-color:#cbd5e1;background:#fafcff;}
        .pay-opt.is-active{
          border-color:#1d4ed8;
          background:#eff6ff;
          box-shadow:inset 0 0 0 1px #1d4ed8;
        }
        .pay-opt__body{display:flex;flex-direction:column;gap:2px;}
        .pay-opt__body strong{font-size:14px;}
        .pay-opt__icon{display:inline-block;margin-right:4px;}
        .pay-opt__body small{font-size:12px;color:#6b7280;}
        .pay-opt__chip{font-size:11px;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-weight:700;}
        .pay-opt input{accent-color:#111827;}
        .field{margin-top:12px;}
        .field__label{font-size:12px;color:#666;margin-bottom:6px;font-weight:700;}
        .field__input{
          width:100%;
          min-height:72px;
          resize:vertical;
          border-radius:12px;
          border:1px solid #dbe3ee;
          padding:10px 12px;
          font-family:inherit;
          background:#fff;
        }
        .summary__card{
          position:sticky;
          top:14px;
          border:1px solid #e2e8f0;
          border-radius:16px;
          padding:16px;
          background:#fff;
          box-shadow:0 12px 28px rgba(15,23,42,0.1);
        }
        .summary-row{display:flex;justify-content:space-between;margin:10px 0;color:#333;}
        .summary-total{display:flex;justify-content:space-between;margin:14px 0 12px;padding-top:12px;border-top:1px dashed #e5e5e5;font-weight:900;}
        .primary-button{
          width:100%;
          padding:12px 14px;
          border-radius:12px;
          border:none;
          background:linear-gradient(135deg,#0f172a,#1d4ed8);
          color:#fff;
          font-weight:900;
          cursor:pointer;
          box-shadow:0 12px 22px rgba(37,99,235,0.3);
          transition:transform .2s ease, box-shadow .2s ease;
        }
        .primary-button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 16px 26px rgba(37,99,235,0.35);}
        .primary-button:disabled{opacity:0.6;cursor:not-allowed;}
        .link-button{border:none;background:transparent;color:#1d4ed8;font-weight:800;cursor:pointer;padding:6px 0;}
        .summary-hint{margin-top:10px;color:#666;font-size:12px;}
        @media (max-width: 900px){.checkout-layout{grid-template-columns:1fr;}.summary__card{position:relative;top:auto;}}
      `}</style>
    </div>
  );
}

