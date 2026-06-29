import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { BrainCircuit, Loader2 } from 'lucide-react';

// New UI pages
const Dashboard        = lazy(() => import('./pages/documents/Dashboard'));
const ExamsView        = lazy(() => import('./pages/exams/ExamsView'));
const ChatView         = lazy(() => import('./pages/chat/ChatView'));
const McqView          = lazy(() => import('./pages/mcq/McqView'));
const LoginPage        = lazy(() => import('./pages/auth/LoginPage'));
const DocumentLibrary  = lazy(() => import('./pages/documents/DocumentLibrary'));
const DiagramView      = lazy(() => import('./pages/diagrams/DiagramView'));
const QuestionPaperView = lazy(() => import('./pages/exams/QuestionPaperView'));
const HistoryView      = lazy(() => import('./pages/history/HistoryView'));
const SettingsView     = lazy(() => import('./pages/settings/SettingsView'));

function GlobalLoading() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
      <Loader2 size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
      <BrainCircuit size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }} />
      <h3 style={{ fontSize: '3rem', fontWeight: 'bold', margin: 0 }}>404</h3>
      <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 1.5rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <a href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
        Go back to Dashboard
      </a>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="exams" element={<ExamsView />} />
          <Route path="mcq" element={<McqView />} />
          <Route path="study" element={<DocumentLibrary />} />
          <Route path="diagrams" element={<DiagramView />} />
          <Route path="question-papers" element={<QuestionPaperView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
