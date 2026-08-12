import React, { useState } from 'react';
import { X, Grid, Sparkles, RefreshCw, ArrowLeft, ArrowRight, RotateCw, AlertCircle } from 'lucide-react';
import { Flashcard, UserProfile } from '../../types';
import { recordLearningActivity } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { getAchievementById } from '../../data/achievements';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose, user }) => {
  const { showSuccess } = useToast();
  const [topic, setTopic] = useState('Key Formulas in Physics');
  const [cardCount, setCardCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { front: 'Kinematic equation for final velocity with constant acceleration', back: 'v = u + at' },
    { front: 'Newton’s Second Law of Motion', back: 'F = m · a (Force = Mass × Acceleration)' },
    { front: 'Gravitational Potential Energy formula', back: 'PE = m · g · h' },
    { front: 'Kinetic Energy formula', back: 'KE = ½ · m · v²' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCards = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setError('Authentication required. Please sign in to continue.');
        return;
      }

      const res = await fetch('/api/tools/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          topic,
          count: cardCount,
          context: { educationLevel: user.educationLevel }
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok || json.error) {
        setError(json.error || "CULTURE AI couldn't complete that request right now. Please try again.");
        return;
      }

      if (json.flashcards && Array.isArray(json.flashcards)) {
        setFlashcards(json.flashcards);
        if (user?.id) {
          recordLearningActivity(
            user.id,
            'practice_completed',
            user.subjects[0] || 'General',
            topic || 'Flashcard Revision',
            { cardCount: json.flashcards.length }
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
      }
    } catch (err) {
      console.error('Flashcards error:', err);
      setError("CULTURE AI couldn't complete that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-2xl bg-[#0A0A0C] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">3D Revision Flashcards</h2>
              <p className="text-xs text-gray-400 font-medium">Click card to flip • Active recall revision</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateCards()}
            placeholder="Topic for flashcards (e.g. Organic Chemistry, Calculus, History dates)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 shrink-0">
              <span className="text-slate-400 font-semibold whitespace-nowrap">Count:</span>
              <select
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="bg-transparent text-sky-300 font-bold outline-none cursor-pointer text-xs"
              >
                <option value={3} className="bg-slate-900 text-white">3 Cards</option>
                <option value={5} className="bg-slate-900 text-white">5 Cards</option>
                <option value={8} className="bg-slate-900 text-white">8 Cards</option>
                <option value={10} className="bg-slate-900 text-white">10 Cards</option>
                <option value={15} className="bg-slate-900 text-white">15 Cards</option>
                <option value={20} className="bg-slate-900 text-white">20 Cards</option>
              </select>
            </div>

            <button
              onClick={handleGenerateCards}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 whitespace-nowrap shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate</span>
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

        {/* Card Arena */}
        {currentCard ? (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span className="text-[10px] text-sky-400 uppercase tracking-wider">Click card to flip</span>
            </div>

            {/* FLIP CARD CONTAINER */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full h-64 cursor-pointer perspective-1000"
            >
              <div
                className={`w-full h-full rounded-2xl p-8 border-2 transition-transform duration-500 transform-style-3d flex flex-col items-center justify-center text-center shadow-2xl ${
                  isFlipped
                    ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 text-indigo-100'
                    : 'bg-gradient-to-br from-slate-950 to-slate-900 border-sky-500/50 text-white'
                }`}
              >
                <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {isFlipped ? 'ANSWER / BACK' : 'QUESTION / FRONT'}
                </div>

                <p className="text-base sm:text-lg font-bold leading-relaxed max-w-md">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>

                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Flip</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(currentIndex - 1);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                disabled={currentIndex === flashcards.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(currentIndex + 1);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
