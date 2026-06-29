import React from 'react';
import { AlertTriangle, Ghost, FileUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './AI.css';

export function LoadingSkeleton({ lines = 3, type = 'text' }) {
  if (type === 'card') {
    return (
      <div className="ai-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
        <div className="skeleton" style={{ height: '24px', width: '60%' }} />
        <div className="skeleton" style={{ height: '16px', width: '100%' }} />
        <div className="skeleton" style={{ height: '16px', width: '80%' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', padding: 'var(--spacing-12) 0' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton" 
          style={{ height: '16px', width: i === lines - 1 ? '60%' : '100%' }} 
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Ghost, action }) {
  return (
    <div className="empty-state">
      <Icon size={48} className="empty-state-icon" />
      <h3 className="text-title font-medium">{title}</h3>
      <p className="text-body text-muted mt-2 mb-4 max-w-md">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="error-state">
      <AlertTriangle size={48} className="error-state-icon" />
      <h3 className="text-title font-medium text-error">{title}</h3>
      <p className="text-body text-muted mt-2 mb-4 max-w-md">{description}</p>
      {onRetry && (
        <button 
          className="btn btn-outline" 
          onClick={onRetry}
          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function PDFUploadProgress({ fileName, progress }) {
  return (
    <motion.div 
      className="ai-card" 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)' }}
    >
      <div style={{ width: '40px', height: '40px', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
        <FileUp size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="text-small font-medium line-clamp-1">{fileName}</span>
          <span className="text-caption text-primary font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="progress-container" style={{ height: '4px' }}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {progress < 100 ? (
        <Loader2 size={16} className="text-muted spinner" />
      ) : (
        <div style={{ color: 'var(--color-success)' }}>Ready</div>
      )}
    </motion.div>
  );
}
