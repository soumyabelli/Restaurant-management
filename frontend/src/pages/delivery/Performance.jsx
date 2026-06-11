import React from 'react';
import '../../styles/restaurant-dashboard.css';

export default function Performance() {
  return (
    <div className="card">
      <div className="card-head"><h3>Performance</h3></div>
      <div style={{padding:12}}>
        <p className="muted">Acceptance rate, on-time delivery and stats appear here.</p>
      </div>
    </div>
  );
}
