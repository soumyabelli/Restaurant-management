import React from 'react';
import '../../styles/restaurant-dashboard.css';

export default function NewOrders() {
  return (
    <div className="card">
      <div className="card-head"><h3>New Orders</h3><div className="card-actions">Auto-accept is ON</div></div>
      <div style={{padding:12}}>
        <p className="muted">New incoming orders will appear here. Click Accept to take an order.</p>
      </div>
    </div>
  );
}
