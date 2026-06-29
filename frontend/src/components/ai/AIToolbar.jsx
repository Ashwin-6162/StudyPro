import React from 'react';
import { Copy, RefreshCw, Download, Bookmark, ThumbsUp, ThumbsDown, GitGraph, ListChecks, FileText, LayoutTemplate, MessageSquare } from 'lucide-react';
import './AI.css';

export function AnswerActionToolbar({ onAction }) {
  const actions = [
    { id: 'copy', icon: Copy, label: 'Copy' },
    { id: 'regenerate', icon: RefreshCw, label: 'Regenerate' },
    { id: 'download', icon: Download, label: 'Download' },
    { id: 'bookmark', icon: Bookmark, label: 'Bookmark' },
    { id: 'like', icon: ThumbsUp, label: 'Like' },
    { id: 'dislike', icon: ThumbsDown, label: 'Dislike' },
  ];

  const generateActions = [
    { id: 'gen-diagram', icon: GitGraph, label: 'Diagram' },
    { id: 'gen-mcqs', icon: ListChecks, label: 'MCQs' },
    { id: 'gen-summary', icon: FileText, label: 'Summary' },
    { id: 'gen-flashcards', icon: LayoutTemplate, label: 'Flashcards' },
  ];

  return (
    <div className="answer-toolbar">
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {actions.map(action => (
          <button 
            key={action.id} 
            className="toolbar-btn"
            onClick={() => onAction?.(action.id)}
            title={action.label}
          >
            <action.icon size={14} />
          </button>
        ))}
      </div>
      <div style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 8px' }} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {generateActions.map(action => (
          <button 
            key={action.id} 
            className="toolbar-btn"
            onClick={() => onAction?.(action.id)}
          >
            <action.icon size={14} />
            <span className="hidden-mobile">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SuggestedPromptChips({ prompts = [], onSelect }) {
  if (!prompts.length) return null;
  return (
    <div className="chips-container">
      {prompts.map((prompt, index) => (
        <button 
          key={index} 
          className="prompt-chip"
          onClick={() => onSelect?.(prompt)}
        >
          <MessageSquare size={14} />
          {prompt}
        </button>
      ))}
    </div>
  );
}
