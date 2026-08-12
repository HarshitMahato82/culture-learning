import React, { useState } from 'react';
import { X, HelpCircle, Sparkles, RefreshCw, CheckCircle2, XCircle, Award, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import { QuizData, UserProfile } from '../../types';
import { recordLearningActivity } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { getAchievementById } from '../../data/achievements';

interface QuizRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const QuizRunnerModal: React.FC<QuizRunnerModalProps> = ({ isOpen, onClose, user }) => {
  const { showSuccess } = useToast();
  const [topic, setTopic] = useState('Kinematics & Motion');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  
  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleGenerateQuiz = async (overrideTopic?: string) => {
    const targetTopic = overrideTopic || topic;
    if (!targetTopic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setShowExplanation({});
    setCurrentQuestionIndex(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setError('Authentication required. Please sign in to continue.');
        return;
      }

      const res = await fetch('/api/tools/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          topic: targetTopic,
          questionCount,
          context: { educationLevel: user.educationLevel, name: user.name }
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok || json.error) {
        setError(json.error || "CULTURE AI couldn't complete that request right now. Please try again.");
        return;
      }

      if (json.quiz) {
        setQuizData(json.quiz);
      }
    } catch (err) {
      console.error('Quiz error:', err);
      setError("CULTURE AI couldn't complete that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [qId]: optionIdx });
    setShowExplanation({ ...showExplanation, [qId]: true });
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    let score = 0;
    quizData.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-3xl bg-[#0A0A0C] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Interactive AI Quiz Generator</h2>
              <p className="text-xs text-gray-400 font-medium">Tailored to {user.educationLevel.replace('_', ' ').toUpperCase()} level</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic & Options Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
            placeholder="Topic for quiz (e.g. Mitosis, Calculus, WWII, Supply & Demand)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 shrink-0">
              <span className="text-slate-400 font-semibold whitespace-nowrap">Length:</span>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="bg-transparent text-indigo-300 font-bold outline-none cursor-pointer text-xs"
              >
                <option value={3} className="bg-slate-900 text-white">3 Questions</option>
                <option value={5} className="bg-slate-900 text-white">5 Questions</option>
                <option value={8} className="bg-slate-900 text-white">8 Questions</option>
                <option value={10} className="bg-slate-900 text-white">10 Questions</option>
                <option value={15} className="bg-slate-900 text-white">15 Questions</option>
                <option value={20} className="bg-slate-900 text-white">20 Questions</option>
              </select>
            </div>

            <button
              onClick={() => handleGenerateQuiz()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 whitespace-nowrap shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Quiz</span>
            </button>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quiz Content */}
        {quizData ? (
          <div className="space-y-6 pt-2">
            
            {/* Title & Progress */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800/80 pb-3">
              <span className="text-white font-bold">{quizData.title}</span>
              <span>
                Question {currentQuestionIndex + 1} of {quizData.questions.length}
              </span>
            </div>

            {!isSubmitted ? (
              /* ACTIVE QUESTION DISPLAY */
              (() => {
                const q = quizData.questions[currentQuestionIndex];
                if (!q) return null;
                const userChoice = selectedAnswers[q.id];
                const isAnswered = userChoice !== undefined;

                return (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {q.id}. {q.question}
                    </h3>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        const isCorrect = optIdx === q.correctIndex;
                        let optionStyle = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700';

                        if (isAnswered) {
                          if (isSelected) {
                            optionStyle = isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                              : 'bg-red-950/60 border-red-500 text-red-200';
                          } else if (isCorrect) {
                            optionStyle = 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300';
                          }
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`p-4 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isSelected && (
                              isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    {isAnswered && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-300 space-y-1 animate-in fade-in">
                        <span className="font-bold text-indigo-400 block">Explanation:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}

                    {/* Next / Submit Buttons */}
                    <div className="pt-4 flex justify-between items-center">
                      <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                        className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        Previous
                      </button>

                      {currentQuestionIndex < quizData.questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
                        >
                          <span>Next Question</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsSubmitted(true);
                            if (user?.id) {
                              recordLearningActivity(
                                user.id,
                                'quiz_completed',
                                user.subjects[0] || 'General',
                                topic || 'General Quiz',
                                { score: calculateScore(), total: quizData.questions.length }
                              ).then((res) => {
                                if (res?.newlyUnlockedAchievements?.length) {
                                  for (const achId of res.newlyUnlockedAchievements) {
                                    const ach = getAchievementById(achId);
                                    if (ach) {
                                      showSuccess(`🏆 Achievement Unlocked: ${ach.title} — ${ach.description}`);
                                    } else {
                                      console.warn(`[CULTURE AI] Unknown achievement unlocked ID: ${achId}`);
                                    }
                                  }
                                }
                              }).catch((err) => {
                                console.error('[CULTURE AI] Toast achievement alert error:', err);
                              });
                            }
                          }}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                        >
                          Complete Quiz
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* SCORE SUMMARY CARD */
              <div className="text-center py-8 space-y-6 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-xl">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Your Score: <span className="text-indigo-400 font-extrabold text-xl">{calculateScore()} / {quizData.questions.length}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setSelectedAnswers({});
                      setCurrentQuestionIndex(0);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                  >
                    Back to Workspace
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* EMPTY STATE BEFORE GENERATING */
          <div className="text-center py-12 text-slate-500 text-xs italic">
            Enter a topic above and click “Generate Quiz” to build an instant custom quiz!
          </div>
        )}

      </div>
    </div>
  );
};
