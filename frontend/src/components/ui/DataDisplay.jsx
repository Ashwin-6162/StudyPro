import React from 'react';
import './UI.css';

export function ProgressBar({ progress = 0, className = '' }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`progress-container ${className}`} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar" style={{ width: `${clampedProgress}%` }} />
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
