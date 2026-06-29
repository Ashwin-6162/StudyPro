import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, FileCode2, ArrowRight, RotateCcw, Trophy, Target, XOctagon } from 'lucide-react';
import clsx from 'clsx';

export default function InteractiveQuiz({ quizData, onReset }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealed, setRevealed] = useState({}); // Tracks if the user has clicked "Check"
  const [quizFinished, setQuizFinished] = useState(false);

  const questions = quizData.questions;
  const currentQ = questions[currentQuestionIndex];
  
  const hasSelected = userAnswers[currentQuestionIndex] !== undefined;
  const isRevealed = revealed[currentQuestionIndex] || false;

  const handleSelectOption = (optLabel) => {
    if (isRevealed) return; // Lock if already checked
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: optLabel }));
  };

  const handleCheck = () => {
    if (!hasSelected) return;
    setRevealed(prev => ({ ...prev, [currentQuestionIndex]: true }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleFinish = () => {
    setQuizFinished(true);
  };

  // Calculate score
  const getScore = () => {
    let correct = 0;
    let answered = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] !== undefined) {
        answered++;
        if (userAnswers[idx] === q.correct_answer) {
          correct++;
        }
      }
    });
    return { correct, answered, total: questions.length };
  };

  // Score Summary Screen
  if (quizFinished) {
    const { correct, answered, total } = getScore();
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let gradeColor = 'text-red-400';
    let gradeBg = 'from-red-500/20 to-red-600/10';
    let gradeLabel = 'Needs Improvement';
    if (percentage >= 80) {
      gradeColor = 'text-green-400';
      gradeBg = 'from-green-500/20 to-emerald-600/10';
      gradeLabel = 'Excellent!';
    } else if (percentage >= 60) {
      gradeColor = 'text-yellow-400';
      gradeBg = 'from-yellow-500/20 to-amber-600/10';
      gradeLabel = 'Good Job!';
    } else if (percentage >= 40) {
      gradeColor = 'text-orange-400';
      gradeBg = 'from-orange-500/20 to-orange-600/10';
      gradeLabel = 'Keep Practicing';
    }

    return (
      <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full glass p-10 rounded-3xl border border-white/10 shadow-2xl text-center bg-gradient-to-br ${gradeBg}`}
        >
          <div className="mb-6">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${gradeColor}`} />
            <h2 className={`text-3xl font-bold ${gradeColor}`}>{gradeLabel}</h2>
          </div>

          <div className="text-7xl font-bold text-foreground mb-2">
            {percentage}%
          </div>
          <p className="text-muted-foreground mb-8">Your Score</p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-400">{correct}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <XOctagon className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-400">{answered - correct}</div>
              <div className="text-xs text-muted-foreground">Wrong</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onReset}
              className="h-12 bg-white/10 hover:bg-white/20 text-foreground px-8 rounded-xl font-medium transition-all duration-300 flex items-center border border-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Assessment Mode</h2>
          <p className="text-muted-foreground text-sm">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <button onClick={onReset} className="text-sm text-primary hover:underline">
          Exit Quiz
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-black/40 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Difficulty Badge */}
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 border border-white/5 uppercase">
              {currentQ.difficulty}
            </div>
            
            <h3 className="text-2xl font-medium leading-relaxed">
              {currentQ.question}
            </h3>

            <div className="space-y-3 mt-8">
              {currentQ.options.map((opt, idx) => {
                // Determine styling
                const letter = opt.charAt(0); // A, B, C, or D
                const isSelected = userAnswers[currentQuestionIndex] === letter;
                const isCorrect = currentQ.correct_answer === letter;
                
                let optionStyle = "border-white/10 hover:border-white/30 hover:bg-white/5";
                let icon = null;

                if (isRevealed) {
                  if (isCorrect) {
                    optionStyle = "border-green-500/50 bg-green-500/10 text-green-400";
                    icon = <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />;
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "border-red-500/50 bg-red-500/10 text-red-400 opacity-50";
                    icon = <XCircle className="w-5 h-5 text-red-500 ml-auto" />;
                  } else {
                    optionStyle = "border-white/5 opacity-30";
                  }
                } else if (isSelected) {
                  optionStyle = "border-primary bg-primary/20 text-primary-foreground";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(letter)}
                    disabled={isRevealed}
                    className={clsx(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center glass-panel",
                      optionStyle
                    )}
                  >
                    <span className="font-bold mr-4 text-lg w-6">{letter}.</span>
                    <span className="flex-1">{opt.substring(3)}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explanation Area */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden mt-8"
                >
                  <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
                    <h4 className="font-bold text-primary mb-2">Explanation</h4>
                    <p className="text-foreground/90 leading-relaxed mb-4">
                      {currentQ.explanation}
                    </p>
                    
                    {currentQ.source && (
                      <div className="flex flex-wrap gap-2 items-center text-xs">
                        <FileCode2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Source:</span>
                        <span className="bg-black/40 border border-white/5 px-2 py-1 rounded-full text-primary/80">
                          {currentQ.source.file} (Pages {currentQ.source.pages.join(', ')})
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent flex justify-center">
        {!isRevealed ? (
          <button
            onClick={handleCheck}
            disabled={!hasSelected}
            className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-12 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        ) : currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="h-12 bg-white text-black hover:bg-gray-200 px-12 rounded-xl font-medium transition-all duration-300 flex items-center"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center"
          >
            <Trophy className="w-4 h-4 mr-2" />
            <span>View Results</span>
          </button>
        )}
      </div>

    </div>
  );
}
