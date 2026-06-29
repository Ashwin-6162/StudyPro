import React from 'react';
import './UI.css';

export function Checkbox({ checked, onChange, label, disabled = false, id }) {
  return (
    <label className="checkbox-container" htmlFor={id}>
      <input 
        type="checkbox" 
        id={id}
        className="checkbox-input"
        checked={checked} 
        onChange={onChange}
        disabled={disabled}
      />
      {label && <span className="text-small" style={{ opacity: disabled ? 0.5 : 1 }}>{label}</span>}
    </label>
  );
}

export function RadioButton({ checked, onChange, label, disabled = false, id, name }) {
  return (
    <label className="radio-container" htmlFor={id}>
      <input 
        type="radio" 
        id={id}
        name={name}
        className="radio-input"
        checked={checked} 
        onChange={onChange}
        disabled={disabled}
      />
      {label && <span className="text-small" style={{ opacity: disabled ? 0.5 : 1 }}>{label}</span>}
    </label>
  );
}

export function ToggleSwitch({ checked, onChange, disabled = false, label, id }) {
  return (
    <label className="checkbox-container" htmlFor={id} style={{ display: 'inline-flex' }}>
      <div 
        className={`toggle-switch ${checked ? 'on' : ''}`}
        style={{ opacity: disabled ? 0.5 : 1 }}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange?.(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange?.(!checked);
          }
        }}
      >
        <div className="toggle-thumb" />
      </div>
      {label && <span className="text-small" style={{ opacity: disabled ? 0.5 : 1 }}>{label}</span>}
    </label>
  );
}

export function Select({ options = [], value, defaultValue, onChange, disabled = false, label, id, className = '', ...props }) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  const selectElement = (
    <div style={{ position: 'relative', width: '100%' }}>
      <select 
        id={selectId}
        className={`input-field ${className}`} 
        style={{ appearance: 'none', paddingRight: 'var(--spacing-32)', cursor: disabled ? 'not-allowed' : 'pointer' }}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  );

  if (label) {
    return (
      <div className="input-wrapper">
        <label htmlFor={selectId} className="text-caption font-medium">{label}</label>
        {selectElement}
      </div>
    );
  }

  return selectElement;
}
