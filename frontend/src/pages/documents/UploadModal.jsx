import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import api from '../../services/api';

const SUPPORTED_TYPES = {
  'application/pdf': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
  'text/plain': true,
};

const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'pptx', 'txt'];

// Maps each pipeline step to the status the backend sets when it completes
const STEP_TARGET_STATUSES = {
  extract:  'EXTRACTED',
  chunk:    'READY_FOR_EMBEDDING',
  embed:    'READY_FOR_INDEXING',
  index:    'READY_FOR_RETRIEVAL',
};

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  // Poll /extract/status/{docId} until processing_status matches targetStatus
  async function pollStatus(docId, targetStatus) {
    const maxAttempts = 300; // 5 minutes max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await api.get(`/extract/status/${docId}`);
      const status = res.data.status;
      if (status === targetStatus) return;
      if (status === 'FAILED') throw new Error(`Processing failed at step: waiting for ${targetStatus}`);
    }
    throw new Error(`Timed out waiting for status: ${targetStatus}`);
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_TYPES[file.type] && !SUPPORTED_EXTENSIONS.includes(ext)) {
      setError('Unsupported file type. Supported formats: PDF, DOCX, PPTX, TXT.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('files', file);

    try {
      // Step 1: Upload
      setUploadStage('Uploading document...');
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const doc = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
      const docId = doc.id;

      // Step 2: Extract
      setUploadStage('Extracting text & diagrams...');
      await api.post(`/extract/${docId}`);
      await pollStatus(docId, STEP_TARGET_STATUSES.extract);

      // Step 3: Chunk
      setUploadStage('Semantic chunking...');
      await api.post(`/chunk/process/${docId}`);
      await pollStatus(docId, STEP_TARGET_STATUSES.chunk);

      // Step 4: Embed
      setUploadStage('Generating embeddings...');
      await api.post(`/embeddings/process/${docId}`);
      await pollStatus(docId, STEP_TARGET_STATUSES.embed);

      // Step 5: Index into FAISS
      setUploadStage('Indexing into vector database...');
      await api.post(`/vector/index/${docId}`);
      await pollStatus(docId, STEP_TARGET_STATUSES.index);

      // Signal success before closing so parent can refresh the list
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      // Only update state if the modal is still mounted
      if (isMounted.current) {
        setError(err.response?.data?.detail || err.message || 'Failed to process document.');
      }
    } finally {
      if (isMounted.current) {
        setIsUploading(false);
        setUploadStage('');
      }
    }
  }, [onClose, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg overflow-hidden glass rounded-2xl shadow-2xl border border-white/10 relative"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upload Document</h2>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
                  ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
                  ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <input {...getInputProps()} />

                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-medium">{uploadStage || 'Processing...'}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a moment depending on file size.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-primary">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium mb-1">
                      {isDragActive ? 'Drop the file here...' : 'Drag & drop your document'}
                    </p>
                    <p className="text-sm text-muted-foreground">PDF, DOCX, PPTX, or TXT — click to browse</p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm flex items-center">
                  <span className="font-medium mr-2">Error:</span> {error}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
