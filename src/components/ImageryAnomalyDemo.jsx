import React from 'react';
import './Dashboard.css';

function ImageryAnomalyDemo() {
  return (
    <div className="imagery-anomaly-demo">
      <h2>Imagery Anomaly Demo</h2>
      <img
        src="/public/sample-image.jpg"
        alt="Pear Rust Detection"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        style={{ width: '100%', maxWidth: '400px' }}
      />
      <p>Average Fruit Size: 45mm</p>
    </div>
  );
}

export default ImageryAnomalyDemo;
