import React, { useState } from 'react';
import { UserRole, EducationLevel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  GraduationCap, 
  School, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Brain, 
  Target, 
  Users
} from 'lucide-react';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
  onSelectPresetAndLaunch: (role: UserRole, level?: EducationLevel) => void;
  onOpenLevelComparer: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectRole,
  onSelectPresetAndLaunch,
  onOpenLevelComparer,
}) => {
  const [activeTeaserTopic, setActiveTeaserTopic] = useState<'gravity' | 'photosynthesis' | 'ai'>('gravity');
  const [activeTeaserTab, setActiveTeaserTab] = useState<EducationLevel | 'teacher'>('primary');

  const TEASER_DATA = {
    gravity: {
      title: 'Gravity',
      primary: 'Gravity is like an invisible, gentle hug from Earth that keeps your shoes on the ground so you don’t float away into outer space! 🎈',
      middle: 'Gravity is the pull force between masses. Earth has huge mass, so it pulls you, your house, and the ocean towards its center.',
      high_school: 'Governed by Newton’s Law of Universal Gravitation (F = G·m₁m₂ / r²), gravity is the inverse-square force of attraction between masses.',
      university: 'General Relativity models gravity not as a traditional vector force, but as geodesic acceleration caused by spacetime curvature.',
      teacher: 'Unit Strategy for Grade 8: Begin with a bowling-ball-on-trampoline demo. Misconception alert: Students often confuse mass with gravitational force.'
    },
    photosynthesis: {
      title: 'Photosynthesis',
      primary: 'Plants drink water through their roots, breathe in air, and use sunshine like a magic blender to make sweet plant sugar! ☀️🌱',
      middle: 'Plants use chlorophyll in their green leaves to capture sunlight, combining CO₂ and H₂O to create glucose and release oxygen.',
      high_school: 'Light-dependent reactions in thylakoid membranes split H₂O (producing ATP & NADPH), driving the Calvin cycle in the stroma to fix CO₂.',
      university: 'Photophosphorylation via Photosystem II (P680) and Photosystem I (P700) establishes a proton motive force across thylakoids.',
      teacher: 'Lab Idea: Use spinach leaf disks in sodium bicarbonate solution to measure O₂ production rate under varying light wavelengths.'
    },
    ai: {
      title: 'Neural Networks',
      primary: 'A neural network is like a team of tiny digital friends passing notes to guess if a picture shows a dog or a cat! 🐶🐱',
      middle: 'AI learns from examples. It calculates scores through connected mathematical layers and adjusts weights until it gets answers right.',
      high_school: 'Artifical neural networks pass vector inputs through weighted layers with non-linear activations (ReLU, Sigmoid) and optimize via backpropagation.',
      university: 'Deep learning optimizes non-convex loss surfaces using stochastic gradient descent (SGD) and backpropagation via the chain rule.',
      teacher: 'Classroom Activity: Run a human neural network simulation using colored index cards to demonstrate weight multiplication.'
    }
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Background Decorative Gradient Blurs - Educational Psychology Palette */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[160px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[170px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-teal-500 rounded-full blur-[180px] opacity-15 pointer-events-none"></div>

      {/* Subtle Side Rail Text */}
      <div className="hidden xl:block absolute right-[-70px] top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold tracking-[0.5em] text-slate-500 uppercase pointer-events-none whitespace-nowrap">
        EMPOWERING THE NEXT GENERATION OF MINDS
      </div>

      {/* MAIN HERO CONTENT */}
      <main className="relative flex-1 flex flex-col px-4 sm:px-8 lg:px-12 pt-8 pb-12 z-10 max-w-7xl mx-auto w-full">
        
        {/* Top Header Grid: Bold Headline & Status */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div className="max-w-3xl">
            {/* System Tag */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] uppercase text-indigo-300 py-1.5 px-4 border border-indigo-500/40 rounded-full mb-6 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Adaptive Educational Intelligence</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl sm:text-7xl lg:text-[96px] leading-[0.88] font-black tracking-tighter text-white mb-6"
            >
              AI THAT <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300">
                UNDERSTANDS
              </span><br/>
              HOW YOU LEARN.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-slate-300 font-medium max-w-xl border-l-4 border-amber-400 pl-4 leading-relaxed"
            >
              The first adaptive educational intelligence designed to dynamically evolve its vocabulary, depth, and tools with your academic journey.
            </motion.p>
          </div>

          <div className="text-left lg:text-right border-l lg:border-l-0 lg:border-r border-indigo-500/40 pl-4 lg:pl-0 lg:pr-4">
            <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
              SYSTEM STATUS
            </div>
            <div className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 lg:justify-end">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span>L-MODEL V4.2 ACTIVE</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              CULTURE AI ADAPTIVE ENGINE
            </div>
          </div>
        </div>

        {/* ROLE SELECTION CARDS */}
        <div className="space-y-4 mb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-indigo-400">
              // CHOOSE YOUR WORKSPACE ARCHETYPE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Student Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole('student')}
              className="group relative bg-slate-900/80 border border-indigo-500/30 rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 flex flex-col justify-between hover:bg-slate-900/95 cursor-pointer transition-all duration-300 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/25"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-125 transition-transform duration-100 ease-out">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-300 py-1.5 px-3.5 border border-indigo-400/40 rounded-full bg-indigo-500/20 shadow-sm">
                  Personalized Path
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>I AM A <span className="text-indigo-400">STUDENT</span></span>
                  <ArrowRight className="w-7 h-7 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-2.5 transition-transform duration-100 ease-out" />
                </h3>
                <p className="text-slate-300 text-sm max-w-sm leading-relaxed font-medium">
                  Unlock an AI companion that adapts its explanations, difficulty, and tone to your specific learning stage.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-indigo-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Primary • Middle • High School • University</span>
              </div>
            </motion.div>

            {/* Teacher Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole('teacher')}
              className="group relative bg-slate-900/80 border border-amber-500/30 rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 flex flex-col justify-between hover:bg-slate-900/95 cursor-pointer transition-all duration-300 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/25"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-125 transition-transform duration-100 ease-out">
                  <School className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-300 py-1.5 px-3.5 border border-amber-400/40 rounded-full bg-amber-500/20 shadow-sm">
                  Co-Pilot Mode
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>I AM A <span className="text-amber-400">TEACHER</span></span>
                  <ArrowRight className="w-7 h-7 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-2.5 transition-transform duration-100 ease-out" />
                </h3>
                <p className="text-slate-300 text-sm max-w-sm leading-relaxed font-medium">
                  Automate lesson planning, generate 20-mark quizzes, and identify student misconceptions in seconds.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-4 text-[10px] font-mono text-amber-300 uppercase tracking-wider">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> CURRICULUM SYNC</span>
                <span>•</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> RUBRIC ENGINE</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* INTERACTIVE ADAPTATION TEASER */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-[32px] p-6 sm:p-10 backdrop-blur-xl mb-16 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.2em] uppercase text-indigo-300 bg-indigo-500/20 px-3.5 py-1 rounded-full border border-indigo-500/30 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>DYNAMIC CONCEPT ADAPTATION DEMO</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                See How CULTURE Adapts The Same Topic
              </h3>
            </div>

            {/* Topic Switcher Buttons with Motion */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-full border border-slate-800">
              {(['gravity', 'photosynthesis', 'ai'] as const).map((topic) => (
                <motion.button
                  key={topic}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTeaserTopic(topic)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTeaserTopic === topic 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {topic === 'gravity' ? 'Gravity 🚀' : topic === 'photosynthesis' ? 'Photosynthesis 🌱' : 'Neural Networks 🧠'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Level Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            {[
              { id: 'primary', label: 'Primary (Ages 5-11)', icon: '🎈' },
              { id: 'middle', label: 'Middle (Ages 11-14)', icon: '🧭' },
              { id: 'high_school', label: 'High School (Ages 14-18)', icon: '🎓' },
              { id: 'university', label: 'University Level', icon: '🔬' },
              { id: 'teacher', label: 'Teacher Co-Pilot', icon: '👨‍🏫' },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTeaserTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${
                  activeTeaserTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-amber-500/20 text-white border border-indigo-400 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Teaser Display Box */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${activeTeaserTopic}-${activeTeaserTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-6 p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800 relative min-h-[120px] flex items-center shadow-inner"
            >
              <div className="absolute top-3 right-4 text-[10px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                CULTURE OUTPUT • {activeTeaserTab.toUpperCase().replace('_', ' ')}
              </div>
              <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
                {TEASER_DATA[activeTeaserTopic][activeTeaserTab as keyof typeof TEASER_DATA['gravity']]}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono">
            <span>// NOTICE HOW VOCABULARY AND RIGOR TRANSFORM DYNAMICALLY</span>
            <motion.button
              whileHover={{ x: 3 }}
              onClick={onOpenLevelComparer}
              className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Launch 4-Level Adapter</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* FEATURE HIGHLIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-8 rounded-[28px] bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Dynamic Personas</h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Stories for Primary kids, formulas for High Schoolers, scholarly proofs for University, and lesson structures for Teachers.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-8 rounded-[28px] bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Embedded Tools</h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Generate instant graded quizzes, 3D flip flashcards, and complete 45-minute structured lesson plans.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-8 rounded-[28px] bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Tailored Workspaces</h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Specialized learner workspace with quick study prompts and educator workspace with curriculum tools.
            </p>
          </motion.div>
        </div>

      </main>

      {/* FOOTER / BRANDING */}
      <footer className="px-6 sm:px-12 py-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] gap-4 z-10 bg-slate-950">
        <div>© 2026 CULTURE EDUCATION LABS</div>
        <div className="flex flex-wrap gap-8">
          <span>PRIVACY PROTOCOL</span>
          <span>SYSTEM VER: 4.2</span>
          <span className="text-indigo-400 font-extrabold">HACKATHON EDITION 1.0</span>
        </div>
      </footer>

    </div>
  );
};


