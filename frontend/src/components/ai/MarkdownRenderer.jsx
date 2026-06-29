import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AI.css';

export function CodeBlock({ language, value }) {
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language || 'text'}</span>
        <button 
          className="toolbar-btn" 
          onClick={() => navigator.clipboard.writeText(value)}
          aria-label="Copy code"
        >
          Copy
        </button>
      </div>
      <div className="code-block-content">
        <code>{value}</code>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <CodeBlock 
                language={match[1]} 
                value={String(children).replace(/\n$/, '')} 
              />
            ) : (
              <code className={className} style={{ backgroundColor: 'var(--color-surface-elevated)', padding: '2px 4px', borderRadius: '4px' }} {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return <div style={{ overflowX: 'auto' }}><table>{children}</table></div>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
