import axios from 'axios';
import useStore from '../store/useStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Read live user preferences from the store (outside React).
// These are set in Settings → AI Settings and persist across sessions.
const getProvider = () => useStore.getState().aiModel || 'gemini';
const getResponseLength = () => {
  // Map the user's "answer length" preference to the backend's response_length field
  return useStore.getState().answerLength === 'concise' ? 'short' : 'medium';
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const getFiles = () => api.get('/files');
export const deleteFile = (id) => api.delete(`/files/${id}`);

export const uploadAndProcess = async (file, onStageChange) => {
  // 1. Upload
  onStageChange('Uploading document...');
  const form = new FormData();
  form.append('files', file);
  const uploadRes = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const doc = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
  const docId = doc.id;

  const poll = async (targetStatus) => {
    for (let i = 0; i < 300; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await api.get(`/extract/status/${docId}`);
      if (res.data.status === targetStatus) return;
      if (res.data.status === 'FAILED') throw new Error('Processing failed');
    }
    throw new Error(`Timed out waiting for ${targetStatus}`);
  };

  // 2. Extract
  onStageChange('Extracting text & diagrams...');
  await api.post(`/extract/${docId}`);
  await poll('EXTRACTED');

  // 3. Chunk
  onStageChange('Chunking document...');
  await api.post(`/chunk/process/${docId}`);
  await poll('READY_FOR_EMBEDDING');

  // 4. Embed
  onStageChange('Generating embeddings...');
  await api.post(`/embeddings/process/${docId}`);
  await poll('READY_FOR_INDEXING');

  // 5. Index
  onStageChange('Indexing into vector database...');
  await api.post(`/vector/index/${docId}`);
  await poll('READY_FOR_RETRIEVAL');

  return doc;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const sendChatMessage = (query, documentId) =>
  api.post('/chat/answer', {
    query,
    document_id: documentId || null,
    response_length: getResponseLength(),
    provider: getProvider(),
  });

// ─── Exam / Answer Generator ──────────────────────────────────────────────────
export const generate8mAnswer = (query, documentId, formatMode = 'paragraph') =>
  api.post('/generate/8m', {
    query,
    document_id: documentId || null,
    format_mode: formatMode,
    provider: getProvider(),
    query_mode: 'QUESTION',
  });

export const generate15mAnswer = (query, documentId, formatMode = 'paragraph') =>
  api.post('/generate/15m', {
    query,
    document_id: documentId || null,
    format_mode: formatMode,
    provider: getProvider(),
    query_mode: 'QUESTION',
  });

// ─── MCQ ──────────────────────────────────────────────────────────────────────
export const generateMCQs = (documentId, topic, count, examPrepMode = false) =>
  api.post('/mcq/generate', {
    document_id: documentId || null,
    topic: topic || null,
    count,
    exam_prep_mode: examPrepMode,
    provider: getProvider(),
  });

// ─── Diagrams ─────────────────────────────────────────────────────────────────
export const reconstructDiagram = (topic, documentId) =>
  api.post('/diagram/reconstruct', {
    topic,
    document_id: documentId || null,
    provider: getProvider(),
  });

// ─── Question Paper ───────────────────────────────────────────────────────────
export const generateQuestionPaper = (subject, documentId, examType = 'SEMESTER', totalMarks = 100) =>
  api.post('/question-paper/generate', {
    subject,
    document_id: documentId || null,
    exam_type: examType,
    total_marks: totalMarks,
    provider: getProvider(),
  });

export default api;
