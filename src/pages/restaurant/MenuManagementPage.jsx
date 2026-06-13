import { useState, useEffect } from "react";

const renderEmojiOrImage = (emojiStr) => {
  if (!emojiStr) return "🍽️";
  if (emojiStr.startsWith("http://") || emojiStr.startsWith("https://") || emojiStr.startsWith("/")) {
    return (
      <img
        src={emojiStr}
        alt="Menu item"
        style={{
          width: "48px",
          height: "48px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
    );
  }
  return emojiStr;
};

function MenuManagementPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    emoji: "",
    popular: false,
    vegetarian: false,
  });

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      const res = await fetch("http://localhost:5000/api/restaurant/menu", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMenu(Array.isArray(json.data) ? json.data : (json.data?.restaurant?.menu || []));
      } else {
        throw new Error(json.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || "",
        price: item.price || "",
        category: item.category || "",
        description: item.description || "",
        emoji: item.emoji || "",
        popular: item.popular || false,
        vegetarian: item.vegetarian || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        emoji: "",
        popular: false,
        vegetarian: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingItem
        ? `http://localhost:5000/api/restaurant/menu/${editingItem.id}`
        : `http://localhost:5000/api/restaurant/menu`;
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        ...formData,
        price: Number(formData.price),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setMenu(json.data);
        handleCloseModal();
      } else {
        alert(json.message || "Error saving item");
      }
    } catch (err) {
      alert("Error saving item: " + err.message);
    }
  };

  return (
    <>
      <header className="rh-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="rh-top-left">
          <h1>Menu Management</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          + Add New Item
        </button>
      </header>

      {loading && <p>Loading menu...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && menu.length === 0 && (
        <div className="card">
          <p style={{ color: "#64748b" }}>No menu items found. Add some items to your menu!</p>
        </div>
      )}

      {!loading && !error && menu.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {menu.map((item) => (
            <div key={item.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderTop: item.active ? "4px solid #10b981" : "4px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
                    {renderEmojiOrImage(item.emoji)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>{item.name}</h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>{item.category || "Uncategorized"}</p>
                  </div>
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#4f46e5" }}>₹{item.price}</div>
              </div>
              
              <p style={{ fontSize: "14px", color: "#475569", margin: 0, flex: 1 }}>{item.description || "No description provided."}</p>
              
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "auto" }}>
                {item.vegetarian && <span style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>Veg</span>}
                {item.popular && <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>Popular</span>}
              </div>
              
              <button 
                onClick={() => handleOpenModal(item)}
                style={{ marginTop: "12px", padding: "8px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500", transition: "background 0.2s" }}
              >
                Edit Item
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", background: "white", padding: "24px", borderRadius: "12px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>{editingItem ? "Edit Menu Item" : "Add New Item"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>Price (₹) *</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>Category</label>
                  <input type="text" placeholder="e.g. Starters, Mains" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>Emoji / Photo URL</label>
                <input type="text" placeholder="e.g. 🍕 or https://..." value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.vegetarian} onChange={e => setFormData({...formData, vegetarian: e.target.checked})} />
                  Vegetarian
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.popular} onChange={e => setFormData({...formData, popular: e.target.checked})} />
                  Popular
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: "10px 20px", background: "transparent", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  {editingItem ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default MenuManagementPage;
