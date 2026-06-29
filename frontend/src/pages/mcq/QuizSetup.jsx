import { useState } from 'react';
import { Loader2, Settings2 } from 'lucide-react';
import api from '../../services/api';

export default function QuizSetup({ activeDocument, onQuizGenerated }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [examPrepMode, setExamPrepMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        topic: topic || null, // Optional
        document_id: activeDocument.id,
        count: parseInt(count, 10),
        exam_prep_mode: examPrepMode
      };

      // We use the quiz endpoint if exam prep mode is on, else standard generate
      const endpoint = examPrepMode ? '/mcq/quiz' : '/mcq/generate';
      const response = await api.post(endpoint, payload);
      
      onQuizGenerated(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      <div className="glass max-w-xl w-full p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex items-center space-x-3 mb-8 relative z-10">
          <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/20">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Configure Quiz</h2>
            <p className="text-muted-foreground text-sm">Generate MCQs from {activeDocument.original_filename}</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic (Optional)</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Leave blank for entire document..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Questions</label>
            <select 
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer"
              disabled={loading}
            >
              <option value={5} className="bg-zinc-900 text-white">5 Questions</option>
              <option value={10} className="bg-zinc-900 text-white">10 Questions</option>
              <option value={20} className="bg-zinc-900 text-white">20 Questions</option>
              <option value={50} className="bg-zinc-900 text-white">50 Questions (Batch Mode)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="font-medium">Exam Prep Mode</div>
              <div className="text-xs text-muted-foreground mt-1">Focuses strictly on core concepts and complex definitions.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={examPrepMode}
                onChange={() => setExamPrepMode(!examPrepMode)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-black/60 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/10"></div>
            </label>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center disabled:opacity-50 mt-8"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Quiz Pipeline...</span>
              </span>
            ) : (
              <span>Start Assessment</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
