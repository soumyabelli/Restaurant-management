import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export default function RestaurantReservationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tableSize, setTableSize] = useState("2 seater");
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(getDateInputValue(1));
  const [time, setTime] = useState("7:30 PM");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer/restaurants/${id}`);
        if (!cancelled) {
          const data = res.data?.data || null;
          setRestaurant(data);
          const defaultTable = data?.tableOptions?.[0] || "2 seater";
          setTableSize(defaultTable);
          setGuests(Number(defaultTable.match(/\d+/)?.[0] || 2));
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load restaurant details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tableOptions = useMemo(
    () => restaurant?.tableOptions?.length ? restaurant.tableOptions : ["2 seater", "4 seater", "6 seater"],
    [restaurant]
  );

  const confirmReservation = async () => {
    if (!date || !time) {
      toast.error("Please select date and time");
      return;
    }

    try {
      setSaving(true);
      await api.post("/customer/reservations", {
        restaurantId: id,
        tableSize,
        guests,
        date,
        time,
        notes,
      });
      toast.success("Table reserved successfully");
      navigate("/customer/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to reserve table");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="reserve-page">
      <div className="reserve-page__header">
        <button type="button" className="link-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1>{restaurant?.name || "Table Reservation"}</h1>
          <p>{restaurant?.cuisine || "Select your table, date and time"}</p>
        </div>
      </div>

      {loading ? (
        <div className="reserve-card">Loading restaurant details...</div>
      ) : (
        <div className="reserve-layout">
          <section className="reserve-card">
            <h2>Step 1: Select table</h2>
            <div className="table-grid">
              {tableOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`table-option ${tableSize === option ? "is-active" : ""}`}
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

            <h2>Step 2: Select date & time</h2>
            <div className="field-grid">
              <label className="field">
                <span>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="field">
                <span>Time</span>
                <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="7:30 PM" />
              </label>
              <label className="field">
                <span>Guests</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                />
              </label>
            </div>

            <label className="field">
              <span>Special request (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Window table, birthday setup, etc."
                rows={4}
              />
            </label>
          </section>

          <aside className="reserve-summary">
            <h2>Step 3: Confirm</h2>
            <div className="summary-row">
              <span>Restaurant</span>
              <strong>{restaurant?.name || "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Table</span>
              <strong>{tableSize}</strong>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <strong>{date}</strong>
            </div>
            <div className="summary-row">
              <span>Time</span>
              <strong>{time}</strong>
            </div>
            <div className="summary-row">
              <span>Guests</span>
              <strong>{guests}</strong>
            </div>

            <button type="button" className="primary-button" onClick={confirmReservation} disabled={saving}>
              {saving ? "Confirming..." : "Confirm Table Reservation"}
            </button>
          </aside>
        </div>
      )}

      <style>{`
        .reserve-page{padding:20px;max-width:1150px;margin:0 auto;min-height:100vh;background:radial-gradient(circle at top left,#f1f5ff 0%,#f8fafc 35%,#ffffff 100%);font-family:system-ui,Segoe UI,Roboto,Arial;}
        .reserve-page__header{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;}
        .reserve-page__header h1{margin:0 0 6px;}
        .reserve-page__header p{margin:0;color:#64748b;}
        .reserve-layout{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start;}
        .reserve-card,.reserve-summary{border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:16px;box-shadow:0 8px 20px rgba(15,23,42,0.08);}
        h2{margin:0 0 10px;font-size:18px;}
        .table-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px;}
        .table-option{border:1px solid #dbe3ee;border-radius:12px;background:#fff;padding:10px;display:flex;flex-direction:column;gap:4px;cursor:pointer;text-align:left;}
        .table-option.is-active{border-color:#1d4ed8;background:#eff6ff;box-shadow:inset 0 0 0 1px #1d4ed8;}
        .table-option strong{font-size:14px;}
        .table-option span{font-size:12px;color:#6b7280;}
        .field-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px;}
        .field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}
        .field span{font-size:12px;color:#475569;font-weight:700;}
        .field input,.field textarea{border:1px solid #dbe3ee;border-radius:10px;padding:10px 12px;font-family:inherit;}
        .summary-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed #e5e7eb;}
        .summary-row:last-of-type{border-bottom:none;}
        .summary-row span{color:#64748b;}
        .summary-row strong{text-align:right;}
        .primary-button{width:100%;margin-top:14px;padding:12px 14px;border:none;border-radius:12px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;font-weight:800;cursor:pointer;}
        .primary-button:disabled{opacity:.6;cursor:not-allowed;}
        .link-button{border:none;background:transparent;color:#1d4ed8;font-weight:700;cursor:pointer;padding:6px 0;}
        @media (max-width: 900px){
          .reserve-layout{grid-template-columns:1fr;}
          .table-grid{grid-template-columns:1fr 1fr;}
          .field-grid{grid-template-columns:1fr;}
        }
      `}</style>
    </div>
  );
}
