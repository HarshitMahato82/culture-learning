import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Conversation, DashboardCalculatedStats, UserAchievement } from '../types';
import { EDUCATION_LEVELS } from '../data/personas';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  School, 
  Zap, 
  HelpCircle, 
  Layers, 
  MessageSquare, 
  ArrowRight, 
  Calendar, 
  Grid, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  PlayCircle, 
  Trophy, 
  Flame, 
  Milestone, 
  Compass, 
  Lock,
  User,
  Sprout,
  Brain,
  Map as MapIcon,
  Award
} from 'lucide-react';
import { fetchCalculatedDashboardStats } from '../lib/dataService';
import { fetchUserAchievements } from '../lib/achievementService';
import { ACHIEVEMENTS } from '../data/achievements';

const ACHIEVEMENT_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sprout,
  Flame,
  Zap,
  Brain,
  BookOpen,
  Map: MapIcon,
};

const TIER_STYLES: Record<string, { badge: string; border: string; glow: string; text: string }> = {
  bronze: {
    badge: 'bg-amber-950/40 text-amber-400 border-amber-600/30',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    glow: 'from-amber-500/10 via-amber-500/5 to-transparent',
    text: 'text-amber-400',
  },
  silver: {
    badge: 'bg-slate-800/60 text-slate-200 border-slate-500/30',
    border: 'border-slate-400/30 hover:border-slate-400/50',
    glow: 'from-slate-400/10 via-slate-400/5 to-transparent',
    text: 'text-slate-300',
  },
  gold: {
    badge: 'bg-yellow-950/40 text-yellow-300 border-yellow-500/30',
    border: 'border-yellow-500/40 hover:border-yellow-400/60',
    glow: 'from-yellow-500/15 via-amber-500/5 to-transparent',
    text: 'text-yellow-300',
  },
};

