import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { ToastContainer } from '../ui/Feedback';

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onCollapseChange={setSidebarCollapsed}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: sidebarCollapsed ? '80px' : '280px',
        transition: 'margin-left 250ms ease-in-out',
      }}>
        <TopNavigation
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-32)' }}>
          <Outlet />
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      <style>{`
        @media (max-width: 768px) {
          /* on mobile, sidebar is a drawer overlay so no margin needed */
          .main-offset { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
