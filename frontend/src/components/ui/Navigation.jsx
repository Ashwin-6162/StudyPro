import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './UI.css';

export function Tabs({ tabs = [], defaultActive = '', onChange }) {
  const [activeTab, setActiveTab] = useState(defaultActive || (tabs[0] ? tabs[0].id : ''));

  const handleTabClick = (id) => {
    setActiveTab(id);
    onChange?.(id);
  };

  return (
    <div className="tabs-container">
      <div className="tabs-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-trigger ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="tab-indicator"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="tabs-content" style={{ paddingTop: 'var(--spacing-16)' }}>
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

export function Dropdown({ trigger, items = [], onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dropdown-content"
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ top: 'calc(100% + var(--spacing-4))', left: 0 }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                className="dropdown-item"
                onClick={() => {
                  onSelect?.(item);
                  setIsOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
