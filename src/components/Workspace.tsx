import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, Conversation } from '../types';
import { EDUCATION_LEVELS, TEACHER_CONFIG } from '../data/personas';
import { MarkdownRenderer } from './MarkdownRenderer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Plus, 
  HelpCircle, 
  Layers, 
  Calendar, 
  Grid, 
  Copy, 
  Check, 
  GraduationCap, 
  School, 
  ArrowLeft, 
  Trash2, 
  BookOpen, 
  RefreshCw,
  Zap,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';

interface WorkspaceProps {
  user: UserProfile;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  onSendMessage: (text: string) => Promise<void>;
  onStartNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAllConversations?: () => void;
  onBackToDashboard: () => void;
  onOpenQuizModal: () => void;
  onOpenLessonPlanModal: () => void;
  onOpenLevelComparerModal: () => void;
  onOpenFlashcardsModal: () => void;
  isGenerating: boolean;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  user,
  activeConversation,
  conversations,
  onSendMessage,
  onStartNewChat,
  onSelectConversation,
  onDeleteConversation,
  onDeleteAllConversations,
  onBackToDashboard,
  onOpenQuizModal,
  onOpenLessonPlanModal,
  onOpenLevelComparerModal,
  onOpenFlashcardsModal,
  isGenerating,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(user.subjects[0] || 'General');
  
  /* COLLAPSIBLE SIDEBAR STATE */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const sidebarWidth = 320; // Wide by default
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const isTeacher = user.role === 'teacher';
  const levelMeta = EDUCATION_LEVELS[user.educationLevel] || EDUCATION_LEVELS.high_school;

  const quickActions = isTeacher 
    ? TEACHER_CONFIG.quickActions 
    : levelMeta.quickActions;

