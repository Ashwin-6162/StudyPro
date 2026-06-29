import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ChevronDown, Wand2, Sparkles, AlignLeft, List, BookOpen,
  LayoutTemplate, PenTool, MessageSquare, Loader2, GitGraph, FileImage, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { ToggleSwitch, Select } from '../../components/ui/FormControls';
import { AnswerActionToolbar, SuggestedPromptChips } from '../../components/ai/AIToolbar';
import { MarkdownRenderer } from '../../components/ai/MarkdownRenderer';
import { EmptyState } from '../../components/ai/AIStates';
import { getFiles, generate8mAnswer, generate15mAnswer } from '../../services/api';
import './ExamsView.css';

const ANSWER_TYPES = [
  { id: '8mark',  label: '8 Mark Answer',  desc: 'Detailed explanation', icon: List },
  { id: '15mark', label: '15 Mark Answer', desc: 'Comprehensive essay',  icon: BookOpen },
  { id: '2mark',  label: '2 Mark Answer',  desc: 'Short & precise',      icon: AlignLeft },
  { id: 'summary',label: 'Summary',        desc: 'High-level overview',  icon: LayoutTemplate },
];

export default function ExamsView() {
  const [docs, setDocs]             = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDocName, setSelectedDocName] = useState('No document selected');
  const [question, setQuestion]     = useState('');
  const [answerType, setAnswerType] = useState('8mark');
  const [formatMode, setFormatMode] = useState('paragraph');
  const [options, setOptions]       = useState({ citations: true, diagrams: false });

  const [isGenerating, setIsGenerating]   = useState(false);
  const [hasGenerated, setHasGenerated]   = useState(false);
  const [loadingPhase, setLoadingPhase]   = useState('');
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState('');

  useEffect(() => {
    getFiles().then(r => {
      const ready = (r.data || []).filter(d => d.processing_status === 'READY_FOR_RETRIEVAL');
      setDocs(ready);
      if (ready.length > 0) {
        setSelectedDocId(ready[0].id);
        setSelectedDocName(ready[0].original_filename);
      }
    }).catch(() => {});
  }, []);

  const handleDocChange = (e) => {
    const id = e.target.value;
    setSelectedDocId(id);
    const doc = docs.find(d => d.id === id);
    setSelectedDocName(doc?.original_filename || '');
    setResult(null);
    setHasGenerated(false);
  };

  const handleGenerate = async () => {
    if (!question.trim()) return;
    setIsGenerating(true);
    setHasGenerated(true);
    setResult(null);
    setError('');

    const phases = ['Reading document…', 'Thinking…', 'Writing answer…'];
    let pi = 0;
    setLoadingPhase(phases[0]);
    const phaseTimer = setInterval(() => {
      pi = Math.min(pi + 1, phases.length - 1);
      setLoadingPhase(phases[pi]);
    }, 1200);

    try {
      let res;
      if (answerType === '15mark') {
        res = await generate15mAnswer(question, selectedDocId || null, formatMode);
      } else {
        res = await generate8mAnswer(question, selectedDocId || null, formatMode);
      }
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Generation failed.');
    } finally {
      clearInterval(phaseTimer);
      setIsGenerating(false);
    }
  };

  return (
    <div className="answer-generator-container">
      {/* LEFT: Config */}
      <div className="config-panel">
        <header>
          <h1 className="text-title font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ color: 'var(--color-primary)' }} /> AI Answer Generator
          </h1>
          <p className="text-body text-muted" style={{ marginTop: 'var(--spacing-8)' }}>
            Generate high-quality academic answers from your study material.
          </p>
        </header>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Document Source</h3>
          {docs.length === 0 ? (
            <p className="text-small text-muted">No indexed documents yet — upload one in Documents.</p>
          ) : (
            <div className="doc-selector">
              <FileText size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <select value={selectedDocId} onChange={handleDocChange}
                style={{ flex: 1, background: 'transparent', border: 'none',
                  color: 'var(--color-text-primary)', fontFamily: 'inherit',
                  fontSize: 'var(--text-small-size)', cursor: 'pointer' }}>
                {docs.map(d => (
                  <option key={d.id} value={d.id} style={{ background: 'var(--color-surface)' }}>
                    {d.original_filename}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            </div>
          )}
        </section>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Your Question</h3>
          <Textarea
            placeholder="Ask any academic question…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={4}
          />
        </section>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Answer Type</h3>
          <div className="answer-type-grid">
            {ANSWER_TYPES.map(t => (
              <div key={t.id} className={`answer-type-card ${answerType === t.id ? 'active' : ''}`}
                onClick={() => setAnswerType(t.id)}>
                <div className="answer-type-card-header">
                  <t.icon size={16} style={{ color: answerType === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                  {t.label}
                </div>
                <div className="answer-type-card-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Options</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
            <Select label="Format" value={formatMode} onChange={e => setFormatMode(e.target.value)}
              options={[{value:'paragraph',label:'Paragraph'},{value:'bullet',label:'Bullet Points'}]} />
            <ToggleSwitch label="Show Citations" checked={options.citations}
              onChange={() => setOptions(p => ({...p, citations: !p.citations}))} />
          </div>
        </section>

        <div className="generate-btn-container">
          <Button variant="primary" fullWidth size="large"
            icon={isGenerating ? Loader2 : Wand2}
            onClick={handleGenerate}
            disabled={!question.trim() || isGenerating}>
            {isGenerating ? loadingPhase : 'Generate Answer'}
          </Button>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="preview-panel">
        {!hasGenerated ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="Ask your first question." description="Configure your parameters on the left and hit generate." icon={MessageSquare} />
          </div>
        ) : (
          <div className="preview-content">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
                  {[60, 100, 100, 80, 40].map((w, i) => (
                    <div key={i} className="skeleton" style={{ height: i === 0 ? '28px' : '16px', width: `${w}%`, borderRadius: '6px' }} />
                  ))}
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: 'var(--spacing-16)', backgroundColor: 'rgba(239,68,68,0.1)',
                    borderRadius: 'var(--radius-12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p className="text-body font-medium" style={{ color: 'var(--color-error)' }}>Generation failed</p>
                    <p className="text-small" style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>{error}</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h2 className="text-title font-medium">{result.topic || question}</h2>
                      <p className="text-caption text-muted" style={{ marginTop: '4px' }}>
                        {result.answer_type} · {result.word_count} words
                        {result.processing_time && ` · ${result.processing_time.toFixed(1)}s`}
                      </p>
                    </div>
                  </div>

                  <AnswerActionToolbar onAction={(a) => {
                    if (a === 'copy') navigator.clipboard.writeText(result.answer);
                  }} />

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-24)' }}>
                    <MarkdownRenderer content={result.answer} />
                  </div>

                  {options.citations && result.citations?.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-24)' }}>
                      <h4 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>
                        Citations ({result.citations.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                        {result.citations.map((c, i) => (
                          <div key={i} style={{ padding: 'var(--spacing-12)', backgroundColor: 'var(--color-surface-elevated)',
                            borderRadius: 'var(--radius-8)', border: '1px solid var(--color-border)' }}>
                            <p className="text-small font-medium">
                              [{i+1}] {c.file_name} — Page{c.pages?.length > 1 ? 's' : ''} {c.pages?.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-24)' }}>
                    <h4 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Follow-up</h4>
                    <SuggestedPromptChips
                      prompts={['Explain in simple terms', 'Generate MCQs from this', 'Compare with another concept']}
                      onSelect={(p) => { setQuestion(p); setHasGenerated(false); }}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
