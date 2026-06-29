import React from 'react';
import { FileText, ExternalLink, GitGraph, BarChart, Clock, MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import './AI.css';

export function CitationCard({ number, sourceTitle, content, onClick }) {
  return (
    <a href="#" className="citation-inline" onClick={(e) => { e.preventDefault(); onClick?.(); }} title={sourceTitle}>
      {number}
    </a>
  );
}

export function SourceCard({ title, page, preview }) {
  return (
    <div className="source-card ai-card interactive">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', color: 'var(--color-primary)' }}>
          <FileText size={16} />
          <span className="text-small font-medium">{title}</span>
        </div>
        <ExternalLink size={14} className="text-muted" />
      </div>
      <div className="text-caption text-muted">Page {page}</div>
      {preview && <p className="text-caption text-secondary line-clamp-2" style={{ marginTop: 'var(--spacing-4)' }}>"{preview}"</p>}
    </div>
  );
}

export function DiagramCard({ title, children }) {
  return (
    <div className="ai-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', marginBottom: 'var(--spacing-12)' }}>
        <GitGraph size={16} className="text-secondary" />
        <span className="text-small font-medium">{title || 'Generated Diagram'}</span>
      </div>
      <div className="diagram-card">
        {children || <span className="text-muted text-small">Diagram rendering here...</span>}
      </div>
    </div>
  );
}

export function PDFPreviewCard({ fileName, fileSize, thumbnail }) {
  return (
    <div className="ai-card interactive" style={{ display: 'flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
      <div style={{ width: '60px', height: '80px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {thumbnail ? <img src={thumbnail} alt="PDF Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={24} className="text-muted" />}
      </div>
      <div style={{ flex: 1 }}>
        <h4 className="text-small font-medium">{fileName}</h4>
        <p className="text-caption text-muted">{fileSize}</p>
      </div>
    </div>
  );
}

export function AnswerCard({ children }) {
  return (
    <div className="ai-card" style={{ padding: 'var(--spacing-24)', backgroundColor: 'var(--color-surface-elevated)' }}>
      {children}
    </div>
  );
}

export function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <div className="ai-card interactive" onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      <div style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
        <Icon size={16} />
      </div>
      <h4 className="text-small font-medium mt-2">{title}</h4>
      <p className="text-caption text-muted">{description}</p>
    </div>
  );
}

export function QuickActionGrid({ children }) {
  return (
    <div className="quick-action-grid">
      {children}
    </div>
  );
}

export function MCQCard({ question, options = [], selected, onSelect }) {
  return (
    <div className="ai-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h4 className="text-body font-medium">{question}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
        {options.map((opt, idx) => (
          <button 
            key={idx}
            className={`ai-card interactive ${selected === idx ? 'selected' : ''}`}
            onClick={() => onSelect?.(idx)}
            style={{ 
              padding: 'var(--spacing-12)', 
              textAlign: 'left',
              border: selected === idx ? '1px solid var(--color-primary)' : undefined,
              backgroundColor: selected === idx ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : undefined
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'center' }}>
              <span className="text-small" style={{ fontWeight: 'bold', color: selected === idx ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="text-small" style={{ color: selected === idx ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {opt}
              </span>
              {selected === idx && <CheckCircle2 size={16} className="text-primary" style={{ marginLeft: 'auto' }} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function QuestionCard({ title, tags = [] }) {
  return (
    <div className="ai-card interactive">
      <h4 className="text-small font-medium">{title}</h4>
      <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--spacing-8)' }}>
        {tags.map((tag, i) => (
          <span key={i} className="text-caption" style={{ padding: '2px 8px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '4px', color: 'var(--color-text-muted)' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RecentDocumentCard({ title, date, onClick }) {
  return (
    <div className="ai-card interactive" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)', cursor: onClick ? 'pointer' : 'default' }}>
      <FileText size={18} className="text-secondary" />
      <div style={{ flex: 1 }}>
        <h4 className="text-small line-clamp-1">{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          <Clock size={12} />
          <span className="text-caption">{date}</span>
        </div>
      </div>
    </div>
  );
}

export function StudyStatisticsCard({ title, value, trend, icon: Icon }) {
  return (
    <div className="ai-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="text-small text-muted">{title}</p>
          <h2 className="text-h2 mt-1">{value}</h2>
        </div>
        <div style={{ color: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', padding: '8px', borderRadius: '8px' }}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <p className="text-caption mt-4" style={{ color: trend > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
          {trend > 0 ? '+' : ''}{trend}% from last week
        </p>
      )}
    </div>
  );
}

export function RecentChatCard({ title, date, preview, onClick }) {
  return (
    <div className="ai-card interactive" onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-12)', cursor: onClick ? 'pointer' : 'default' }}>
      <MessageSquare size={18} className="text-primary mt-1" />
      <div style={{ flex: 1 }}>
        <h4 className="text-small font-medium line-clamp-1">{title}</h4>
        <p className="text-caption text-muted line-clamp-2 mt-1">{preview}</p>
        <span className="text-caption text-muted mt-2 inline-block">{date}</span>
      </div>
    </div>
  );
}
