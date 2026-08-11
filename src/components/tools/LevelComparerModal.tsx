import React, { useState } from 'react';
import { X, Layers, Sparkles, RefreshCw, BookOpen, Compass, GraduationCap, Library, ArrowRight, AlertCircle } from 'lucide-react';
import { LevelAdaptation } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { supabase } from '../../lib/supabase';

interface LevelComparerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LevelComparerModal: React.FC<LevelComparerModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('Photosynthesis');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LevelAdaptation | null>({
    topic: 'Photosynthesis',
    adaptations: {
      primary: 'Plants drink water through their roots, breathe in air, and use sunshine like a magic blender to make sweet plant food! ☀️🌱',
      middle: 'Plants use green chlorophyll in their leaves to absorb sunlight, turning carbon dioxide and water into glucose sugar while releasing oxygen.',
      high_school: 'Light-dependent reactions in thylakoid membranes split water to generate ATP and NADPH, which power the Calvin cycle in the stroma to fix carbon.',
      university: 'Oxygenic photosynthesis utilizes Photosystem II (P680) and Photosystem I (P700) to induce electron transport, generating a proton motive force that drives ATP synthesis via CF₁CF₀-ATPase.'
    }
  });

  if (!isOpen) return null;

  const handleFetchComparison = async (overrideTopic?: string) => {
    const targetTopic = overrideTopic || topic;
    if (!targetTopic.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setError('Authentication required. Please sign in to continue.');
        return;
      }

      const res = await fetch('/api/tools/compare-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ topic: targetTopic }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok || json.error) {
        setError(json.error || "CULTURE AI couldn't complete that request right now. Please try again.");
        return;
      }

      if (json.adaptations) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to compare levels:', err);
      setError("CULTURE AI couldn't complete that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-4xl bg-[#0A0A0C] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">4-Level Concept Adapter</h2>
              <p className="text-xs text-gray-400 font-medium">See how CULTURE adapts 1 topic across all 4 school stages</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar & Presets */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchComparison()}
              placeholder="Enter any educational topic (e.g. Gravity, Black Holes, Supply and Demand)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500"
            />
            <button
              onClick={() => handleFetchComparison()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Adapt Topic</span>
            </button>
          </div>

          {/* Quick Preset Topics */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-500">Quick Presets:</span>
            {['Gravity', 'Photosynthesis', 'Newton’s Third Law', 'Pythagorean Theorem', 'Supply & Demand', 'Neural Networks'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setTopic(p);
                  handleFetchComparison(p);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white shrink-0 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Cards Display Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* PRIMARY SCHOOL */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Primary School (Ages 5–11)</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                  Playful & Visual
                </span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-normal">
                <MarkdownRenderer content={data.adaptations.primary} />
              </div>
            </div>

            {/* MIDDLE SCHOOL */}
            <div className="p-5 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>2. Middle School (Ages 11–14)</span>
                </span>
                <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20">
                  Everyday Life Examples
                </span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-normal">
                <MarkdownRenderer content={data.adaptations.middle} />
              </div>
            </div>

            {/* HIGH SCHOOL */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>3. High School (Ages 14–18)</span>
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                  Exam Focus & Formulas
                </span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-normal">
                <MarkdownRenderer content={data.adaptations.high_school} />
              </div>
            </div>

            {/* UNIVERSITY */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Library className="w-4 h-4" />
                  <span>4. University Level</span>
                </span>
                <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                  Scholarly Rigor
                </span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-normal">
                <MarkdownRenderer content={data.adaptations.university} />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
