import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AIPromptInput } from '../../components/ui/AIPromptInput';
import { UserChatBubble, AIChatBubble, StreamingResponseBubble } from '../../components/ai/AIChat';
import { SuggestedPromptChips } from '../../components/ai/AIToolbar';
import { getFiles, sendChatMessage } from '../../services/api';
import './ChatView.css';

const PROMPTS = ['Summarize this document', 'Generate 2 Mark Answer', 'Generate MCQs', 'Explain Simply'];

export default function ChatView() {
  const [activeTab, setActiveTab]         = useState('chat');
  const [docs, setDocs]                   = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDocName, setSelectedDocName] = useState('');
  const [messages, setMessages]           = useState([]);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [error, setError]                 = useState('');
  const messagesEndRef                    = useRef(null);

  // Load documents & restore last selected doc from navigation
  useEffect(() => {
    getFiles().then(r => {
      const files = (r.data || []).filter(d => d.processing_status === 'READY_FOR_RETRIEVAL');
      setDocs(files);

      // Check if coming from DocumentLibrary with a pre-selected doc
      const storedId   = sessionStorage.getItem('chatDocId');
      const storedName = sessionStorage.getItem('chatDocName');
      if (storedId && files.find(f => f.id === storedId)) {
        setSelectedDocId(storedId);
        setSelectedDocName(storedName);
        sessionStorage.removeItem('chatDocId');
        sessionStorage.removeItem('chatDocName');
      } else if (files.length > 0) {
        setSelectedDocId(files[0].id);
        setSelectedDocName(files[0].original_filename);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async (text) => {
    if (!text.trim() || isGenerating) return;
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsGenerating(true);

    try {
      const res = await sendChatMessage(text, selectedDocId || null);
      const data = res.data;
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.answer,
        citations: data.citations || [],
      }]);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Failed to get a response.';
      setError(msg);
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${msg}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocChange = (e) => {
    const id = e.target.value;
    setSelectedDocId(id);
    const doc = docs.find(d => d.id === id);
    setSelectedDocName(doc?.original_filename || '');
    setMessages([]);
    setError('');
  };

  return (
    <div className="chat-page-container">
      {/* Mobile Tabs */}
      <div className="mobile-tabs">
        <button className={`mobile-tab ${activeTab==='pdf'?'active':''}`} onClick={() => setActiveTab('pdf')}>Document</button>
        <button className={`mobile-tab ${activeTab==='chat'?'active':''}`} onClick={() => setActiveTab('chat')}>AI Chat</button>
      </div>

      {/* Document Panel */}
      <div className={`pdf-panel ${activeTab==='pdf'?'active':''}`}>
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-group">
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
            {docs.length === 0 ? (
              <span className="text-small text-muted">No documents ready for AI</span>
            ) : (
              <select
                value={selectedDocId}
                onChange={handleDocChange}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--color-text-primary)',
                  fontFamily: 'inherit', fontSize: 'var(--text-small-size)', cursor: 'pointer',
                  maxWidth: '240px',
                }}
              >
                {docs.map(d => (
                  <option key={d.id} value={d.id} style={{ background: 'var(--color-surface)' }}>
                    {d.original_filename}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="pdf-viewer-content">
          {selectedDocId ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-32)' }}>
              <FileText size={64} style={{ marginBottom: 'var(--spacing-16)', opacity: 0.4 }} />
              <p className="text-body">{selectedDocName}</p>
              <p className="text-small text-muted" style={{ marginTop: '8px' }}>
                Document is indexed and ready for AI chat.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-32)' }}>
              <p className="text-body">No document selected</p>
              <p className="text-small" style={{ marginTop: '8px' }}>
                Upload and index a PDF in Documents first.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`chat-panel ${activeTab==='chat'?'active':''}`}>
        <div className="chat-messages-area">
          {messages.length === 0 && !isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flex: 1, textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-32)' }}>
              <FileText size={48} style={{ marginBottom: 'var(--spacing-16)', opacity: 0.4 }} />
              <h3 className="text-title" style={{ marginBottom: '8px' }}>
                {selectedDocId ? `Chatting with ${selectedDocName}` : 'No document selected'}
              </h3>
              <p className="text-small">
                {selectedDocId
                  ? 'Ask any question about your document below.'
                  : 'Select a document from the panel on the left, or upload one in Documents.'}
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <React.Fragment key={i}>
                {msg.role === 'user'
                  ? <UserChatBubble content={msg.content} />
                  : <AIChatBubble content={msg.content} />}
              </React.Fragment>
            ))}
            {isGenerating && <StreamingResponseBubble />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {error && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: 'var(--spacing-8) var(--spacing-12)',
              backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-8)',
              border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <span className="text-caption" style={{ color: 'var(--color-error)' }}>{error}</span>
            </div>
          )}
          <SuggestedPromptChips prompts={PROMPTS} onSelect={handleSend} />
          <AIPromptInput
            onSend={handleSend}
            isLoading={isGenerating}
            disabled={!selectedDocId}
            placeholder={selectedDocId ? 'Ask a question about your document…' : 'Select a document first…'}
          />
        </div>
      </div>
    </div>
  );
}
