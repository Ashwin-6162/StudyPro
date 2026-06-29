import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, BookOpen, Clock, Loader2, Sparkles, 
  Download, Printer, Save, RefreshCcw, FileSignature, ChevronDown, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ToggleSwitch, Select } from '../../components/ui/FormControls';
import { EmptyState } from '../../components/ai/AIStates';
import { getFiles, generateQuestionPaper } from '../../services/api';
import './QuestionPaperView.css';

export default function QuestionPaperView() {
  const [docs, setDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDocName, setSelectedDocName] = useState('');

  const [subject, setSubject] = useState('Data Structures and Algorithms');
  const [university, setUniversity] = useState('Anna University');
  const [semester, setSemester] = useState('IV');
  const [regulation, setRegulation] = useState('2021');
  const [examDuration, setExamDuration] = useState('3 Hours');
  const [totalMarks, setTotalMarks] = useState('100');
  const [examType, setExamType] = useState('SEMESTER');
  const [difficulty, setDifficulty] = useState('Medium');

  const [options, setOptions] = useState({
    randomize: true, diagrams: true, caseStudy: false, avoidDuplicates: true
  });
  const handleOptionToggle = (key) => setOptions(prev => ({ ...prev, [key]: !prev[key] }));

  const [appState, setAppState] = useState('empty');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getFiles().then(r => {
      const ready = (r.data || []).filter(d => d.processing_status === 'READY_FOR_RETRIEVAL');
      setDocs(ready);
      if (ready.length > 0) { setSelectedDocId(ready[0].id); setSelectedDocName(ready[0].original_filename); setSubject(ready[0].original_filename.replace('.pdf','')); }
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
    setResult(null);
    try {
      const res = await generateQuestionPaper(subject, selectedDocId || null, examType, parseInt(totalMarks) || 100);
      setResult(res.data);
      setAppState('generated');
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Generation failed.');
      setAppState('empty');
    }
  };

  return (
    <div className="qp-page-container">
      
      {/* LEFT SECTION: Configuration */}
      <div className="qp-config-panel">
        <header>
          <h1 className="text-title font-bold flex items-center gap-2">
            <FileSignature className="text-primary" /> Question Paper Generator
          </h1>
          <p className="text-body text-muted mt-2">
            Generate complete university-style question papers instantly.
          </p>
        </header>

        <section>
          <h3 className="text-body-large font-medium mb-3">Document Source</h3>
          {docs.length === 0 ? (
            <p className="text-small text-muted">No indexed documents — upload one first.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <FileText size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <select value={selectedDocId} onChange={handleDocChange}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 'var(--text-small-size)', cursor: 'pointer' }}>
                {docs.map(d => (
                  <option key={d.id} value={d.id} style={{ background: 'var(--color-surface)' }}>{d.original_filename}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-body-large font-medium mb-3">Header Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
            <Input label="Subject Name" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Input label="University/Institution Name" value={university} onChange={(e) => setUniversity(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-12)' }}>
              <Input label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
              <Input label="Regulation" value={regulation} onChange={(e) => setRegulation(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-12)' }}>
              <Input label="Exam Duration" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} />
              <Input label="Total Marks" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-body-large font-medium mb-3">Pattern & Difficulty</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
            
            <Select 
              label="Overall Difficulty" 
              options={[{value:'Easy', label:'Easy'}, {value:'Medium', label:'Medium'}, {value:'Hard', label:'Hard'}]} 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />

            <div>
              <label className="text-caption font-medium text-muted block mb-2">Question Distribution</label>
              <div className="dist-grid">
                <div className="card dist-card active">
                  <span className="text-body font-bold text-primary">10x</span>
                  <span className="text-caption">2 Marks</span>
                </div>
                <div className="card dist-card active">
                  <span className="text-body font-bold text-primary">5x</span>
                  <span className="text-caption">13 Marks</span>
                </div>
                <div className="card dist-card active">
                  <span className="text-body font-bold text-primary">1x</span>
                  <span className="text-caption">15 Marks</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-caption font-medium text-muted block mb-2">Pattern Structure</label>
              <div className="dist-grid">
                <div className="card dist-card active"><span className="text-body">Part A</span></div>
                <div className="card dist-card active"><span className="text-body">Part B</span></div>
                <div className="card dist-card active"><span className="text-body">Part C</span></div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h3 className="text-body-large font-medium mb-3">Additional Options</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
            <ToggleSwitch label="Randomize Questions" checked={options.randomize} onChange={() => handleOptionToggle('randomize')} />
            <ToggleSwitch label="Include Diagram Questions" checked={options.diagrams} onChange={() => handleOptionToggle('diagrams')} />
            <ToggleSwitch label="Include Case Study (Part C)" checked={options.caseStudy} onChange={() => handleOptionToggle('caseStudy')} />
            <ToggleSwitch label="Avoid Duplicate Questions" checked={options.avoidDuplicates} onChange={() => handleOptionToggle('avoidDuplicates')} />
          </div>
        </section>

        <div className="generate-btn-container" style={{ marginTop: 'auto', paddingTop: 'var(--spacing-16)' }}>
          <Button 
            variant="primary" 
            fullWidth 
            size="large"
            icon={appState === 'generating' ? Loader2 : Sparkles}
            className={appState === 'generating' ? 'animate-pulse' : ''}
            onClick={handleGenerate}
            disabled={appState === 'generating'}
          >
            {appState === 'generating' ? 'Drafting Paper...' : 'Generate Question Paper'}
          </Button>
        </div>
      </div>

      {/* RIGHT SECTION: Preview Panel */}
      <div className="qp-preview-panel">
        
        {appState === 'empty' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            {error && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: 'var(--spacing-16)', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-12)', border: '1px solid rgba(239,68,68,0.3)', maxWidth: '400px' }}>
                <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
                <span className="text-small" style={{ color: 'var(--color-error)' }}>{error}</span>
              </div>
            )}
            <EmptyState 
              title="Draft your perfect exam."
              description="Configure the university pattern on the left and hit generate."
              icon={FileSignature}
            />
          </div>
        )}

        {appState === 'generating' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <div className="flex flex-col items-center gap-6">
                <Loader2 size={48} className="text-primary animate-spin" />
                <h3 className="text-title">Drafting Question Paper...</h3>
                <p className="text-muted">Balancing difficulty and extracting relevant topics.</p>
             </div>
          </div>
        )}

        {appState === 'generated' && result && (
          <div className="qp-preview-content">
            <div className="qp-toolbar animate-slide">
              <Button variant="ghost" icon={RefreshCcw} className="btn-icon" title="Regenerate" onClick={handleGenerate} />
              <div style={{ flex: 1 }} />
              <Button variant="primary" icon={Download} onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>Copy JSON</Button>
            </div>

            <AnimatePresence>
              <motion.div
                className="mock-question-paper"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="qp-header-title">{university}</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>B.E./B.Tech. DEGREE EXAMINATION</div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>{semester} Semester (Regulation {regulation})</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '24px' }}>{result.subject}</div>
                <div className="qp-header-meta">
                  <span>Time: {examDuration}</span>
                  <span>Maximum: {result.total_marks} Marks</span>
                </div>

                {result.sections.map((section, si) => (
                  <div key={si} style={{ marginTop: '24px' }}>
                    <div className="qp-part-title">{section.name}</div>
                    <p className="text-caption text-muted" style={{ marginBottom: '12px', fontStyle: 'italic' }}>{section.instructions}</p>
                    {section.questions.map((q, qi) => (
                      <div className="qp-question-row" key={q.question_id || qi}>
                        <div className="qp-question-num">{si * 20 + qi + 1}.</div>
                        <div className="qp-question-text">{q.question_text}</div>
                        <div className="qp-question-marks">({q.marks})</div>
                      </div>
                    ))}
                  </div>
                ))}

                {result.processing_time && (
                  <p className="text-caption text-muted" style={{ marginTop: '24px', textAlign: 'center' }}>Generated in {result.processing_time.toFixed(1)}s</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
