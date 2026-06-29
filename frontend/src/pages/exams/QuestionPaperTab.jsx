import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, Download } from 'lucide-react';
import api from '../../services/api';

export default function QuestionPaperTab({ activeDocument }) {
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('SEMESTER');
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subject) return;

    setLoading(true);
    setError('');
    setPaper(null);

    try {
      const payload = {
        subject,
        document_id: activeDocument.id,
        exam_type: examType
      };

      const response = await api.post('/question-paper/generate', payload);
      setPaper(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate question paper.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <form onSubmit={handleGenerate} className="glass p-6 rounded-2xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Generate Question Paper</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground mb-1">Subject Name</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Digital Image Processing" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              required
            />
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm text-muted-foreground mb-1">Exam Type</label>
            <select 
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer"
            >
              <option value="SEMESTER" className="bg-zinc-900 text-white">Semester Exam</option>
              <option value="INTERNAL" className="bg-zinc-900 text-white">Internal Assessment</option>
              <option value="UNIT" className="bg-zinc-900 text-white">Unit Test</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={loading || !subject}
              className="w-full md:w-auto h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileText className="w-4 h-4 mr-2" /> Generate Paper</>}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      {paper && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-auto glass p-8 rounded-2xl border border-white/10 shadow-lg relative bg-white text-black"
        >
          {/* A print-styled paper view. We override dark mode here to look like a real paper */}
          <div className="max-w-4xl mx-auto font-serif">
            <div className="text-center border-b-2 border-black pb-6 mb-8">
              <h1 className="text-2xl font-bold uppercase mb-2">University Examination</h1>
              <h2 className="text-xl font-semibold mb-2">{paper.subject}</h2>
              <div className="flex justify-between text-sm font-bold px-8">
                <span>{paper.exam_type} EXAM</span>
                <span>Maximum Marks: {paper.total_marks}</span>
              </div>
            </div>

            <div className="space-y-10">
              {paper.sections.map((section, sIdx) => (
                <div key={sIdx}>
                  <div className="text-center font-bold text-lg mb-1 uppercase underline underline-offset-4">
                    {section.name}
                  </div>
                  <div className="text-center italic text-sm mb-6">
                    ({section.instructions})
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((q, qIdx) => (
                      <div key={q.question_id} className="flex">
                        <div className="w-8 font-bold">{qIdx + 1}.</div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span>{q.question_text}</span>
                            <span className="font-bold ml-4 whitespace-nowrap">({q.marks} Marks)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => window.print()} 
            className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-black p-2 rounded-full transition-colors"
            title="Print / Save as PDF"
          >
            <Download className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
