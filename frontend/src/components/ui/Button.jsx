import React from 'react';
import { Loader2 } from 'lucide-react';
import './UI.css';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  isLoading = false, 
  icon: Icon,
  disabled,
  className = '',
  fullWidth = false,
  ...props 
}) {
  const baseClass = variant === 'icon' ? 'btn-icon' : 'btn';
  const variantClass = variant !== 'icon' ? `btn-${variant}` : '';
  const sizeClass = variant !== 'icon' ? `btn-${size}` : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="spinner" size={size === 'large' ? 20 : 16} />}
      {!isLoading && Icon && <Icon size={size === 'large' ? 20 : 16} />}
      {children}
    </button>
  );
}
