import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Grid, List as ListIcon, FileUp, FileText, Clock,
  FileDigit, HardDrive, Trash2, MessageSquare, Loader2, X,
  CheckCircle2, AlertCircle, Play
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ai/AIStates';
import { getFiles, deleteFile, uploadAndProcess } from '../../services/api';
import './DocumentLibrary.css';

// ── Upload Modal ───────────────────────────────────────────────────────────────
function UploadModal({ onClose, onDone }) {
  const [stage, setStage]       = useState('');   // current stage text
  const [stepIdx, setStepIdx]   = useState(0);    // 0=idle,1-5=steps
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  const steps = [
    'Uploading document...',
    'Extracting text & diagrams...',
    'Chunking document...',
    'Generating embeddings...',
    'Indexing into vector database...',
  ];

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setBusy(true);
    setError('');
    setStepIdx(1);
    try {
      await uploadAndProcess(files[0], (s) => {
        setStage(s);
        setStepIdx(steps.indexOf(s) + 1);
      });
      setStepIdx(6); // done
      setTimeout(() => { onDone(); onClose(); }, 800);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Upload failed.');
      setBusy(false);
      setStepIdx(0);
    }
  }, [onClose, onDone]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    disabled: busy,
  });

  return (
    <motion.div className="upload-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={!busy ? onClose : undefined}>
      <motion.div className="upload-modal" initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h2 className="text-title font-medium">Upload Document</h2>
          {!busy && <Button variant="ghost" icon={X} className="btn-icon" onClick={onClose} />}
        </div>

        {stepIdx === 0 ? (
          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-12)', padding: 'var(--spacing-48)',
            textAlign: 'center', cursor: 'pointer',
            backgroundColor: isDragActive ? 'rgba(99,102,241,0.08)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <input {...getInputProps()} />
            <FileUp size={40} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-16)' }} />
            <p className="text-body font-medium">{isDragActive ? 'Drop it here!' : 'Drag & drop your PDF here'}</p>
            <p className="text-small text-muted" style={{ marginTop: '8px' }}>or click to browse — PDF, TXT up to 50MB</p>
          </div>
        ) : stepIdx === 6 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-32)' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-success)' }} />
            <p className="text-title" style={{ marginTop: 'var(--spacing-16)' }}>Document ready!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
            {steps.map((s, i) => {
              const done    = stepIdx > i + 1;
              const active  = stepIdx === i + 1;
              const pending = stepIdx < i + 1;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)',
                  opacity: pending ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                  {done   && <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />}
                  {active && <Loader2 size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
                  {pending && <Play size={20} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
                  <span className="text-small">{s}</span>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 'var(--spacing-16)', padding: 'var(--spacing-12)', borderRadius: 'var(--radius-8)',
            backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            <span className="text-small" style={{ color: 'var(--color-error)' }}>{error}</span>
          </div>
        )}
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </motion.div>
    </motion.div>
  );
}

