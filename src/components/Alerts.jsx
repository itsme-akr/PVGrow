import React from 'react';
import './Dashboard.css';

function Alerts() {
  return (
    <div className="alerts">
      <h2>Alerts</h2>
      <ul>
        <li style={{ color: 'red' }}>High: Soil moisture critically low <button>Good</button> <button>Irrelevant</button></li>
        <li style={{ color: 'yellow' }}>Medium: Fertilizer needed soon <button>Good</button> <button>Irrelevant</button></li>
        <li style={{ color: 'green' }}>Low: All systems normal <button>Good</button> <button>Irrelevant</button></li>
      </ul>
    </div>
  );
}

export default Alerts;
