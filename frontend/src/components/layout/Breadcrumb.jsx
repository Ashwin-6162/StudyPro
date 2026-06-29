import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import './Navigation.css';

export function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <motion.nav 
      className="breadcrumb text-small"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb"
    >
      <a href="#" className="breadcrumb-item">
        <Home size={16} />
      </a>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="breadcrumb-separator" />
          <a 
            href={item.href || '#'} 
            className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`}
            aria-current={index === items.length - 1 ? 'page' : undefined}
          >
            {item.label}
          </a>
        </React.Fragment>
      ))}
    </motion.nav>
  );
}
