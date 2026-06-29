import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, MessageSquarePlus, Files, MessageSquare, HelpCircle,
  Clock, PenTool, GitGraph, ListChecks, FileQuestion, FileText, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  StudyStatisticsCard, QuickActionCard, QuickActionGrid,
  RecentDocumentCard, RecentChatCard
} from '../../components/ai/AICards';
import { SuggestedPromptChips } from '../../components/ai/AIToolbar';
import { EmptyState } from '../../components/ai/AIStates';
import { getFiles } from '../../services/api';
import useStore from '../../store/useStore';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFiles()
      .then(res => setDocs(res.data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const readyDocs   = docs.filter(d => d.processing_status === 'READY_FOR_RETRIEVAL');
  const recentDocs  = docs.slice(0, 5);
  const hasDocuments = docs.length > 0;

  const stats = [
    { title: 'Documents Uploaded', value: String(docs.length), trend: null, icon: Files },
    { title: 'Ready for AI',       value: String(readyDocs.length), trend: null, icon: MessageSquare },
    { title: 'Processing',         value: String(docs.filter(d => !['READY_FOR_RETRIEVAL','FAILED'].includes(d.processing_status)).length), trend: null, icon: HelpCircle },
    { title: 'Total',              value: String(docs.length), trend: null, icon: Clock },
  ];

  const suggestedPrompts = [
    'Summarize this PDF', 'Generate MCQs', 'Explain simply',
    'Create flashcards', 'Generate 15 Mark Answer', 'Extract diagrams'
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!hasDocuments) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <EmptyState
          title="No study materials yet."
          description="Upload your syllabus, notes, or textbook PDFs to get started."
          icon={FileText}
          action={
            <Button variant="primary" icon={FileUp} style={{ marginTop: 'var(--spacing-16)' }}
              onClick={() => navigate('/study')}>
              Upload your first PDF
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="visible"
      style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-48)' }}>

      {/* WELCOME */}
      <motion.section variants={item}>
        <h1 className="text-display">Welcome back, {firstName} 👋</h1>
        <p className="text-body-large text-muted" style={{ marginTop: 'var(--spacing-8)' }}>
          Continue learning where you left off.
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-16)', marginTop: 'var(--spacing-24)', flexWrap: 'wrap' }}>
          <Button variant="primary"    icon={FileUp}           onClick={() => navigate('/study')}>Upload PDF</Button>
          <Button variant="secondary"  icon={MessageSquarePlus} onClick={() => navigate('/chat')}>Start New Chat</Button>
        </div>
      </motion.section>

      {/* STATS */}
      <motion.section variants={item}>
        <h3 className="text-title" style={{ marginBottom: 'var(--spacing-16)' }}>Study Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-16)' }}>
          {stats.map((s, i) => <StudyStatisticsCard key={i} {...s} />)}
        </div>
      </motion.section>

      {/* QUICK ACTIONS */}
      <motion.section variants={item}>
        <h3 className="text-title" style={{ marginBottom: 'var(--spacing-16)' }}>Quick Actions</h3>
        <QuickActionGrid>
          <QuickActionCard icon={FileUp}       title="Upload PDF"              description="Add new study material"        onClick={() => navigate('/study')} />
          <QuickActionCard icon={MessageSquare} title="Chat with PDF"           description="Ask questions interactively"   onClick={() => navigate('/chat')} />
          <QuickActionCard icon={PenTool}       title="Generate 2 Mark Answer"  description="Quick concise answers"         onClick={() => navigate('/exams')} />
          <QuickActionCard icon={PenTool}       title="Generate 8 Mark Answer"  description="Detailed explanations"         onClick={() => navigate('/exams')} />
          <QuickActionCard icon={PenTool}       title="Generate 15 Mark Answer" description="Comprehensive essays"          onClick={() => navigate('/exams')} />
          <QuickActionCard icon={GitGraph}      title="Generate Diagram"        description="Visual representations"        onClick={() => navigate('/diagrams')} />
          <QuickActionCard icon={ListChecks}    title="Generate MCQs"           description="Test your knowledge"           onClick={() => navigate('/mcq')} />
          <QuickActionCard icon={FileQuestion}  title="Question Paper"          description="Mock exams instantly"          onClick={() => navigate('/question-papers')} />
        </QuickActionGrid>
      </motion.section>

      {/* RECENT DOCS & CHATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--spacing-32)' }}>
        <motion.section variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="text-title">Recent Documents</h3>
            <Button variant="ghost" onClick={() => navigate('/study')}>View All</Button>
          </div>
          {recentDocs.length === 0
            ? <p className="text-small text-muted">No documents yet.</p>
            : recentDocs.map(doc => (
                <RecentDocumentCard
                  key={doc.id}
                  title={doc.original_filename}
                  date={new Date(doc.upload_timestamp).toLocaleDateString()}
                  onClick={() => navigate('/study')}
                />
              ))
          }
        </motion.section>

        <motion.section variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="text-title">Quick Start</h3>
          </div>
          <RecentChatCard
            title="Chat with your documents"
            preview="Select a document and start asking questions to get AI-powered answers."
            date=""
            onClick={() => navigate('/chat')}
          />
          <RecentChatCard
            title="Generate MCQ Quiz"
            preview="Test your knowledge with AI-generated multiple choice questions."
            date=""
            onClick={() => navigate('/mcq')}
          />
        </motion.section>
      </div>

      {/* SUGGESTED PROMPTS */}
      <motion.section variants={item}>
        <h3 className="text-title" style={{ marginBottom: 'var(--spacing-8)' }}>Suggested Prompts</h3>
        <p className="text-small text-muted" style={{ marginBottom: 'var(--spacing-16)' }}>
          Click any prompt to go to the Answer Generator
        </p>
        <SuggestedPromptChips prompts={suggestedPrompts} onSelect={() => navigate('/exams')} />
      </motion.section>

    </motion.div>
  );
}
