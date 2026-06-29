import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import './AI.css';

export function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

export function UserChatBubble({ content, user = { name: 'Student' } }) {
  return (
    <motion.div 
      className="chat-message-wrapper user"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="chat-bubble user">
        <MarkdownRenderer content={content} />
      </div>
      <div className="chat-avatar user">
        {user.name.charAt(0).toUpperCase()}
      </div>
    </motion.div>
  );
}

export function AIChatBubble({ content, isStreaming = false }) {
  return (
    <motion.div 
      className="chat-message-wrapper"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="chat-avatar ai">
        <Sparkles size={16} />
      </div>
      <div className="chat-bubble ai">
        <MarkdownRenderer content={content} />
        {isStreaming && <TypingIndicator />}
      </div>
    </motion.div>
  );
}

export function StreamingResponseBubble() {
  return (
    <div className="chat-message-wrapper">
      <div className="chat-avatar ai">
        <Sparkles size={16} />
      </div>
      <div className="chat-bubble ai">
        <TypingIndicator />
      </div>
    </div>
  );
}
