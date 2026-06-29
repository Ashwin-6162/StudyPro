import React from 'react';
import { Search } from 'lucide-react';
import './UI.css';

export function Input({ type = 'text', label, iconLeft: IconLeft, iconRight: IconRight, className = '', id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  const InputElement = (
    <div className={`input-with-icon ${className}`}>
      {IconLeft && <IconLeft size={16} className="input-icon-left" aria-hidden="true" />}
      <input type={type} id={inputId} className="input-field" aria-label={label} {...props} />
      {IconRight && <IconRight size={16} className="input-icon-right" aria-hidden="true" />}
    </div>
  );

  if (label) {
    return (
      <div className="input-wrapper">
        <label htmlFor={inputId} className="text-caption font-medium">{label}</label>
        {InputElement}
      </div>
    );
  }

  if (IconLeft || IconRight) return InputElement;
  
  return <input type={type} id={inputId} className={`input-field ${className}`} aria-label={props.placeholder} {...props} />;
}

export function SearchField({ label = 'Search', ...props }) {
  return <Input type="search" iconLeft={Search} placeholder="Search..." aria-label={label} {...props} />;
}

export function Textarea({ className = '', label, id, ...props }) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  if (label) {
    return (
      <div className="input-wrapper">
        <label htmlFor={textareaId} className="text-caption font-medium">{label}</label>
        <textarea id={textareaId} className={`textarea-field ${className}`} aria-label={label} {...props} />
      </div>
    );
  }
  return <textarea id={textareaId} className={`textarea-field ${className}`} aria-label={props.placeholder} {...props} />;
}
