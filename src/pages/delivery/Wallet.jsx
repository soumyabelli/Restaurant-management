import React from 'react';
import '../../styles/restaurant-dashboard.css';

export default function Wallet() {
  return (
    <div className="card">
      <div className="card-head"><h3>Wallet</h3></div>
      <div style={{padding:12}}>
        <p className="muted">Manage your wallet and payment methods here.</p>
      </div>
    </div>
  );
}
