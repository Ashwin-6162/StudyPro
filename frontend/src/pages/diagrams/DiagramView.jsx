import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitGraph, FileText, ChevronDown, Network, ZoomIn, ZoomOut, 
  Maximize, RotateCcw, Download, Copy, Printer, Image as ImageIcon,
  Sparkles, Loader2, Workflow, BoxSelect, Database, AlignLeft, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/FormControls';
import { EmptyState } from '../../components/ai/AIStates';
import { getFiles, reconstructDiagram } from '../../services/api';
import './DiagramView.css';

export default function DiagramView() {
  const [docs, setDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDocName, setSelectedDocName] = useState('');
  const [topic, setTopic] = useState('');
  const [diagramType, setDiagramType] = useState('Flowchart');
  const [complexity, setComplexity] = useState('Detailed');
  const [colorTheme, setColorTheme] = useState('indigo');

  const [appState, setAppState] = useState('empty');
  const [zoom, setZoom] = useState(100);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
    setSelectedDocName(docs.find(d => d.id === id)?.original_filename || '');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setAppState('generating');
    setError('');
    setResult(null);
    try {
      const res = await reconstructDiagram(topic, selectedDocId || null);
      setResult(res.data);
      setAppState('generated');
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Diagram generation failed.');
      setAppState('empty');
    }
  };

  const themes = [
    { id: 'indigo', color: '#6366f1' },
    { id: 'emerald', color: '#10b981' },
    { id: 'rose', color: '#f43f5e' },
    { id: 'amber', color: '#f59e0b' },
    { id: 'slate', color: '#64748b' }
  ];

  return (
    <div className="diagram-page-container">
      
      {/* LEFT SECTION: Configuration */}
      <div className="diagram-config-panel">
        <header>
          <h1 className="text-title font-bold flex items-center gap-2">
            <GitGraph className="text-primary" /> Diagram Generator
          </h1>
          <p className="text-body text-muted mt-2">
            Visualize complex concepts instantly from your study materials.
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
              <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            </div>
          )}
        </section>

        <section>
          <h3 className="text-body-large font-medium mb-3">Topic / Concept</h3>
          <Input 
            placeholder="e.g. Memory Hierarchy, B-Tree Operations..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </section>

        <section>
          <h3 className="text-body-large font-medium mb-3">Diagram Type</h3>
          <Select 
            options={[
              {value:'Flowchart', label:'Flowchart'}, 
              {value:'Mind Map', label:'Mind Map'}, 
              {value:'Architecture Diagram', label:'Architecture Diagram'}, 
              {value:'ER Diagram', label:'ER Diagram'},
              {value:'UML Class', label:'UML Class Diagram'},
              {value:'Sequence', label:'Sequence Diagram'},
              {value:'Network', label:'Network Diagram'}
            ]} 
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value)}
          />
        </section>

        <section>
          <h3 className="text-body-large font-medium mb-3">Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
            <Select 
              label="Complexity" 
              options={[{value:'Simple', label:'Simple'}, {value:'Detailed', label:'Detailed'}, {value:'Comprehensive', label:'Comprehensive'}]} 
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
            />
            
            <div>
              <label className="text-caption font-medium text-muted block mb-2">Color Theme</label>
              <div className="theme-selector">
                {themes.map(t => (
                  <div 
                    key={t.id}
                    className={`theme-circle ${colorTheme === t.id ? 'active' : ''}`}
                    style={{ backgroundColor: t.color }}
                    onClick={() => setColorTheme(t.id)}
                  />
                ))}
              </div>
            </div>

            <ToggleSwitch 
              label="Include Descriptive Labels" 
              checked={includeLabels} 
              onChange={() => setIncludeLabels(!includeLabels)} 
            />
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
            disabled={!topic.trim() || appState === 'generating'}
          >
            {appState === 'generating' ? 'Mapping structure...' : 'Generate Diagram'}
          </Button>
        </div>
      </div>

      {/* RIGHT SECTION: Interactive Canvas */}
      <div className="diagram-preview-panel">
        <div className="diagram-canvas-area">
          {appState === 'empty' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {error && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: 'var(--spacing-16)', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-12)', border: '1px solid rgba(239,68,68,0.3)', maxWidth: '400px' }}>
                  <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
                  <span className="text-small" style={{ color: 'var(--color-error)' }}>{error}</span>
                </div>
              )}
              <EmptyState 
                title="Visualize your knowledge."
                description="Enter a topic on the left to generate diagrams from your documents."
                icon={Network}
              />
            </div>
          )}

          {appState === 'generating' && (
            <div className="flex flex-col items-center gap-6">
              <Loader2 size={48} className="text-primary animate-spin" />
              <div className="text-center">
                <h3 className="text-title mb-2">Rendering Diagram...</h3>
                <p className="text-muted">Analyzing relationships in the text.</p>
              </div>
            </div>
          )}

          {appState === 'generated' && result && (
            <AnimatePresence>
              <motion.div 
                className="mock-diagram"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: zoom / 100 }}
              >
                <div style={{ padding: '16px 20px', border: '2px solid ' + (themes.find(t=>t.id===colorTheme)?.color || '#6366f1'), borderRadius: '8px', backgroundColor: 'var(--color-bg)', textAlign: 'center' }}>
                  <h3 className="text-body-large font-bold">{result.topic}</h3>
                  <span className="text-caption text-muted">{result.diagram_type}</span>
                </div>

                {/* Render nodes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                  {(result.nodes || []).map((node, i) => (
                    <div key={i} style={{ padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg)', textAlign: 'center', minWidth: '120px' }}>
                      <span className="text-small font-medium">{node}</span>
                    </div>
                  ))}
                </div>

                {/* Render edges as text */}
                {result.edges?.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '8px', width: '100%' }}>
                    <p className="text-caption text-muted" style={{ marginBottom: '8px' }}>Connections:</p>
                    {result.edges.map((edge, i) => (
                      <p key={i} className="text-small" style={{ marginBottom: '4px' }}>{edge[0]} → {edge[1]}</p>
                    ))}
                  </div>
                )}

                {result.source_pages?.length > 0 && (
                  <p className="text-caption text-muted" style={{ marginTop: '12px' }}>Source pages: {result.source_pages.join(', ')}</p>
                )}
                {result.processing_time && (
                  <p className="text-caption text-muted">Generated in {result.processing_time.toFixed(1)}s</p>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Interactive Toolbars */}
          {appState === 'generated' && (
            <>
              <div className="diagram-canvas-toolbar animate-slide">
                <Button variant="ghost" icon={ZoomIn} className="btn-icon" onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom In" />
                <span className="text-caption text-center text-muted font-mono">{zoom}%</span>
                <Button variant="ghost" icon={ZoomOut} className="btn-icon" onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom Out" />
                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
                <Button variant="ghost" icon={BoxSelect} className="btn-icon" title="Pan" />
                <Button variant="ghost" icon={Maximize} className="btn-icon" title="Fullscreen" />
                <Button variant="ghost" icon={RotateCcw} className="btn-icon" onClick={() => setZoom(100)} title="Reset View" />
              </div>

              <div className="diagram-bottom-toolbar animate-slide" style={{ animationDelay: '0.1s' }}>
                <Button variant="ghost" icon={ImageIcon} className="btn-icon" title="Download PNG" />
                <Button variant="ghost" icon={Download} className="btn-icon" title="Download SVG" />
                <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border)' }} />
                <Button variant="ghost" icon={Copy} className="btn-icon" title="Copy to Clipboard" />
                <Button variant="ghost" icon={Printer} className="btn-icon" title="Print" />
              </div>
            </>
          )}
        </div>

        {/* History / Suggested Bottom Panel */}
        <div className="diagram-history-panel">
          <h4 className="text-body font-medium flex items-center gap-2">
            <Clock size={16} className="text-muted" /> Recent Generated Diagrams
          </h4>
          <div className="history-grid">
            <div className="history-card">
              <div className="flex items-center gap-2 mb-2">
                <Network size={14} className="text-primary" />
                <span className="text-caption font-medium truncate">OSI Model Layers</span>
              </div>
              <span className="text-caption text-muted">2 hours ago</span>
            </div>
            <div className="history-card">
              <div className="flex items-center gap-2 mb-2">
                <GitGraph size={14} className="text-primary" />
                <span className="text-caption font-medium truncate">Binary Search Tree</span>
              </div>
              <span className="text-caption text-muted">Yesterday</span>
            </div>
          </div>
          
          <h4 className="text-body font-medium flex items-center gap-2 mt-2">
            <Sparkles size={16} className="text-muted" /> Suggested for you
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="small" icon={AlignLeft}>Virtual Memory Flow</Button>
            <Button variant="outline" size="small" icon={AlignLeft}>Page Replacement ER</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
