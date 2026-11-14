/**
 * Loading Spinner Component
 */

import React from 'react';
import './Spinner.css';

export function Spinner({ size = 'md', text = 'Loading...' }) {
  return (
    <div className={`spinner spinner--${size}`}>
      <div className="spinner__content">
        <div className="spinner__circle"></div>
        {text && <p className="spinner__text">{text}</p>}
      </div>
    </div>
  );
}

export default Spinner;
