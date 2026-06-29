import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Sparkles, BrainCircuit, ChevronDown, Clock, Loader2,
  ChevronLeft, ChevronRight, Bookmark, Flag, CheckCircle2, XCircle,
  Download, RefreshCcw, BookOpen, Target, Activity, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ToggleSwitch, Select } from '../../components/ui/FormControls';
import { EmptyState } from '../../components/ai/AIStates';
import { getFiles, generateMCQs } from '../../services/api';
import './McqView.css';

export default function McqView() {
  // Config
  const [docs, setDocs]               = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDocName, setSelectedDocName] = useState('');
  const [topic, setTopic]             = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [examPrepMode, setExamPrepMode] = useState(false);
  const [options, setOptions]         = useState({ timer: true, randomize: false, explanations: true });

  // App state
  const [appState, setAppState]       = useState('config'); // config | generating | quiz | results
  const [quiz, setQuiz]               = useState([]);       // MCQItemSchema[]
  const [error, setError]             = useState('');
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selected, setSelected]       = useState(null);
  const [showExpl, setShowExpl]       = useState(false);
  const [score, setScore]             = useState(0);

  useEffect(() => {
    getFiles().then(r => {
      const ready = (r.data || []).filter(d => d.processing_status === 'READY_FOR_RETRIEVAL');
      setDocs(ready);
      if (ready.length > 0) { setSelectedDocId(ready[0].id); setSelectedDocName(ready[0].original_filename); }
    }).catch(() => {});
  }, []);

  const handleDocChange = (e) => {
    const id = e.target.value;
    setSelectedDocId(id);
    const doc = docs.find(d => d.id === id);
    setSelectedDocName(doc?.original_filename || '');
  };

  const handleGenerate = async () => {
    setAppState('generating');
    setError('');
    setScore(0);
    try {
      const res = await generateMCQs(selectedDocId || null, topic || null, numQuestions, examPrepMode);
      const questions = res.data.questions || [];
      if (!questions.length) throw new Error('No questions were returned.');
      setQuiz(questions);
      setCurrentQIdx(0);
      setSelected(null);
      setShowExpl(false);
      setAppState('quiz');
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'MCQ generation failed.');
      setAppState('config');
    }
  };

  const handleOptionSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = quiz[currentQIdx];
    const correctIdx = ['A','B','C','D'].indexOf(q.correct_answer);
    if (idx === correctIdx) setScore(s => s + 1);
    if (options.explanations) setShowExpl(true);
  };

  const handleNext = () => {
    if (currentQIdx < quiz.length - 1) {
      setCurrentQIdx(i => i + 1);
      setSelected(null);
      setShowExpl(false);
    } else {
      setAppState('results');
    }
  };

  const q = quiz[currentQIdx];

  return (
    <div className="mcq-page-container">
      {/* LEFT: Config */}
      <div className="mcq-config-panel">
        <header>
          <h1 className="text-title font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit style={{ color: 'var(--color-primary)' }} /> MCQ Generator
          </h1>
          <p className="text-body text-muted" style={{ marginTop: 'var(--spacing-8)' }}>
            AI-generated multiple choice questions from your documents.
          </p>
        </header>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Document</h3>
          {docs.length === 0 ? (
            <p className="text-small text-muted">No indexed documents — upload one first.</p>
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
          <div style={{ marginTop: 'var(--spacing-12)' }}>
            <Input label="Topic / Chapter (optional)" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Chapter 4: Trees, or leave blank for full doc" />
          </div>
        </section>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Number of Questions</h3>
          <div className="number-select-grid">
            {[5, 10, 20, 30].map(n => (
              <div key={n} className={`number-card ${numQuestions === n ? 'active' : ''}`}
                onClick={() => setNumQuestions(n)}>{n}</div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-body-large font-medium" style={{ marginBottom: 'var(--spacing-12)' }}>Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
            <ToggleSwitch label="Exam Prep Mode (harder questions)" checked={examPrepMode}
              onChange={() => setExamPrepMode(p => !p)} />
            <ToggleSwitch label="Show Explanations" checked={options.explanations}
              onChange={() => setOptions(p => ({...p, explanations: !p.explanations}))} />
            <ToggleSwitch label="Enable Timer (visual only)" checked={options.timer}
              onChange={() => setOptions(p => ({...p, timer: !p.timer}))} />
          </div>
        </section>

        {error && (
          <div style={{ padding: 'var(--spacing-12)', backgroundColor: 'rgba(239,68,68,0.1)',
            borderRadius: 'var(--radius-8)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
            <span className="text-small" style={{ color: 'var(--color-error)' }}>{error}</span>
          </div>
        )}

        <div className="generate-btn-container" style={{ marginTop: 'auto' }}>
          <Button variant="primary" fullWidth size="large"
            icon={appState === 'generating' ? Loader2 : Sparkles}
            onClick={handleGenerate}
            disabled={appState === 'generating' || docs.length === 0}>
            {appState === 'generating' ? 'Generating MCQs…' : 'Generate MCQs'}
          </Button>
        </div>
      </div>

      {/* RIGHT: Quiz area */}
      <div className="mcq-preview-panel">
        {appState === 'config' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="Ready to test your knowledge?" description="Configure your quiz on the left and hit Generate." icon={Target} />
          </div>
        )}

        {appState === 'generating' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-16)' }}>
            <Loader2 size={48} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <h3 className="text-title">Generating Quiz…</h3>
            <p className="text-small text-muted">Analysing document and crafting questions.</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {appState === 'quiz' && q && (
          <div className="mcq-preview-content">
            <div className="quiz-header">
              <div className="quiz-progress">
                <span className="quiz-question-number">Question {currentQIdx + 1} of {quiz.length}</span>
                <div className="quiz-progress-bar">
                  <div className="quiz-progress-fill" style={{ width: `${((currentQIdx+1)/quiz.length)*100}%` }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--color-border)' }}>
                  {q.difficulty}
                </span>
              </div>
            </div>

            <h2 className="quiz-question-text">{q.question}</h2>

            <div className="quiz-options">
              {q.options.map((opt, idx) => {
                const correctIdx = ['A','B','C','D'].indexOf(q.correct_answer);
                let cls = '';
                if (selected !== null) {
                  if (idx === correctIdx) cls = 'correct';
                  else if (idx === selected) cls = 'incorrect';
                }
                return (
                  <div key={idx} className={`quiz-option ${selected === idx ? 'selected' : ''} ${cls}`}
                    onClick={() => handleOptionSelect(idx)}>
                    <div className="quiz-option-letter">{String.fromCharCode(65 + idx)}</div>
                    <span className="text-body">{opt}</span>
                    {cls === 'correct'   && <CheckCircle2 style={{ marginLeft: 'auto', color: 'var(--color-success)' }} size={18} />}
                    {cls === 'incorrect' && <XCircle style={{ marginLeft: 'auto', color: 'var(--color-error)' }} size={18} />}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {showExpl && (
                <motion.div className="quiz-explanation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--color-success)', marginBottom: '8px' }}>
                    <Sparkles size={16} /> AI Explanation
                  </h4>
                  <p className="text-body" style={{ lineHeight: 1.7 }}>{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="quiz-navigation">
              <Button variant="ghost" icon={ChevronLeft} disabled={currentQIdx === 0}
                onClick={() => { setCurrentQIdx(i => i - 1); setSelected(null); setShowExpl(false); }}>
                Previous
              </Button>
              <Button variant="primary" icon={ChevronRight} disabled={selected === null} onClick={handleNext}>
                {currentQIdx === quiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </Button>
            </div>
          </div>
        )}

        {appState === 'results' && (
          <div className="mcq-preview-content">
            <div className="results-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-32)' }}>
              <h2 className="text-display" style={{ marginBottom: 'var(--spacing-24)' }}>Quiz Complete!</h2>
              <div className="results-score-circle">
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {Math.round((score / quiz.length) * 100)}%
                </span>
                <span className="text-small text-muted" style={{ marginTop: '4px' }}>
                  {score} of {quiz.length} correct
                </span>
              </div>
            </div>

            <div className="results-grid">
              <div className="card results-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-16)', color: 'var(--color-text-muted)' }}>
                  <Activity size={16} />
                  <span className="text-caption" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-small">Score</span>
                  <span className="text-small font-medium">{score}/{quiz.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-small">Accuracy</span>
                  <span className="text-small font-medium">{Math.round((score/quiz.length)*100)}%</span>
                </div>
              </div>
              <div className="card results-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-16)', color: 'var(--color-text-muted)' }}>
                  <BookOpen size={16} />
                  <span className="text-caption" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</span>
                </div>
                <p className="text-body" style={{ color: score/quiz.length >= 0.7 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {score/quiz.length >= 0.9 ? '🎉 Excellent!' : score/quiz.length >= 0.7 ? '👍 Good job!' : '📚 Keep studying'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-16)', marginTop: 'var(--spacing-32)' }}>
              <Button variant="outline" icon={RefreshCcw} onClick={() => { setAppState('config'); setQuiz([]); setScore(0); }}>
                Try Again
              </Button>
              <Button variant="primary" onClick={handleGenerate}>
                New Quiz
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
