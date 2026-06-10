import React from 'react';
import '../../styles/restaurant-dashboard.css';

export default function MyDeliveries() {
  return (
    <div className="card">
      <div className="card-head"><h3>My Deliveries</h3></div>
      <div style={{padding:12}}>
        <p className="muted">Your assigned deliveries and history appear here.</p>
      </div>
    </div>
  );
}
