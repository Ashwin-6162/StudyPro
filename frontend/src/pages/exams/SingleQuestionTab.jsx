import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';

export default function SingleQuestionTab({ activeDocument }) {
  const [topic, setTopic] = useState('');
  const [markType, setMarkType] = useState('8m'); // '8m' or '15m'
  const [formatMode, setFormatMode] = useState('paragraph'); // 'paragraph' or 'bullet'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const endpoint = markType === '8m' ? '/generate/8m/question' : '/generate/15m/question';
      
      const payload = {
        query: topic,
        document_id: activeDocument.id,
        format_mode: formatMode,
      };

      const response = await api.post(endpoint, payload);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <form onSubmit={handleGenerate} className="glass p-6 rounded-2xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Generate Academic Answer</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground mb-1">Question or Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Explain CNN Architecture" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              required
            />
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm text-muted-foreground mb-1">Weightage</label>
            <select 
              value={markType}
              onChange={(e) => setMarkType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer"
            >
              <option value="8m" className="bg-zinc-900 text-white">8 Marks (Short Essay)</option>
              <option value="15m" className="bg-zinc-900 text-white">15 Marks (Deep Dive)</option>
            </select>
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm text-muted-foreground mb-1">Format</label>
            <div className="flex bg-black/40 rounded-xl p-1 h-[50px]">
              <button
                type="button"
                onClick={() => setFormatMode('paragraph')}
                className={`flex-1 rounded-lg text-sm font-medium transition-all ${
                  formatMode === 'paragraph' ? 'bg-white/20 text-white shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => setFormatMode('bullet')}
                className={`flex-1 rounded-lg text-sm font-medium transition-all ${
                  formatMode === 'bullet' ? 'bg-white/20 text-white shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                Points
              </button>
            </div>
          </div>
          
          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={loading || !topic}
              className="w-full md:w-auto h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Generate</>}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-auto glass p-8 rounded-2xl border border-white/10 shadow-lg relative"
        >
          <div className="prose prose-invert prose-indigo max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.answer}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