// ── Document Card ─────────────────────────────────────────────────────────────
function DocumentCard({ doc, mode, onDelete, onChat }) {
  const statusColor = {
    READY_FOR_RETRIEVAL: 'var(--color-success)',
    FAILED:              'var(--color-error)',
  }[doc.processing_status] || 'var(--color-warning)';

  const statusLabel = {
    READY_FOR_RETRIEVAL: 'Ready for AI',
    FAILED:              'Failed',
    UPLOADED:            'Uploaded',
    EXTRACTING:          'Extracting…',
    EXTRACTED:           'Extracted',
    CHUNKING:            'Chunking…',
    READY_FOR_EMBEDDING: 'Embedding…',
    EMBEDDING_GENERATING:'Embedding…',
    READY_FOR_INDEXING:  'Indexing…',
    INDEXING:            'Indexing…',
  }[doc.processing_status] || doc.processing_status;

  const bytes = doc.file_size;
  const sizeStr = bytes < 1024 ? `${bytes} B`
    : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB`
    : `${(bytes/1048576).toFixed(1)} MB`;

  return (
    <div className={mode === 'grid' ? 'doc-card-grid' : 'doc-card-list'}>
      <div className="doc-card-thumbnail">
        <FileText size={48} className="text-muted" />
        <div className="doc-card-status" style={{ color: statusColor, borderColor: statusColor + '40', backgroundColor: statusColor + '15' }}>
          {statusLabel}
        </div>
      </div>
      <div className="doc-card-content">
        <div>
          <h3 className="text-body font-medium line-clamp-1" title={doc.original_filename}>{doc.original_filename}</h3>
          <p className="text-caption text-secondary" style={{ marginTop: '4px' }}>{doc.file_type.toUpperCase()}</p>
        </div>
        <div className="doc-card-meta">
          <div className="doc-card-meta-item"><Clock size={12} /> {new Date(doc.upload_timestamp).toLocaleDateString()}</div>
          <div className="doc-card-meta-item"><HardDrive size={12} /> {sizeStr}</div>
        </div>
        <div className="doc-card-actions">
          <Button variant="primary" icon={MessageSquare} size="small"
            disabled={doc.processing_status !== 'READY_FOR_RETRIEVAL'}
            onClick={() => onChat(doc)}>
            Chat
          </Button>
          <Button variant="ghost" icon={Trash2} className="btn-icon"
            style={{ color: 'var(--color-error)' }}
            onClick={() => onDelete(doc.id)} title="Delete" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DocumentLibrary() {
  const navigate = useNavigate();
  const [docs, setDocs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch]     = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = () => {
    setLoading(true);
    getFiles()
      .then(r => setDocs(r.data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDocs, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try { await deleteFile(id); fetchDocs(); }
    catch { alert('Failed to delete.'); }
  };

  const handleChat = (doc) => {
    // Store selected doc in sessionStorage so ChatView can pick it up
    sessionStorage.setItem('chatDocId', doc.id);
    sessionStorage.setItem('chatDocName', doc.original_filename);
    navigate('/chat');
  };

  const filtered = docs.filter(d =>
    d.original_filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="document-library-container">
      <header className="library-header animate-fade">
        <div>
          <h1 className="text-display">My Documents</h1>
          <p className="text-body-large text-muted" style={{ marginTop: 'var(--spacing-8)' }}>
            Manage your uploaded study materials.
          </p>
        </div>
        <Button variant="primary" icon={FileUp} onClick={() => setShowUpload(true)}>Upload PDF</Button>
      </header>

      <div className="library-controls animate-slide">
        <Input iconLeft={Search} placeholder="Search documents…"
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <div style={{ display: 'flex', backgroundColor: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-8)', padding: '2px' }}>
          <button className={`toolbar-btn ${viewMode==='grid'?'active':''}`} onClick={() => setViewMode('grid')}><Grid size={16}/></button>
          <button className={`toolbar-btn ${viewMode==='list'?'active':''}`} onClick={() => setViewMode('list')}><ListIcon size={16}/></button>
        </div>
      </div>

      <div className="animate-slide" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-64)' }}>
            <Loader2 size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching documents' : 'No documents yet'}
            description={search ? 'Try a different search term.' : 'Upload a PDF to get started.'}
            action={!search && <Button variant="primary" icon={FileUp} style={{ marginTop: 'var(--spacing-16)' }} onClick={() => setShowUpload(true)}>Upload PDF</Button>}
          />
        ) : (
          <div className={viewMode === 'grid' ? 'documents-grid' : 'documents-list'}>
            {filtered.map(doc => (
              <DocumentCard key={doc.id} doc={doc} mode={viewMode} onDelete={handleDelete} onChat={handleChat} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUpload && (
          <UploadModal onClose={() => setShowUpload(false)} onDone={fetchDocs} />
        )}
      </AnimatePresence>
    </div>
  );
}
