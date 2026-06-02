import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatMoney = (value = 0) => moneyFormatter.format(Number(value || 0));

const getDateInputValue = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export default function EventBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [occasionName, setOccasionName] = useState("Event");
  const [preferredRestaurant, setPreferredRestaurant] = useState("");
  const [bookingDate, setBookingDate] = useState(getDateInputValue(1));
  const [session, setSession] = useState("night");
  const [fromTime, setFromTime] = useState("19:00");
  const [toTime, setToTime] = useState("22:00");
  const [quantity, setQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const [eventsResponse, historyResponse] = await Promise.all([
          api.get("/customer/events"),
          api.get("/customer/events/bookings"),
        ]);

        if (cancelled) return;

        const allEvents = eventsResponse.data?.data || [];
        const selectedEvent =
          allEvents.find((item) => String(item.id) === String(id)) || null;
        setEvent(selectedEvent);
        setPreferredRestaurant(
          selectedEvent?.location || selectedEvent?.venue || ""
        );
        setBookingDate(selectedEvent?.date || getDateInputValue(1));
        setHistory(historyResponse.data?.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load event booking page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalAmount = useMemo(
    () => Number(event?.amount || 0) * Number(quantity || 1),
    [event, quantity]
  );

  const submitBooking = async () => {
    if (!occasionName.trim()) {
      toast.error("Please enter event name");
      return;
    }

    if (!bookingDate || !fromTime || !toTime) {
      toast.error("Please select date and time");
      return;
    }

    const timeRange = `${session === "day" ? "Day" : "Night"} ${fromTime} - ${toTime}`;

    try {
      setSaving(true);
      await api.post("/customer/events/book", {
        eventId: id,
        quantity,
        paymentMethod,
        date: bookingDate,
        time: timeRange,
      });

      toast.success("Event booking confirmed");
      const refreshedHistory = await api.get("/customer/events/bookings");
      setHistory(refreshedHistory.data?.data || []);
      navigate("/customer/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to confirm booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="event-booking-page">
      <div className="event-booking-header">
        <button type="button" className="link-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1>{event?.title || "Plan Event"}</h1>
          <p>{event?.location || event?.venue || "Select venue and celebration details"}</p>
        </div>
      </div>

      {loading ? (
        <div className="panel">Loading event details...</div>
      ) : (
        <div className="event-booking-layout">
          <section className="panel">
            <h2>Plan Event</h2>

            <label className="field">
              <span>Event Name / Type</span>
              <input
                value={occasionName}
                onChange={(eventValue) => setOccasionName(eventValue.target.value)}
                placeholder="Birthday, Anniversary, Corporate Meet..."
              />
            </label>

            <label className="field">
              <span>Preferred Restaurant / Venue</span>
              <input
                value={preferredRestaurant}
                onChange={(eventValue) => setPreferredRestaurant(eventValue.target.value)}
                placeholder="Enter venue or restaurant name"
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(eventValue) => setBookingDate(eventValue.target.value)}
                />
              </label>

              <label className="field">
                <span>Day / Night</span>
                <select
                  value={session}
                  onChange={(eventValue) => setSession(eventValue.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>From</span>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(eventValue) => setFromTime(eventValue.target.value)}
                />
              </label>

              <label className="field">
                <span>To</span>
                <input
                  type="time"
                  value={toTime}
                  onChange={(eventValue) => setToTime(eventValue.target.value)}
                />
              </label>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Tickets</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(eventValue) =>
                    setQuantity(Math.max(1, Number(eventValue.target.value || 1)))
                  }
                />
              </label>

              <label className="field">
                <span>Payment</span>
                <select
                  value={paymentMethod}
                  onChange={(eventValue) => setPaymentMethod(eventValue.target.value)}
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={submitBooking}
              disabled={saving}
            >
              {saving ? "Confirming..." : "Confirm Event Booking"}
            </button>
          </section>

          <aside className="panel side-panel">
            <h2>Booking Details</h2>
            <div className="summary-row">
              <span>Event</span>
              <strong>{event?.title || "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Name/Type</span>
              <strong>{occasionName || "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Venue</span>
              <strong>{preferredRestaurant || "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <strong>{bookingDate || "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Session</span>
              <strong>{session === "day" ? "Day" : "Night"}</strong>
            </div>
            <div className="summary-row">
              <span>Time</span>
              <strong>{fromTime} - {toTime}</strong>
            </div>
            <div className="summary-row">
              <span>Total</span>
              <strong>{formatMoney(totalAmount)}</strong>
            </div>

            <h3>Booking History</h3>
            <div className="history-list">
              {history.length ? (
                history.map((booking) => (
                  <div key={booking.id || booking.bookingCode} className="history-item">
                    <strong>{booking.eventTitle || booking.title}</strong>
                    <span>{booking.date} • {booking.time}</span>
                    <span>{booking.bookingCode} • {booking.status}</span>
                  </div>
                ))
              ) : (
                <p className="empty">No previous event bookings.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .event-booking-page{padding:20px;max-width:1160px;margin:0 auto;min-height:100vh;background:radial-gradient(circle at top left,#f1f5ff 0%,#f8fafc 35%,#ffffff 100%);font-family:system-ui,Segoe UI,Roboto,Arial;}
        .event-booking-header{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;}
        .event-booking-header h1{margin:0 0 6px;}
        .event-booking-header p{margin:0;color:#64748b;}
        .event-booking-layout{display:grid;grid-template-columns:1fr 360px;gap:16px;align-items:start;}
        .panel{border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,0.08);}
        .panel h2{margin:0 0 12px;}
        .field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;}
        .field span{font-size:12px;color:#475569;font-weight:700;}
        .field input,.field select{border:1px solid #dbe3ee;border-radius:10px;padding:10px 12px;font-family:inherit;background:#fff;}
        .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .summary-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed #e5e7eb;}
        .summary-row:last-of-type{border-bottom:none;margin-bottom:8px;}
        .summary-row span{color:#64748b;}
        .summary-row strong{text-align:right;}
        .primary-button{width:100%;padding:12px 14px;border:none;border-radius:12px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;font-weight:800;cursor:pointer;}
        .primary-button:disabled{opacity:.6;cursor:not-allowed;}
        .link-button{border:none;background:transparent;color:#1d4ed8;font-weight:700;cursor:pointer;padding:6px 0;}
        .side-panel h3{margin:14px 0 8px;font-size:15px;}
        .history-list{max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:8px;}
        .history-item{border:1px solid #e5e7eb;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:4px;}
        .history-item strong{font-size:14px;}
        .history-item span{font-size:12px;color:#64748b;}
        .empty{margin:0;color:#64748b;font-size:13px;}
        @media (max-width: 900px){
          .event-booking-layout{grid-template-columns:1fr;}
          .field-grid{grid-template-columns:1fr;}
        }
      `}</style>
    </div>
  );
}

