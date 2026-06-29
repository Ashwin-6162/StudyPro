import React, { useState, useRef, useEffect } from 'react';
import { Bell, FileText, BrainCircuit, ListChecks, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navigation.css';

const MOCK_NOTIFICATIONS = [
  { id: 1, icon: FileText,    color: 'var(--color-primary)',   title: 'Document ready',        body: 'Your PDF has been indexed and is ready for AI chat.', time: '2 min ago' },
  { id: 2, icon: BrainCircuit,color: 'var(--color-accent)',   title: 'MCQ generation complete', body: '20 questions generated from Data Structures.pdf.',      time: '1 hr ago' },
  { id: 3, icon: ListChecks,  color: 'var(--color-secondary)', title: 'Answer generated',       body: 'Your 8-mark answer on B-Trees is ready to view.',       time: 'Yesterday' },
];

export function NotificationBadge() {
  const [isOpen, setIsOpen]           = useState(false);
  const [dismissed, setDismissed]     = useState([]);
  const panelRef                      = useRef(null);

  const visible = MOCK_NOTIFICATIONS.filter(n => !dismissed.includes(n.id));

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        className="notification-trigger"
        aria-label="Notifications"
        onClick={() => setIsOpen(o => !o)}
      >
        <Bell size={20} />
        {visible.length > 0 && (
          <motion.div
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '320px', backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-12)',
              boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden',
            }}
          >
            <div style={{ padding: 'var(--spacing-12) var(--spacing-16)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-small font-medium">Notifications</span>
              {visible.length > 0 && (
                <button
                  className="text-caption text-muted"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                  onClick={() => setDismissed(MOCK_NOTIFICATIONS.map(n => n.id))}
                >
                  Clear all
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <div style={{ padding: 'var(--spacing-32)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Bell size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p className="text-small">You're all caught up!</p>
              </div>
            ) : (
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {visible.map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: 'var(--spacing-12)', padding: 'var(--spacing-12) var(--spacing-16)', borderBottom: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: n.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: n.color }}>
                      <n.icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-small font-medium">{n.title}</p>
                      <p className="text-caption text-muted" style={{ marginTop: '2px' }}>{n.body}</p>
                      <p className="text-caption" style={{ marginTop: '4px', color: 'var(--color-text-muted)', opacity: 0.7 }}>{n.time}</p>
                    </div>
                    <button
                      onClick={() => setDismissed(d => [...d, n.id])}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', flexShrink: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
