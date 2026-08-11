import React, { useState } from 'react';
import { X, Calendar, Sparkles, RefreshCw, Copy, Check, Clock, BookOpen, Users, CheckSquare, AlertCircle } from 'lucide-react';
import { LessonPlanData, UserProfile } from '../../types';
import { recordLearningActivity } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';

interface LessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const LessonPlanModal: React.FC<LessonPlanModalProps> = ({ isOpen, onClose, user }) => {
  const [topic, setTopic] = useState('Introduction to Cell Biology');
  const [gradeLevel, setGradeLevel] = useState(`Grade ${user.educationLevel}`);
  const [duration, setDuration] = useState('45 mins');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<LessonPlanData | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setError('Authentication required. Please sign in to continue.');
        return;
      }

      const res = await fetch('/api/tools/lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          topic,
          gradeLevel,
          duration,
          context: { name: user.name }
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok || json.error) {
        setError(json.error || "CULTURE AI couldn't complete that request right now. Please try again.");
        return;
      }

      if (json.lessonPlan) {
        setPlan(json.lessonPlan);
        if (user?.id) {
          recordLearningActivity(
            user.id,
            'lesson_completed',
            user.subjects[0] || 'General',
            topic || 'Lesson Planning',
            { duration, gradeLevel }
          );
        }
      }
    } catch (err) {
      console.error('Lesson plan error:', err);
      setError("CULTURE AI couldn't complete that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!plan) return;
    const formatted = `LESSON PLAN: ${plan.topic}
Grade: ${plan.gradeLevel} | Duration: ${plan.duration}

OBJECTIVES:
${plan.objectives.map(o => `- ${o}`).join('\n')}

STARTER HOOK:
${plan.starter}

MAIN ACTIVITIES:
${plan.mainActivities.map(a => `- ${a}`).join('\n')}

DIFFERENTIATION:
- Support: ${plan.differentiation.support}
- Extension: ${plan.differentiation.extension}

ASSESSMENT:
${plan.assessment}

HOMEWORK:
${plan.homework}`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-3xl bg-[#0A0A0C] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">45-Minute Lesson Plan Builder</h2>
              <p className="text-xs text-gray-400 font-medium">Professional curriculum co-pilot for teachers</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Lesson Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g. Newton's Laws, Photosynthesis, WWII)..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Grade Level
            </label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g. Grade 8"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Generate Structured Lesson Plan</span>
        </button>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Plan Display */}
        {plan && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{plan.topic}</h3>
                <span className="text-xs text-slate-400">{plan.gradeLevel} • {plan.duration}</span>
              </div>

              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Plan' : 'Copy Plan'}</span>
              </button>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Learning Objectives
              </span>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {plan.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>

            {/* Starter Hook */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Starter Hook
              </span>
              <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {plan.starter}
              </p>
            </div>

            {/* Main Activities */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                Main Classroom Activities
              </span>
              <div className="space-y-1.5">
                {plan.mainActivities.map((a, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Differentiation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Support / Scaffolding
                </span>
                <p className="text-xs text-slate-300">{plan.differentiation.support}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                  Extension Task
                </span>
                <p className="text-xs text-slate-300">{plan.differentiation.extension}</p>
              </div>
            </div>

            {/* Assessment & Homework */}
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Exit Assessment:</strong> {plan.assessment}</p>
              <p><strong className="text-slate-200">Homework Assignment:</strong> {plan.homework}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
