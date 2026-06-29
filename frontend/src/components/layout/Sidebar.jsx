import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  FileText, 
  ListChecks, 
  FileQuestion, 
  History, 
  Settings, 
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navigation.css';

const navItems = [
  { icon: LayoutDashboard,  label: 'Dashboard',       id: 'dashboard',       path: '/' },
  { icon: MessageSquarePlus,label: 'New Chat',         id: 'new-chat',        path: '/chat' },
  { icon: FileText,         label: 'Documents',        id: 'documents',       path: '/study' },
  { icon: Sparkles,         label: 'Answer Generator', id: 'exams',           path: '/exams' },
  { icon: ListChecks,       label: 'MCQs',             id: 'mcqs',            path: '/mcq' },
  { icon: FileQuestion,     label: 'Question Papers',  id: 'question-papers', path: '/question-papers' },
];

const secondaryNavItems = [
  { icon: History, label: 'History', id: 'history', path: '/history' },
];

const bottomNavItems = [
  { icon: Settings, label: 'Settings', id: 'settings', path: '/settings' },
  { icon: User, label: 'Profile', id: 'profile', path: '/settings' },
];

export function Sidebar({ mobileOpen, onMobileClose, onCollapseChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto collapse on smaller screens (tablet)
  useEffect(() => {
    const handleResize = () => {
      const collapsed = window.innerWidth <= 1024 && window.innerWidth > 768;
      setIsCollapsed(collapsed);
      onCollapseChange?.(collapsed);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapseChange?.(next);
  };

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    
    return (
      <button 
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => {
          if (item.path) {
            navigate(item.path);
          }
          if (window.innerWidth <= 768 && onMobileClose) {
            onMobileClose();
          }
        }}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="sidebar-item-icon" />
        <span className="sidebar-item-label text-body">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-title"
              style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}
            >
              StudyPro
            </motion.div>
          )}
          <button 
            className="notification-trigger hidden-mobile" 
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            <div className="sidebar-nav-title text-caption">Menu</div>
            {navItems.map(item => <NavButton key={item.id} item={item} />)}
          </div>

          <div className="sidebar-nav-group">
            <div className="sidebar-nav-title text-caption">Library</div>
            {secondaryNavItems.map(item => <NavButton key={item.id} item={item} />)}
          </div>
          
          <div style={{ flex: 1 }} />
          
          <div className="sidebar-nav-group" style={{ marginBottom: 0 }}>
            {bottomNavItems.map(item => <NavButton key={item.id} item={item} />)}
          </div>
        </nav>
      </aside>
    </>
  );
}