  const suggestedPrompts = isTeacher 
    ? TEACHER_CONFIG.suggestedPrompts 
    : levelMeta.suggestedPrompts;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isGenerating]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isGenerating) return;
    setInputText('');
    await onSendMessage(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      
      {/* ADJUSTABLE & COLLAPSIBLE SIDEBAR: CONVERSATION HISTORY & CONTEXT */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: sidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: `${sidebarWidth}px` }}
            className="border-r border-white/15 bg-slate-900/90 flex flex-col justify-between shrink-0 backdrop-blur-2xl z-20 overflow-hidden"
          >
            <div className="p-4 space-y-5 overflow-y-auto">
              
              {/* Top Controls: Dashboard Back, New Session */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onBackToDashboard}
                  className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors shadow-md cursor-pointer"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onStartNewChat}
                  className="flex-1 py-2.5 px-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Session</span>
                </motion.button>
              </div>

              {/* User Context Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-1 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-2 truncate">
                    {isTeacher ? <School className="w-4 h-4 text-amber-400 shrink-0" /> : <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />}
                    <span className="capitalize truncate">{user.name}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase shrink-0">
                    {isTeacher ? 'TEACHER' : user.educationLevel.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Conversation History List */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 block">
                    SESSION HISTORY ({conversations.length})
                  </span>
                  {conversations.length > 0 && onDeleteAllConversations && (
                    <button
                      onClick={onDeleteAllConversations}
                      className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Clear all sessions"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic px-2 py-3 text-center">No previous sessions.</p>
                  ) : (
                    conversations.map((c) => {
                      const isActive = activeConversation?.id === c.id;
                      return (
                        <motion.div
                          key={c.id}
                          whileHover={{ x: 3 }}
                          onClick={() => onSelectConversation(c.id)}
                          className={`group w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-indigo-600/30 text-indigo-100 border border-indigo-400/50 shadow-md'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <span className="truncate pr-2 font-medium">{c.title || 'New Session'}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(c.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity p-1 cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar Footer - Gemini Removed */}
            <div className="p-3 border-t border-white/10 text-center text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
              CULTURE AI • ADAPTIVE LEARNING
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950 relative">
        
        {/* Workspace Top Header Bar */}
        <div className="h-14 border-b border-white/15 px-4 sm:px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            
            {/* Sidebar Toggle Button when Collapsed or Open */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/15 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-indigo-300" /> : <PanelLeftOpen className="w-4 h-4 text-indigo-300" />}
              <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-indigo-200">
                {isSidebarOpen ? 'Hide Menu' : 'Sessions Menu'}
              </span>
            </motion.button>

            <button
              onClick={onBackToDashboard}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                CULTURE AI Workspace
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                isTeacher 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}>
                {isTeacher ? 'Teacher Persona' : `${levelMeta.title} Persona`}
              </span>
            </div>
          </div>

          {/* Subject Pills Filter */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-full border border-slate-800 text-sm">
            {user.subjects.map((sub, i) => (
              <button
                key={i}
                onClick={() => setSelectedSubjectFilter(sub)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedSubjectFilter === sub
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* MESSAGES THREAD OR EMPTY WELCOME STATE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            /* EMPTY WELCOME STATE */
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto py-8 text-center space-y-8"
            >
              
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs sm:text-sm font-extrabold shadow-xl shadow-indigo-500/15">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  {isTeacher 
                    ? `Configured for Teacher • ${user.educationLevel.toUpperCase()} Grade Level` 
                    : `Configured for ${levelMeta.title} • ${levelMeta.ageRange}`}
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                {isTeacher
                  ? `What are we creating today, ${user.name}?`
                  : `Hi ${user.name}! What would you like to learn today?`}
              </h2>

              <p className="text-base sm:text-xl text-slate-200 max-w-xl mx-auto leading-relaxed font-medium">
                {isTeacher
                  ? 'Generate structured lesson plans, 20-mark quizzes, or analyze student misconceptions.'
                  : `CULTURE adapts explanations, depth, and examples specifically for ${levelMeta.title}.`}
              </p>

              {/* CLEAN PROMPT STARTERS - LARGER & HIGHLY LEGIBLE */}
              <div className="space-y-4 pt-6 text-left max-w-2xl mx-auto">
                <div className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest px-1">
                  SUGGESTED PROMPTS FOR {selectedSubjectFilter.toUpperCase()}:
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {suggestedPrompts.map((sp, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend(sp)}
                      className="w-full p-5 sm:p-6 rounded-2xl glass-card hover:bg-slate-800/90 border border-indigo-500/30 hover:border-indigo-400 text-slate-100 text-base sm:text-lg text-left transition-all flex items-center justify-between group shadow-xl cursor-pointer"
                    >
                      <span className="font-semibold text-slate-100 group-hover:text-indigo-200 leading-snug">“{sp}”</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 ml-3 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-100">
                        <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:text-white" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

            </motion.div>
          ) : (
            /* MESSAGES THREAD - LARGER FONTS & HIGHER CONTRAST */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeConversation.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar for Assistant */}
                    {!isUser && (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[2px] shrink-0 shadow-lg shadow-indigo-500/30">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-300">
                          <Bot className="w-5 h-5" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`relative max-w-[88%] rounded-3xl p-6 text-base sm:text-lg leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-tr-none shadow-2xl shadow-indigo-600/30'
                          : 'glass-card border border-white/15 text-slate-100 rounded-tl-none shadow-2xl'
                      }`}
                    >
                      {/* Message Content */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-sans text-base sm:text-lg leading-relaxed">
                          {msg.text}
                        </div>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}

                      {/* Copy Button for Assistant */}
                      {!isUser && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm text-slate-300">
                          <span className="font-mono text-xs text-indigo-300 font-bold">
                            Adapted for {isTeacher ? 'Teacher' : levelMeta.title}
                          </span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-lg bg-slate-800/80 border border-white/10"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Avatar for User */}
                    {isUser && (
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 border border-white/15 shadow-md">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* GENERATING LOADING INDICATOR */}
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3.5 justify-start items-start"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="glass-card border border-indigo-400/40 text-slate-100 rounded-3xl rounded-tl-none p-5 text-sm sm:text-base font-medium flex items-center gap-3 shadow-2xl">
                    <RefreshCw className="w-5 h-5 text-indigo-300 animate-spin" />
                    <span>
                      CULTURE AI is formulating an adaptive answer for{' '}
                      <span className="text-amber-300 font-bold">
                        {isTeacher ? 'Teacher' : levelMeta.title}
                      </span>
                      ...
                    </span>
                  </div>
                </motion.div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* INPUT BOX AREA - LARGER INPUT & TEXT */}
        <div className="p-4 sm:p-6 border-t border-white/15 bg-slate-900/80 backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto space-y-2.5">
            
            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center bg-slate-950/90 border border-white/20 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/40 rounded-full p-2.5 transition-all shadow-2xl glass-card"
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isTeacher
                    ? "Ask for a lesson plan, 20-mark quiz, rubric, or classroom activity..."
                    : `Ask CULTURE anything about ${selectedSubjectFilter}...`
                }
                rows={1}
                className="flex-1 bg-transparent px-5 py-3 text-base sm:text-lg text-white placeholder-slate-400 outline-none resize-none max-h-36 min-h-[46px] leading-snug"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 hover:from-indigo-400 hover:to-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-4">
              <span>PRESS ENTER TO SEND • SHIFT + ENTER FOR NEW LINE</span>
              <span className="text-indigo-300 font-bold">ADAPTIVE LEARNING ENGINE</span>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

