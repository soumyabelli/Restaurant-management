import React from 'react';
import '../../styles/restaurant-dashboard.css';

export default function Earnings() {
  return (
    <div className="card">
      <div className="card-head"><h3>Earnings</h3></div>
      <div style={{padding:12}}>
        <p className="muted">Daily earnings, cashout and breakdown appear here.</p>
      </div>
    </div>
  );
}
