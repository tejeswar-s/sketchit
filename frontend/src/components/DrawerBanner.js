// frontend/src/components/DrawerBanner.js
import React from 'react';

const DrawerBanner = ({ word }) => {
  return (
    <div className="drawer-banner">
      <p><strong>You are drawing:</strong> {word}</p>
    </div>
  );
};

export default DrawerBanner;
