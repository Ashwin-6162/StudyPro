import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import './Navigation.css';

export function UserProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const user     = useStore((s) => s.user);
  const logout   = useStore((s) => s.logout);

  const name    = user?.name  || 'Student';
  const email   = user?.email || 'student@examgpt.com';
  const picture = user?.picture || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <div className="user-profile" ref={menuRef}>
      <button
        className="user-profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="user-avatar" style={picture ? { backgroundImage: `url(${picture})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          {!picture && name.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <span className="user-name">{name}</span>
          <span className="user-email">{email}</span>
        </div>
        <ChevronDown
          size={16}
          className="text-muted"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="user-menu-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {/* User info header */}
            <div style={{ padding: 'var(--spacing-12) var(--spacing-16) var(--spacing-8)', borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-small font-medium">{name}</p>
              <p className="text-caption text-muted">{email}</p>
            </div>

            <button className="user-menu-item" onClick={() => { navigate('/settings'); setIsOpen(false); }}>
              <User size={16} />
              <span className="text-small">Profile</span>
            </button>
            <button className="user-menu-item" onClick={() => { navigate('/settings'); setIsOpen(false); }}>
              <Settings size={16} />
              <span className="text-small">Settings</span>
            </button>

            <div className="user-menu-divider" />

            <button className="user-menu-item" style={{ color: 'var(--color-error)' }} onClick={handleLogout}>
              <LogOut size={16} />
              <span className="text-small">Log out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
