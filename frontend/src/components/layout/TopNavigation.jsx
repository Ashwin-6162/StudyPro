import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Breadcrumb } from './Breadcrumb';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBadge } from './NotificationBadge';
import { UserProfileMenu } from './UserProfileMenu';
import './Navigation.css';

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/chat': 'Chat',
  '/study': 'Documents',
  '/exams': 'Answer Generator',
  '/mcq': 'MCQ Generator',
  '/diagrams': 'Diagrams',
  '/question-papers': 'Question Papers',
  '/history': 'History',
  '/settings': 'Settings',
};

export function TopNavigation({ onMenuClick }) {
  const location = useLocation();
  const path = location.pathname;

  const breadcrumbItems = [];
  if (path !== '/') {
    breadcrumbItems.push({ label: ROUTE_LABELS[path] || path.replace('/', ''), href: path });
  }

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <button
          className="notification-trigger mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="top-nav-right animate-fade">
        <SearchBar />
        <ThemeToggle />
        <NotificationBadge />
        <UserProfileMenu />
      </div>
    </header>
  );
}
