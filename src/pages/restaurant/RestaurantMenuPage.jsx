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

function getInitialCart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParseJSON(raw, { restaurantId: null, items: {} });
}

function MenuItemRow({ item, qty, onAdd, onRemove }) {
  const isVeg = item.vegetarian ?? true;
  return (
    <div className={`menu-item-card ${qty > 0 ? "is-selected" : ""}`}>
      <div className="menu-item-card__head">
        <div className={`diet-dot ${isVeg ? "is-veg" : "is-nonveg"}`} />
        {item.popular ? <span className="menu-badge">Popular</span> : null}
      </div>

      <div className="menu-item-row__left">
        <div className="menu-item-row__name">
          <span className="menu-item-row__emoji">{item.emoji || "🍽️"}</span> {item.name}
        </div>
        {item.description ? <div className="menu-item-row__desc">{item.description}</div> : null}
        <div className="menu-item-row__price">₹{Number(item.price || 0).toFixed(0)}</div>
      </div>

      <div className="menu-item-row__right">
        <div className="qty-controls">
          <button type="button" onClick={onRemove} disabled={qty <= 0} aria-label={`Decrease ${item.name}`}>
            -
          </button>
          <span className="qty">{qty}</span>
          <button type="button" onClick={onAdd} aria-label={`Increase ${item.name}`}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => getInitialCart());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer/restaurants/${id}`);
        if (!cancelled) setRestaurant(res.data?.data || null);
      } catch (e) {
        console.error(e);
        toast.error("Unable to load menu");
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
    // If restaurant changed, reset cart
    if (cart?.restaurantId && String(cart.restaurantId) !== String(id)) {
      setCart({ restaurantId: String(id), items: {} });
    } else if (!cart?.restaurantId) {
      setCart({ restaurantId: String(id), items: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartItemsArray = useMemo(() => {
    const items = cart?.items || {};
    return Object.entries(items).map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity: Number(quantity || 0),
    }));
  }, [cart]);

  const subtotal = useMemo(() => {
    if (!restaurant?.menu?.length) return 0;
    const priceById = new Map(
      restaurant.menu.map((m) => [String(m.id || m._id), Number(m.price || 0)])
    );
    return cartItemsArray.reduce((sum, line) => {
      const price = priceById.get(String(line.menuItemId)) || 0;
      return sum + price * line.quantity;
    }, 0);
  }, [cartItemsArray, restaurant]);

  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  const onAdd = (item) => {
    setCart((prev) => {
      const items = { ...(prev.items || {}) };
      const key = String(item.id);
      items[key] = Number(items[key] || 0) + 1;
      return { restaurantId: String(id), items };
    });
  };

  const onRemove = (item) => {
    setCart((prev) => {
      const items = { ...(prev.items || {}) };
      const key = String(item.id);
      const next = Number(items[key] || 0) - 1;
      if (next <= 0) delete items[key];
      else items[key] = next;
      return { restaurantId: String(id), items };
    });
  };

  const itemCount = useMemo(() => {
    return cartItemsArray.reduce((s, x) => s + x.quantity, 0);
  }, [cartItemsArray]);

  const selectedItems = useMemo(() => {
    if (!restaurant?.menu?.length) return [];
    return restaurant.menu
      .map((item) => ({
        ...item,
        qty: Number(cart?.items?.[String(item.id)] || 0),
      }))
      .filter((item) => item.qty > 0);
  }, [cart, restaurant]);

  const placeOrderEnabled = itemCount > 0;

  const goCheckout = () => {
    if (!placeOrderEnabled) {
      toast.error("Select at least one item");
      return;
    }
    navigate(`/restaurant/${id}/checkout`);
  };

  return (
    <div className="page page--restaurant">
      <div className="menu-topbar">
        <button type="button" className="link-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="menu-hero">
        <div>
          <h1>{restaurant?.name || "Restaurant"} Menu</h1>
          <p>{restaurant?.cuisine ? restaurant.cuisine : "Fresh picks for your next order"}</p>
          <div className="menu-hero__meta">
            <span>Step 1 of 3</span>
            <strong>Select items</strong>
          </div>
        </div>
        <div className="menu-hero__pill">
          <span>{itemCount}</span>
          <small>items selected</small>
        </div>
      </div>

      {loading ? (
        <div className="content">Loading menu...</div>
      ) : restaurant?.menu?.length ? (
        <div className="content menu-layout">
          <div className="menu-items">
            {restaurant.menu.map((item) => {
              const qty = Number(cart?.items?.[String(item.id)] || 0);
              return (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  qty={qty}
                  onAdd={() => onAdd(item)}
                  onRemove={() => onRemove(item)}
                />
              );
            })}
          </div>

          <aside className="menu-summary">
            <h2>Order summary</h2>
            <div className="summary-stepper">
              <span className="is-active">1. Items</span>
              <span>2. Payment</span>
              <span>3. Place Order</span>
            </div>
            <div className="summary-row">
              <span>Items</span>
              <strong>{itemCount}</strong>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{subtotal.toFixed(0)}</strong>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <strong>{deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(0)}`}</strong>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <strong>₹{tax.toFixed(0)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>₹{total.toFixed(0)}</strong>
            </div>

            <div className="selected-list">
              {selectedItems.length ? (
                selectedItems.map((item) => (
                  <div key={item.id} className="selected-list__row">
                    <span>
                      {item.name} x {item.qty}
                    </span>
                    <strong>₹{(Number(item.price || 0) * item.qty).toFixed(0)}</strong>
                  </div>
                ))
              ) : (
                <p className="selected-list__empty">No items selected yet</p>
              )}
            </div>

            <button type="button" className="primary-button" onClick={goCheckout} disabled={!placeOrderEnabled}>
              Continue to payment
            </button>

            <div className="summary-hint">Payment options in next step: UPI / Cash / Wallet</div>
          </aside>
        </div>
      ) : (
        <div className="content">No menu items found.</div>
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
        .menu-topbar{margin-bottom:10px;}
        .menu-hero{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          margin-bottom:18px;
          border:1px solid #e2e8f0;
          border-radius:18px;
          padding:18px;
          background:linear-gradient(130deg,#ffffff,#f8fafc);
          box-shadow:0 14px 32px rgba(15,23,42,0.08);
        }
        .menu-hero h1{margin:0 0 8px;font-size:30px;line-height:1.08;letter-spacing:-0.02em;}
        .menu-hero p{margin:0;color:#64748b;font-size:14px;}
        .menu-hero__meta{display:flex;align-items:center;gap:10px;margin-top:10px;}
        .menu-hero__meta span{padding:4px 10px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;}
        .menu-hero__meta strong{font-size:13px;color:#334155;}
        .menu-hero__pill{
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          min-width:100px;
          height:100px;
          border-radius:16px;
          background:linear-gradient(145deg,#0f172a,#1e293b);
          color:#fff;
          box-shadow:0 12px 22px rgba(15,23,42,0.25);
        }
        .menu-hero__pill span{font-size:30px;font-weight:900;line-height:1;}
        .menu-hero__pill small{opacity:0.85;font-size:12px;margin-top:6px;}
        .content{width:100%;}
        .menu-layout{display:grid;grid-template-columns: 1fr 360px;gap:18px;align-items:start;}
        .menu-items{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .menu-item-card{
          border:1px solid #e2e8f0;
          border-radius:16px;
          padding:14px;
          background:#fff;
          box-shadow:0 6px 22px rgba(15,23,42,0.06);
          transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .menu-item-card:hover{
          transform:translateY(-2px);
          box-shadow:0 12px 24px rgba(15,23,42,0.10);
          border-color:#cbd5e1;
        }
        .menu-item-card.is-selected{
          border-color:#2563eb;
          box-shadow:0 10px 24px rgba(37,99,235,0.18);
          background:linear-gradient(145deg,#ffffff,#f8fbff);
        }
        .menu-item-card__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
        .diet-dot{width:14px;height:14px;border-radius:99px;border:2px solid #16a34a;}
        .diet-dot.is-nonveg{border-color:#dc2626;}
        .menu-badge{padding:3px 8px;font-size:11px;border-radius:999px;background:#fff7ed;color:#c2410c;font-weight:700;}
        .menu-item-row__name{font-weight:800;margin-bottom:4px;font-size:15px;display:flex;align-items:center;gap:6px;line-height:1.3;}
        .menu-item-row__emoji{font-size:16px;}
        .menu-item-row__desc{color:#64748b;font-size:13px;margin-bottom:10px;min-height:34px;}
        .menu-item-row__price{font-weight:900;color:#111827;}
        .qty-controls{display:flex;align-items:center;gap:10px;margin-top:6px;}
        .qty-controls button{
          width:34px;
          height:34px;
          border-radius:10px;
          border:1px solid #cbd5e1;
          background:#f8fafc;
          cursor:pointer;
          font-weight:800;
          transition:all .2s ease;
        }
        .qty-controls button:hover:not(:disabled){
          background:#e2e8f0;
        }
        .qty-controls button:disabled{opacity:0.5;cursor:not-allowed;}
        .qty{
          min-width:28px;
          text-align:center;
          font-weight:800;
          color:#1e293b;
        }
        .menu-summary{
          border:1px solid #e2e8f0;
          border-radius:16px;
          padding:16px;
          position:sticky;
          top:14px;
          background:#fff;
          box-shadow:0 10px 28px rgba(15,23,42,0.08);
        }
        .menu-summary h2{margin:0 0 10px;font-size:18px;}
        .summary-stepper{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
        .summary-stepper span{font-size:11px;padding:4px 8px;border-radius:999px;background:#f1f5f9;color:#475569;font-weight:700;}
        .summary-stepper .is-active{background:#dbeafe;color:#1d4ed8;}
        .summary-row{display:flex;justify-content:space-between;margin:10px 0;color:#333;}
        .summary-total{display:flex;justify-content:space-between;margin:12px 0;padding-top:12px;border-top:1px dashed #e5e5e5;font-weight:800;}
        .selected-list{max-height:160px;overflow:auto;border:1px dashed #dbe3ee;border-radius:12px;padding:8px;margin:6px 0 12px;background:#f8fafc;}
        .selected-list__row{display:flex;justify-content:space-between;gap:10px;padding:6px 4px;font-size:13px;}
        .selected-list__empty{margin:6px 2px;color:#6b7280;font-size:13px;}
        .primary-button{
          width:100%;
          padding:12px 14px;
          border-radius:12px;
          border:none;
          background:linear-gradient(135deg,#0f172a,#1d4ed8);
          color:#fff;
          font-weight:800;
          cursor:pointer;
          margin-top:4px;
          box-shadow:0 10px 20px rgba(37,99,235,0.24);
          transition:transform .2s ease, box-shadow .2s ease;
        }
        .primary-button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 24px rgba(37,99,235,0.30);}
        .primary-button:disabled{opacity:0.6;cursor:not-allowed;}
        .link-button{border:none;background:transparent;color:#1d4ed8;font-weight:700;cursor:pointer;padding:6px 0;}
        .summary-hint{margin-top:10px;color:#666;font-size:12px;}
        @media (max-width: 950px){
          .menu-layout{grid-template-columns:1fr;}
          .menu-items{grid-template-columns:1fr;}
          .menu-summary{position:relative;top:auto;}
        }
        @media (max-width: 640px){
          .menu-hero{align-items:flex-start;flex-direction:column;gap:12px;}
        }
      `}</style>
    </div>
  );
}