interface DashboardProps {
  user: UserProfile;
  conversations: Conversation[];
  onStartNewChat: (initialPrompt?: string) => void;
  onResumeConversation: (id: string) => void;
  onOpenQuizModal: () => void;
  onOpenLessonPlanModal: () => void;
  onOpenLevelComparerModal: () => void;
  onOpenFlashcardsModal: () => void;
  onOpenProfileModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  conversations,
  onStartNewChat,
  onResumeConversation,
  onOpenQuizModal,
  onOpenLessonPlanModal,
  onOpenLevelComparerModal,
  onOpenFlashcardsModal,
  onOpenProfileModal,
}) => {
  const isTeacher = user.role === 'teacher';
  const levelMeta = EDUCATION_LEVELS[user.educationLevel] || EDUCATION_LEVELS.high_school;
  const [selectedSubjectPath, setSelectedSubjectPath] = useState<string>(user.subjects[0] || 'General');

  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAchievements() {
      if (!user?.id) {
        setLoadingAchievements(false);
        return;
      }
      setLoadingAchievements(true);
      try {
        const achievements = await fetchUserAchievements(user.id);
        if (isMounted) {
          setUnlockedAchievements(achievements);
        }
      } catch (err) {
        console.error('[CULTURE AI Dashboard] Failed to load user achievements:', err);
      } finally {
        if (isMounted) {
          setLoadingAchievements(false);
        }
      }
    }

    loadAchievements();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>();
    unlockedAchievements.forEach((ua) => {
      map.set(ua.achievement_id, ua.unlocked_at);
    });
    return map;
  }, [unlockedAchievements]);

  const unlockedCount = unlockedMap.size;
  const totalAchievementsCount = ACHIEVEMENTS.length;

  const [stats, setStats] = useState<DashboardCalculatedStats>({
    overallProgressPercent: 0,
    masteredUnits: 0,
    totalUnits: (user.subjects?.length || 1) * 4,
    currentStreak: 0,
    longestStreak: 0,
    totalSessionsCount: conversations.length,
    totalActivitiesCount: 0,
    savedHoursPerWeek: 0,
    topicProgressList: [],
    weakTopics: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function loadRealStats() {
      if (user?.id) {
        const calculated = await fetchCalculatedDashboardStats(user.id, user.subjects);
        if (isMounted) {
          setStats({
            ...calculated,
            totalSessionsCount: Math.max(conversations.length, calculated.totalSessionsCount),
          });
        }
      }
    }
    loadRealStats();
    return () => {
      isMounted = false;
    };
  }, [user, conversations]);

  // Helper for generating structured learning path modules based on user's real calculated progress
  const getSubjectMilestones = (subj: string) => {
    const existingProg = stats.topicProgressList.find((tp) => tp.subject === subj);
    const overallProg = existingProg ? existingProg.progressPercent : stats.overallProgressPercent;

    const step1Progress = Math.min(100, overallProg >= 25 ? 100 : Math.round(overallProg * 4));
    const step2Progress = overallProg < 25 ? 0 : Math.min(100, Math.round((overallProg - 25) * 3.33));
    const step3Progress = overallProg < 55 ? 0 : Math.min(100, Math.round((overallProg - 55) * 3.33));
    const step4Progress = overallProg < 85 ? 0 : Math.min(100, Math.round((overallProg - 85) * 6.66));

    const goalText = user.goal ? ` aligned with goal: ${user.goal}` : '';

    return [
      {
        id: 1,
        step: '01',
        title: `${subj} Foundations & Core Theories`,
        desc: `Master essential principles, definitions, and core formulas adapted for ${levelMeta.title}${user.goal ? ` to support your goal: ${user.goal}` : ''}.`,
        status: step1Progress === 100 ? 'completed' : step1Progress > 0 ? 'in_progress' : 'upcoming',
        progress: step1Progress,
        prompt: `Explain the core foundational concepts of ${subj} suitable for ${levelMeta.title} level${goalText} with 3 clear examples.`,
      },
      {
        id: 2,
        step: '02',
        title: 'Interactive Application & Problem Solving',
        desc: `Step-by-step problem solving, practical scenarios, and guided practice examples for ${levelMeta.title}.`,
        status: step2Progress === 100 ? 'completed' : step2Progress > 0 ? 'in_progress' : 'upcoming',
        progress: step2Progress,
        prompt: `Give me 3 practice problems on ${subj} with step-by-step solution breakdowns for ${levelMeta.title}${goalText}.`,
      },
      {
        id: 3,
        step: '03',
        title: 'Adaptive Quiz & Misconception Analysis',
        desc: `Self-assessment questions to test deep understanding and clear up tricky edge cases for ${levelMeta.title}.`,
        status: step3Progress === 100 ? 'completed' : step3Progress > 0 ? 'in_progress' : 'upcoming',
        progress: step3Progress,
        prompt: `Create a 5-question adaptive quiz on ${subj} for ${levelMeta.title}${goalText} with hints for wrong answers.`,
      },
      {
        id: 4,
        step: '04',
        title: 'Exam Masterclass & Synthesis Project',
        desc: `Comprehensive exam-style synthesis, high-scoring answer rubrics, and final review for ${levelMeta.title}.`,
        status: step4Progress === 100 ? 'completed' : step4Progress > 0 ? 'in_progress' : 'upcoming',
        progress: step4Progress,
        prompt: `Guide me through an exam-style masterclass on ${subj} covering top grading rubrics for ${levelMeta.title} level${goalText}.`,
      },
    ];
  };

  const currentMilestones = getSubjectMilestones(selectedSubjectPath);

  // Calculate recommended next topic based on student's main subject, learning goals, weak topics, and progress
  const getRecommendedNextTopic = (subject: string) => {
    const normSubject = (subject || '').toLowerCase().trim();

    // Helper for formatting user goal text naturally
    const goalText = user.goal ? user.goal.trim() : '';
    const goalPhrase = goalText
      ? goalText.toLowerCase().includes('exam') || goalText.toLowerCase().includes('test')
        ? ` for your ${goalText}`
        : ` to support your goal: ${goalText}`
      : '';

    // PRIORITY 1 — RECENT DIFFICULTY
    // Look at weakTopics matching the currently selected subject strictly
    const relevantWeakTopics = (stats.weakTopics || [])
      .filter((wt) => (wt.subject || '').toLowerCase().trim() === normSubject)
      .sort((a, b) => {
        const scoreA = a.recencyScore ?? a.incorrectCount;
        const scoreB = b.recencyScore ?? b.incorrectCount;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        const recentA = a.recentIncorrectCount ?? a.incorrectCount;
        const recentB = b.recentIncorrectCount ?? b.incorrectCount;
        if (recentB !== recentA) {
          return recentB - recentA;
        }
        return b.incorrectCount - a.incorrectCount;
      });

    if (relevantWeakTopics.length > 0) {
      const topWeak = relevantWeakTopics[0];
      const isSingleMistake = topWeak.incorrectCount === 1;

      const descText = isSingleMistake
        ? `Review ${topWeak.topic} — strengthen this topic${goalPhrase}.`
        : `Review ${topWeak.topic} — strengthen this topic based on recent practice${goalPhrase}.`;

      return {
        id: `weak-${topWeak.subject}-${topWeak.topic}`,
        step: 'Review',
        title: `Review ${topWeak.topic}`,
        desc: descText,
        status: 'in_progress',
        progress: 50,
        prompt: `I need help reviewing and practicing ${topWeak.topic} in ${subject} suitable for ${levelMeta.title} level${goalText ? ` to support my goal: ${goalText}` : ''}. Please guide me step-by-step through key concepts and targeted practice problems.`,
      };
    }

    // PRIORITY 2 — LOW PROGRESS
    // Look at topicProgressList matching the currently selected subject strictly with progress < 80%
    const relevantLowProgress = (stats.topicProgressList || [])
      .filter((tp) => (tp.subject || '').toLowerCase().trim() === normSubject && tp.progressPercent < 80)
      .sort((a, b) => a.progressPercent - b.progressPercent);

    if (relevantLowProgress.length > 0) {
      const lowestProg = relevantLowProgress[0];

      return {
        id: `lowprog-${lowestProg.subject}-${lowestProg.topic}`,
        step: 'Focus',
        title: `Practice ${lowestProg.topic}`,
        desc: `Practice ${lowestProg.topic} — increase your mastery from ${lowestProg.progressPercent}%${goalPhrase}.`,
        status: 'in_progress',
        progress: lowestProg.progressPercent,
        prompt: `I want to practice and improve my understanding of ${lowestProg.topic} in ${subject} suitable for ${levelMeta.title} level${goalText ? ` to support my goal: ${goalText}` : ''}. Give me key explanations and targeted practice exercises.`,
      };
    }

    // PRIORITY 3 — EXISTING MILESTONE SYSTEM
    // Fall back to existing 4-unit milestone system
    const milestones = getSubjectMilestones(subject);
    const inProgress = milestones.find((m) => m.status === 'in_progress');
    if (inProgress) return inProgress;
    const upcoming = milestones.find((m) => m.status === 'upcoming');
    if (upcoming) return upcoming;
    return milestones[0];
  };

  const nextTopic = getRecommendedNextTopic(selectedSubjectPath);

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100 p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-10 font-sans relative overflow-hidden">
      
      {/* VIBRANT LIQUID AMBIENT BACKGROUND GLOW ORBS */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-pink-500/20 rounded-full blur-[160px] pointer-events-none animate-float-1" />
      <div className="absolute top-1/3 right-0 w-[550px] h-[550px] bg-gradient-to-br from-cyan-500/25 via-blue-600/20 to-indigo-600/30 rounded-full blur-[150px] pointer-events-none animate-float-2" />
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-fuchsia-600/25 via-violet-600/20 to-teal-400/20 rounded-full blur-[170px] pointer-events-none animate-float-1" />

      {/* HEADER GREETING BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[36px] p-8 sm:p-12 border border-white/15 bg-slate-900/60 backdrop-blur-3xl shadow-2xl shadow-indigo-950/60 glass-card"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            
            {/* Role & Level Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-extrabold uppercase tracking-widest shadow-lg ${
                isTeacher 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-amber-500/20 backdrop-blur-md' 
                  : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 shadow-indigo-500/20 backdrop-blur-md'
              }`}>
                {isTeacher ? <School className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                <span>{isTeacher ? 'TEACHER CO-PILOT' : levelMeta.title.toUpperCase()}</span>
              </span>

              <span className="text-xs font-mono font-bold text-cyan-200 bg-cyan-950/70 px-4 py-1.5 rounded-full border border-cyan-400/40 shadow-lg backdrop-blur-md">
                {user.language || 'ENGLISH'}
              </span>
            </div>

            {/* Dynamic Welcome Heading */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {isTeacher
                ? `Welcome, ${user.name}. What are we building today?`
                : `Welcome back, ${user.name}. Ready to learn?`}
            </h1>

            {/* Subjects & Goal */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-xs">
                {isTeacher ? 'Subjects:' : 'Focus Subjects:'}
              </span>
              {user.subjects.map((sub, i) => (
                <span key={i} className="px-3.5 py-1 rounded-full bg-slate-900/90 border border-indigo-400/30 font-bold text-xs text-indigo-200 shadow-sm backdrop-blur-sm">
                  {sub}
                </span>
              ))}
            </div>

            {user.goal && (
              <p className="text-xs text-amber-300 font-semibold italic flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Goal: {user.goal}</span>
              </p>
            )}
          </div>

          {/* Quick Launch Chat CTA & Profile Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onOpenProfileModal && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenProfileModal}
                className="px-6 py-4 rounded-full bg-slate-800/90 hover:bg-slate-700/90 text-indigo-200 hover:text-white font-extrabold text-xs uppercase tracking-wider shadow-lg border border-indigo-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-indigo-300" />
                <span>Edit Profile</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartNewChat()}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-2xl shadow-indigo-500/40 border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '3s' }} />
              <span>{isTeacher ? 'New Teacher Task' : 'Ask CULTURE AI'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* DASHBOARD STATS & RECOMMENDED NEXT (100% USER-SCOPED) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div 
          whileHover={{ scale: 1.03, y: -2 }}
          className="p-6 rounded-[28px] glass-card glass-card-hover group border border-indigo-500/30 hover:border-indigo-400 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-300 mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300">Active Stage</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center group-hover:scale-125 transition-transform duration-100 ease-out">
              <GraduationCap className="w-5 h-5 text-indigo-300" />
            </div>
          </div>
          <p className="text-2xl font-black text-white capitalize">{isTeacher ? `Grade ${user.educationLevel}` : levelMeta.title}</p>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">{isTeacher ? 'Target Audience' : levelMeta.ageRange}</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03, y: -2 }}
          className="p-6 rounded-[28px] glass-card glass-card-hover group border border-sky-500/30 hover:border-sky-400 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-300 mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-300">Saved Threads</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center group-hover:scale-125 transition-transform duration-100 ease-out">
              <MessageSquare className="w-5 h-5 text-sky-300" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalSessionsCount}</p>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Active AI Sessions</span>
        </motion.div>

        {isTeacher ? (
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            className="p-6 rounded-[28px] glass-card glass-card-hover group border border-amber-500/30 hover:border-amber-400 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-300 mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300">Prep Saved</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center group-hover:scale-125 transition-transform duration-100 ease-out">
                <TrendingUp className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{stats.savedHoursPerWeek || 3.5} hrs/wk</p>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Lesson & Quiz Prep Efficiency</span>
          </motion.div>
        ) : (
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }}
            className="p-6 rounded-[28px] glass-card glass-card-hover group border border-purple-500/30 hover:border-purple-400 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-slate-300 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recommended Next</span>
                </span>
                <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/30 text-purple-200">
                  {nextTopic.step.toLowerCase().startsWith('unit') ? nextTopic.step : `Unit ${nextTopic.step}`}
                </span>
              </div>

              {/* Subject selector tabs if user has multiple subjects */}
              {user.subjects.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {user.subjects.map((sub) => {
                    const isSubSelected = selectedSubjectPath === sub;
                    return (
                      <button
                        key={sub}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubjectPath(sub);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          isSubSelected
                            ? 'bg-purple-600 text-white border border-purple-400/40'
                            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-base font-black text-white line-clamp-1 group-hover:text-purple-200 transition-colors">
                {nextTopic.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 font-medium">
                {nextTopic.desc}
              </p>
            </div>

            <div 
              onClick={() => onStartNewChat(nextTopic.prompt)}
              className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-purple-300 group-hover:text-white transition-colors cursor-pointer"
            >
              <span className="uppercase text-[10px]">
                {nextTopic.step === 'Review' ? 'Start Review' : nextTopic.step === 'Focus' ? 'Start Practice' : 'Start Next Unit'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-100" />
            </div>
          </motion.div>
        )}
      </div>

      {/* VISUAL LEARNING PATH & PROGRESS TRACKER */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 sm:p-8 rounded-[32px] glass-card border border-white/15 space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header & Overall Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Milestone className="w-3.5 h-3.5" />
              <span>ACADEMIC JOURNEY TRACKER</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{isTeacher ? 'Curriculum Completion & Unit Tracker' : 'Learning Path & Mastery Progress'}</span>
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Track real-time milestone completion for <span className="text-indigo-300 font-bold">{levelMeta.title}</span>.
            </p>
          </div>

          {/* Gamified Stat Badges (Real Streak & Real Progress & Achievements) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-bold shadow-md">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                {stats.currentStreak > 0 
                  ? `${stats.currentStreak} Day Streak` 
                  : '0 Day Streak'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 text-xs font-bold shadow-md">
              <Trophy className="w-4 h-4 text-indigo-400" />
              <span>{stats.overallProgressPercent}% Path Completed</span>
            </div>
            <button
              onClick={() => {
                document.getElementById('achievements-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{unlockedCount} / {totalAchievementsCount} Badges</span>
            </button>
          </div>
        </div>

        {/* Overall Completion Progress Bar */}
        <div className="space-y-2 relative z-10 bg-slate-950/60 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Overall Path Completion</span>
            </span>
            <span className="text-indigo-300 text-sm font-extrabold">{stats.overallProgressPercent}% Complete</span>
          </div>
          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.overallProgressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-indigo-500/30"
            />
          </div>
        </div>

        {/* Subject Filter Tabs */}
        <div className="space-y-3 relative z-10">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Select Focus Subject:</span>
            <span className="text-indigo-300 font-normal">Click any unit to launch AI session</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.subjects.map((subj, idx) => {
              const isSelected = selectedSubjectPath === subj;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSubjectPath(subj)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border border-indigo-400/50'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                  <span>{subj}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 pt-2">
          {currentMilestones.map((m) => {
            const isCompleted = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';

            return (
              <motion.div
                key={m.id}
                whileHover={{ y: -3, scale: 1.02 }}
                onClick={() => onStartNewChat(m.prompt)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400'
                    : isInProgress
                    ? 'bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-300 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-900/40 border-white/10 hover:border-indigo-400/40 opacity-80'
                }`}
              >
                {isInProgress && (
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-950/80 border border-white/10 text-indigo-300">
                      UNIT {m.step}
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DONE</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                        <PlayCircle className="w-3 h-3 text-amber-300" />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                        <Lock className="w-3 h-3" />
                        <span>NEXT</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-white group-hover:text-indigo-200 transition-colors leading-snug">
                    {m.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-medium">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>PROGRESS</span>
                    <span className="font-bold text-indigo-300">{m.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        isCompleted ? 'bg-emerald-400' : isInProgress ? 'bg-indigo-400' : 'bg-slate-800'
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs font-bold text-indigo-300 group-hover:text-white transition-colors">
                    <span className="uppercase text-[10px]">Start Unit</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-100" />
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* EDUCATIONAL TOOLS SHORTCUTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>{isTeacher ? 'Teacher Productivity Tools' : 'Adaptive Learning Tools'}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* TOOL 1: QUIZ PLAYER */}
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenQuizModal}
            className="group cursor-pointer p-6 rounded-[28px] glass-card glass-card-hover border border-indigo-500/30 hover:border-indigo-400 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-130 group-hover:bg-indigo-500/40 transition-all duration-100 ease-out shadow-lg shadow-indigo-500/20">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                {isTeacher ? '20-Mark Quiz Builder' : 'Interactive Quiz Player'}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                {isTeacher 
                  ? `Generate complete 20-mark assessments for ${user.subjects.join(', ')} with answer schemes.`
                  : `Take adaptive ${levelMeta.title}-level quizzes across ${user.subjects.join(', ')}.`}
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <span>{isTeacher ? 'Build Quiz' : 'Start Quiz'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-100 ease-out" />
            </div>
          </motion.div>

          {/* TOOL 2: LEVEL COMPARER */}
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenLevelComparerModal}
            className="group cursor-pointer p-6 rounded-[28px] glass-card glass-card-hover border border-purple-500/30 hover:border-purple-400 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/25 border border-purple-400/40 text-purple-300 flex items-center justify-center mb-4 group-hover:scale-130 group-hover:bg-purple-500/40 transition-all duration-100 ease-out shadow-lg shadow-purple-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
                4-Level Concept Adapter
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                See any topic in {user.subjects.join(', ')} explained across Primary, Middle, High School, and College levels.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-purple-300 uppercase tracking-wider">
              <span>Compare Levels</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-100 ease-out" />
            </div>
          </motion.div>

          {/* TOOL 3: LESSON PLANNER / REVISION FLASHCARDS */}
          {isTeacher ? (
            <motion.div
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenLessonPlanModal}
              className="group cursor-pointer p-6 rounded-[28px] glass-card glass-card-hover border border-amber-500/30 hover:border-amber-400 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border border-amber-400/40 text-amber-300 flex items-center justify-center mb-4 group-hover:scale-130 group-hover:bg-amber-500/40 transition-all duration-100 ease-out shadow-lg shadow-amber-500/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  Lesson Plan Builder
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  Generate structured unit and lesson plans for {user.subjects.join(', ')}.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider">
                <span>Create Lesson Plan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-100 ease-out" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenFlashcardsModal}
              className="group cursor-pointer p-6 rounded-[28px] glass-card glass-card-hover border border-sky-500/30 hover:border-sky-400 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/25 border border-sky-400/40 text-sky-300 flex items-center justify-center mb-4 group-hover:scale-130 group-hover:bg-sky-500/40 transition-all duration-100 ease-out shadow-lg shadow-sky-500/20">
                  <Grid className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white group-hover:text-sky-300 transition-colors">
                  Revision Flashcards
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  Interactive 3D flipping flashcards for {user.subjects.join(', ')} ({levelMeta.title}).
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-sky-300 uppercase tracking-wider">
                <span>Study Flashcards</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-100 ease-out" />
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* ACHIEVEMENTS & BADGES SECTION */}
      <div id="achievements-section" className="space-y-6 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>CULTURE AI MILESTONES</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Achievements & Badges</span>
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Complete learning activities, practice sessions, and streaks to earn prestigious academic badges.
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{unlockedCount} of {totalAchievementsCount} Unlocked</span>
          </div>
        </div>

        {loadingAchievements ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="p-6 rounded-[28px] glass-card border border-white/10 animate-pulse h-48 bg-slate-900/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedMap.has(achievement.id);
              const unlockedAt = unlockedMap.get(achievement.id);
              const IconComp = ACHIEVEMENT_ICON_MAP[achievement.icon] || Award;
              const tierStyle = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;

              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ y: isUnlocked ? -4 : 0, scale: isUnlocked ? 1.02 : 1 }}
                  className={`p-6 rounded-[28px] glass-card border transition-all relative overflow-hidden flex flex-col justify-between group ${
                    isUnlocked
                      ? `${tierStyle.border} bg-slate-900/80 shadow-xl shadow-amber-500/5`
                      : 'border-white/10 bg-slate-950/50 opacity-60'
                  }`}
                >
                  {/* Tier background glow */}
                  {isUnlocked && (
                    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${tierStyle.glow} rounded-full blur-2xl pointer-events-none`} />
                  )}

                  <div>
                    {/* Header: Tier Badge & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        isUnlocked 
                          ? `${tierStyle.badge} shadow-lg` 
                          : 'bg-slate-900 border-white/10 text-slate-500'
                      }`}>
                        <IconComp className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isUnlocked ? tierStyle.badge : 'bg-slate-900 text-slate-500 border-white/10'
                        }`}>
                          {achievement.tier}
                        </span>

                        {isUnlocked ? (
                          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Unlocked">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700" title="Locked">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Achievement Name & Description */}
                    <h3 className={`text-base font-extrabold ${isUnlocked ? 'text-white' : 'text-slate-400'} group-hover:text-amber-200 transition-colors`}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                      {achievement.description}
                    </p>
                  </div>

                  {/* Footer status */}
                  <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono font-semibold">
                    {isUnlocked ? (
                      <>
                        <span className="text-emerald-400">UNLOCKED</span>
                        <span className="text-slate-400">
                          {unlockedAt ? new Date(unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unlocked'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500">LOCKED</span>
                        <span className="text-slate-500">Keep Learning</span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
