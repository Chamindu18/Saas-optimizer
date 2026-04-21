import React from 'react';

function Navbar({ title = 'Dashboard' }) {
  return (
    <div className="navbar">
      <h1 className="navbar-title">{title}</h1>
    </div>
  );
}

export default Navbar;
