import { useEffect, useMemo, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineClockCircle } from "react-icons/ai";
import heroImage from "../../assets/food2.png";
import cardFoodImage from "../../assets/food.png";

const mediaLookup = {
  food: cardFoodImage,
  food2: heroImage,
  hero: heroImage,
  card: cardFoodImage,
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const resolveMedia = (value, fallback = heroImage) => {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string" && value.startsWith("http")) {
    return value;
  }

  return mediaLookup[value] || fallback;
};

const formatMoney = (value = 0) => currencyFormatter.format(Number(value || 0));

const getDateInputValue = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

function CustomerFlowDrawer({
  flow,
  user,
  restaurants = [],
  onClose,
  onSubmit,
  saving = false,
  onOpenFlow,
}) {
  const [selectedItems, setSelectedItems] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tableSize, setTableSize] = useState("2 seater");
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(getDateInputValue(1));
  const [time, setTime] = useState("7:00 PM");
  const [quantity, setQuantity] = useState(2);

  const paymentOptions = useMemo(
    () =>
      user?.savedPaymentMethods?.length
        ? user.savedPaymentMethods
        : [
            { label: "UPI", type: "upi", provider: "PhonePe / GPay" },
            { label: "Wallet", type: "wallet", provider: "FoodieHub Wallet" },
            { label: "Cash", type: "cash", provider: "Pay on delivery" },
          ],
    [user]
  );

  useEffect(() => {
    if (!flow) {
      return;
    }

    const defaultPayment =
      user?.savedPaymentMethods?.find((method) => method.isDefault)?.type ||
      user?.savedPaymentMethods?.[0]?.type ||
      "upi";
    const defaultAddress =
      user?.savedAddresses?.find((item) => item.isDefault) ||
      user?.savedAddresses?.[0];

    setPaymentMethod(defaultPayment);
    setAddress(
      defaultAddress
        ? `${defaultAddress.line1 || ""}${defaultAddress.city ? `, ${defaultAddress.city}` : ""}${defaultAddress.state ? `, ${defaultAddress.state}` : ""}`
        : ""
    );
    setNotes("");

    if (flow.type === "restaurant") {
      setSelectedItems({});
      setDate(getDateInputValue(0));
      setTime(flow.payload?.eta || "7:00 PM");
    }

    if (flow.type === "reservation") {
      const defaultSize = flow.payload?.tableOptions?.[0] || "2 seater";
      setTableSize(defaultSize);
      setGuests(Number(defaultSize.match(/\d+/)?.[0] || 2));
      setDate(getDateInputValue(2));
      setTime(flow.payload?.time || "7:30 PM");
    }

    if (flow.type === "event") {
      setQuantity(2);
      setDate(flow.payload?.date || getDateInputValue(1));
      setTime(flow.payload?.time || "7:00 PM");
    }
  }, [flow, user]);

  if (!flow) {
    return null;
  }

  const restaurant =
    flow.type === "restaurant" || flow.type === "reservation"
      ? flow.payload
      : null;
  const event = flow.type === "event" ? flow.payload : null;
  const order = flow.type === "order" ? flow.payload : null;
  const selectedMenu = restaurant?.menu || [];
  const selectedItemsList = selectedMenu.filter((item) => selectedItems[item.id]);
  const subtotal = selectedItemsList.reduce(
    (sum, item) => sum + item.price * selectedItems[item.id],
    0
  );
  const deliveryFee = subtotal ? (subtotal >= 299 ? 0 : 40) : 0;
  const tax = subtotal ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + deliveryFee + tax;

  if (flow.type === "order" && order) {
    const matchedRestaurant = restaurants.find(
      (item) => item.id === order.restaurantId
    );

    return (
      <div className="customer-flow-modal" role="dialog" aria-modal="true">
        <div className="customer-flow-modal__overlay" onClick={onClose} />
        <section className="customer-flow-modal__panel customer-flow-modal__panel--details">
          <div className="customer-flow-modal__header">
            <div>
              <p className="customer-flow-modal__eyebrow">Order details</p>
              <h3>{order.restaurant}</h3>
              <p>{order.orderCode || "Track your order history from here"}</p>
            </div>
            <button type="button" className="customer-flow-modal__close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="customer-flow-modal__detail-grid">
            <div className="customer-flow-modal__summary">
              <span
                className={`status-chip status-chip--${
                  order.status === "Delivered" ? "success" : "blue"
                }`}
              >
                {order.status}
              </span>
              <div className="customer-flow-modal__detail-row">
                <span>Items</span>
                <strong>{order.items}</strong>
              </div>
              <div className="customer-flow-modal__detail-row">
                <span>Amount</span>
                <strong>{order.amount}</strong>
              </div>
              <div className="customer-flow-modal__detail-row">
                <span>Payment</span>
                <strong>{order.paymentMethod?.toUpperCase()}</strong>
              </div>
              <div className="customer-flow-modal__detail-row">
                <span>Address</span>
                <strong>{order.address || address}</strong>
              </div>
            </div>

            <div className="customer-flow-modal__timeline">
              {order.timeline?.map((step) => (
                <div key={step.label} className={`timeline-step is-${step.state}`}>
                  <span className="timeline-step__dot">
                    {step.state === "done" ? (
                      <AiOutlineCheckCircle />
                    ) : (
                      <AiOutlineClockCircle />
                    )}
                  </span>
                  <strong>{step.label}</strong>
                  <span>{step.time}</span>
                </div>
              ))}
            </div>

            <div className="customer-flow-modal__actions">
              <button
                type="button"
                className="customer-flow-modal__primary"
                onClick={() =>
                  matchedRestaurant && onOpenFlow("restaurant", matchedRestaurant)
                }
              >
                Reorder from this restaurant
              </button>
              <button type="button" className="customer-flow-modal__secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if ((flow.type === "restaurant" || flow.type === "reservation") && restaurant) {
    return (
      <div className="customer-flow-modal" role="dialog" aria-modal="true">
        <div className="customer-flow-modal__overlay" onClick={onClose} />
        <section className="customer-flow-modal__panel customer-flow-modal__panel--wide">
          <div className="customer-flow-modal__header">
            <div>
              <p className="customer-flow-modal__eyebrow">
                {flow.type === "restaurant" ? "Order food" : "Reserve table"}
              </p>
              <h3>{restaurant.name}</h3>
              <p>
                {restaurant.cuisine} • {restaurant.eta} • {restaurant.distance}
              </p>
            </div>
            <button type="button" className="customer-flow-modal__close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="customer-flow-modal__hero">
            <img src={resolveMedia(restaurant.image || restaurant.imageKey)} alt={restaurant.name} />
            <div className="customer-flow-modal__hero-badge">{restaurant.emoji}</div>
            <div className="customer-flow-modal__hero-badge customer-flow-modal__hero-badge--secondary">
              {restaurant.rating}
            </div>
          </div>

          <div className="customer-flow-modal__content">
            {flow.type === "restaurant" ? (
              <div className="customer-flow-modal__menu">
                <div className="customer-flow-modal__section-head">
                  <h4>Choose your items</h4>
                  <span>{selectedItemsList.length} selected</span>
                </div>

                <div className="menu-grid">
                  {selectedMenu.map((item) => {
                    const quantityValue = selectedItems[item.id] || 0;

                    return (
                      <article key={item.id} className="menu-item-card">
                        <div className="menu-item-card__emoji">{item.emoji}</div>
                        <div className="menu-item-card__body">
                          <div className="menu-item-card__top">
                            <div>
                              <h5>{item.name}</h5>
                              <p>{item.description}</p>
                            </div>
                            <strong>{formatMoney(item.price)}</strong>
                          </div>
                          <div className="menu-item-card__footer">
                            <span className="pill">{item.category}</span>
                            <div className="quantity-stepper">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItems((current) => {
                                    const next = { ...current };
                                    const nextQuantity = Math.max(
                                      0,
                                      (next[item.id] || 0) - 1
                                    );

                                    if (nextQuantity === 0) {
                                      delete next[item.id];
                                    } else {
                                      next[item.id] = nextQuantity;
                                    }

                                    return next;
                                  })
                                }
                              >
                                -
                              </button>
                              <strong>{quantityValue}</strong>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItems((current) => ({
                                    ...current,
                                    [item.id]: (current[item.id] || 0) + 1,
                                  }))
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="customer-flow-modal__menu">
                <div className="customer-flow-modal__section-head">
                  <h4>Reserve your table</h4>
                  <span>{restaurant.tableOptions?.join(" • ")}</span>
                </div>

                <div className="reservation-grid">
                  {restaurant.tableOptions?.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`reservation-option ${tableSize === option ? "is-active" : ""}`}
                      onClick={() => {
                        setTableSize(option);
                        setGuests(Number(option.match(/\d+/)?.[0] || 2));
                      }}
                    >
                      <strong>{option}</strong>
                      <span>Reserved seating</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="customer-flow-modal__form">
              <div className="customer-flow-modal__section-head">
                <h4>{flow.type === "restaurant" ? "Checkout" : "Reservation details"}</h4>
                <span>{flow.type === "restaurant" ? formatMoney(total) : "Table confirmed"}</span>
              </div>

              <div className="form-grid">
                {flow.type === "restaurant" ? (
                  <>
                    <label className="field-group">
                      <span>Delivery address</span>
                      <input
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="Enter delivery address"
                      />
                    </label>
                    <label className="field-group">
                      <span>Delivery notes</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Gate code, landmark, instructions"
                        rows={3}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="field-group">
                      <span>Guests</span>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={guests}
                        onChange={(event) => setGuests(Number(event.target.value))}
                      />
                    </label>
                    <label className="field-group">
                      <span>Date</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                      />
                    </label>
                    <label className="field-group">
                      <span>Time</span>
                      <input
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                        placeholder="7:00 PM"
                      />
                    </label>
                    <label className="field-group">
                      <span>Special requests</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Corner table, birthday setup..."
                        rows={3}
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="payment-choices">
                <div className="customer-flow-modal__section-head">
                  <h4>Payment method</h4>
                  <span>{paymentMethod.toUpperCase()}</span>
                </div>
                <div className="payment-options">
                  {paymentOptions.map((method) => (
                    <button
                      key={`${method.type}-${method.label}`}
                      type="button"
                      className={`payment-option ${paymentMethod === method.type ? "is-active" : ""}`}
                      onClick={() => setPaymentMethod(method.type)}
                    >
                      <strong>{method.label}</strong>
                      <span>{method.provider || method.type.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {flow.type === "restaurant" ? (
                <div className="checkout-summary">
                  <div className="customer-flow-modal__detail-row">
                    <span>Items</span>
                    <strong>{selectedItemsList.length}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row">
                    <span>Subtotal</span>
                    <strong>{formatMoney(subtotal)}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row">
                    <span>Delivery fee</span>
                    <strong>{formatMoney(deliveryFee)}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row">
                    <span>Tax</span>
                    <strong>{formatMoney(tax)}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row customer-flow-modal__detail-row--total">
                    <span>Total</span>
                    <strong>{formatMoney(total)}</strong>
                  </div>
                </div>
              ) : (
                <div className="checkout-summary">
                  <div className="customer-flow-modal__detail-row">
                    <span>Table</span>
                    <strong>{tableSize}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row">
                    <span>Date</span>
                    <strong>{date}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row">
                    <span>Time</span>
                    <strong>{time}</strong>
                  </div>
                  <div className="customer-flow-modal__detail-row">
                    <span>Guests</span>
                    <strong>{guests}</strong>
                  </div>
                </div>
              )}

              <div className="customer-flow-modal__actions">
                <button
                  type="button"
                  className="customer-flow-modal__primary"
                  disabled={saving || (flow.type === "restaurant" && !selectedItemsList.length)}
                  onClick={() => {
                    if (flow.type === "restaurant") {
                      onSubmit({
                        type: "restaurant",
                        restaurantId: restaurant.id,
                        items: Object.entries(selectedItems).map(
                          ([menuItemId, itemQuantity]) => ({
                            menuItemId,
                            quantity: itemQuantity,
                          })
                        ),
                        paymentMethod,
                        address,
                        notes,
                      });
                      return;
                    }

                    onSubmit({
                      type: "reservation",
                      restaurantId: restaurant.id,
                      tableSize,
                      guests,
                      date,
                      time,
                      notes,
                    });
                  }}
                >
                  {saving
                    ? "Saving..."
                    : flow.type === "restaurant"
                      ? "Place order"
                      : "Reserve table"}
                </button>
                <button type="button" className="customer-flow-modal__secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (flow.type === "event" && event) {
    return (
      <div className="customer-flow-modal" role="dialog" aria-modal="true">
        <div className="customer-flow-modal__overlay" onClick={onClose} />
        <section className="customer-flow-modal__panel customer-flow-modal__panel--wide">
          <div className="customer-flow-modal__header">
            <div>
              <p className="customer-flow-modal__eyebrow">Book event tickets</p>
              <h3>{event.title}</h3>
              <p>{event.location || event.venue}</p>
            </div>
            <button type="button" className="customer-flow-modal__close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="customer-flow-modal__hero">
            <img src={resolveMedia(event.image || event.imageKey)} alt={event.title} />
            <div className="customer-flow-modal__hero-badge">{event.category || "Event"}</div>
            <div className="customer-flow-modal__hero-badge customer-flow-modal__hero-badge--secondary">
              {event.price}
            </div>
          </div>

          <div className="customer-flow-modal__content">
            <div className="customer-flow-modal__menu">
              <div className="customer-flow-modal__section-head">
                <h4>Tickets</h4>
                <span>{event.seatsLeft ? `${event.seatsLeft} seats left` : "Limited seats"}</span>
              </div>

              <div className="event-booking-card">
                <div className="event-booking-card__row">
                  <span>Quantity</span>
                  <div className="quantity-stepper">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    >
                      -
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => current + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="event-booking-card__row">
                  <span>Date</span>
                  <input value={date} onChange={(eventValue) => setDate(eventValue.target.value)} />
                </div>
                <div className="event-booking-card__row">
                  <span>Time</span>
                  <input
                    value={time}
                    onChange={(eventValue) => setTime(eventValue.target.value)}
                    placeholder="7:00 PM"
                  />
                </div>
              </div>
            </div>

            <div className="customer-flow-modal__form">
              <div className="customer-flow-modal__section-head">
                <h4>Payment and confirmation</h4>
                <span>{formatMoney((event.amount || 0) * quantity)}</span>
              </div>

              <div className="payment-options">
                {paymentOptions.map((method) => (
                  <button
                    key={`${method.type}-${method.label}`}
                    type="button"
                    className={`payment-option ${paymentMethod === method.type ? "is-active" : ""}`}
                    onClick={() => setPaymentMethod(method.type)}
                  >
                    <strong>{method.label}</strong>
                    <span>{method.provider || method.type.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              <label className="field-group">
                <span>Notes</span>
                <textarea
                  value={notes}
                  onChange={(eventValue) => setNotes(eventValue.target.value)}
                  rows={4}
                  placeholder="Seat preference, group details or special requests"
                />
              </label>

              <div className="checkout-summary">
                <div className="customer-flow-modal__detail-row">
                  <span>Tickets</span>
                  <strong>{quantity}</strong>
                </div>
                <div className="customer-flow-modal__detail-row">
                  <span>Total</span>
                  <strong>{formatMoney((event.amount || 0) * quantity)}</strong>
                </div>
                <div className="customer-flow-modal__detail-row">
                  <span>Venue</span>
                  <strong>{event.location || event.venue}</strong>
                </div>
              </div>

              <div className="customer-flow-modal__actions">
                <button
                  type="button"
                  className="customer-flow-modal__primary"
                  disabled={saving}
                  onClick={() =>
                    onSubmit({
                      type: "event",
                      eventId: event.id,
                      quantity,
                      paymentMethod,
                      date,
                      time,
                      notes,
                    })
                  }
                >
                  {saving ? "Booking..." : "Confirm booking"}
                </button>
                <button type="button" className="customer-flow-modal__secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return null;
}

export default CustomerFlowDrawer;
