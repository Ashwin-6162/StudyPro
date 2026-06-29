import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, ArrowUp, Loader2 } from 'lucide-react';
import { Button } from './Button';
import './UI.css';

export function AIPromptInput({ onSend, isLoading = false, disabled = false, placeholder = "Ask anything..." }) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isLoading && !disabled) {
        onSend?.(prompt);
        setPrompt('');
      }
    }
  };

  const handleSend = () => {
    if (prompt.trim() && !isLoading && !disabled) {
      onSend?.(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="ai-prompt-container">
      <textarea
        ref={textareaRef}
        className="ai-prompt-input"
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        rows={1}
      />
      <div className="ai-prompt-actions">
        <div className="ai-prompt-left-actions">
          <Button variant="ghost" icon={Paperclip} disabled={disabled || isLoading} aria-label="Upload file" className="btn-icon" />
          <Button variant="ghost" icon={Mic} disabled={disabled || isLoading} aria-label="Voice input" className="btn-icon" />
        </div>
        <Button 
          variant={prompt.trim() ? "primary" : "secondary"} 
          icon={isLoading ? null : ArrowUp}
          isLoading={isLoading}
          disabled={!prompt.trim() || disabled || isLoading} 
          onClick={handleSend}
          aria-label="Send message"
          className={prompt.trim() ? '' : 'btn-icon'} // small circle if empty, maybe regular if typing
          style={{ padding: prompt.trim() ? undefined : 'var(--spacing-8)' }}
        >
          {prompt.trim() ? 'Send' : ''}
        </Button>
      </div>
    </div>
  );
}
