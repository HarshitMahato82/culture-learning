import React, { useState } from 'react';
import { UserProfile } from '../types';
import { GraduationCap, School, ChevronDown, Layers, LogOut, User, LogIn, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenLevelComparer: () => void;
  onOpenProfileModal?: () => void;
  activeView: 'landing' | 'onboarding' | 'dashboard' | 'workspace';
  setActiveView: (view: 'landing' | 'onboarding' | 'dashboard' | 'workspace') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuthModal,
  onLogout,
  onOpenLevelComparer,
  onOpenProfileModal,
  activeView,
  setActiveView,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/15 bg-slate-950/70 backdrop-blur-2xl shadow-2xl shadow-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <motion.div 
          onClick={() => {
            if (user) setActiveView('dashboard');
            else setActiveView('landing');
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              CULTURE
            </span>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse group-hover:scale-150 transition-transform duration-100 ease-out"></div>
          </div>
        </motion.div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          
          {/* Level Adapter Comparison Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenLevelComparer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-purple-400/40 bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 hover:text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-500/20 glass-pill cursor-pointer group"
            title="See how CULTURE adapts 1 topic across all 4 school levels side-by-side"
          >
            <Layers className="w-4 h-4 text-purple-300 group-hover:scale-125 transition-transform duration-100 ease-out" />
            <span className="hidden sm:inline">Compare Levels</span>
            <span className="sm:hidden">Adapter</span>
          </motion.button>

          {/* EDUCATOR / TEACHER indicator pill when user is a teacher */}
          {user && user.role === 'teacher' && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
              <School className="w-3.5 h-3.5 text-amber-400" />
              <span>EDUCATOR [TEACHER]</span>
            </div>
          )}

          {/* User Account State: Unauthenticated vs Authenticated */}
          {user ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                aria-label="User account menu"
                aria-expanded={showUserDropdown}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-indigo-400/40 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-sky-500/30 hover:border-indigo-300 text-white text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-indigo-500/20 glass-pill cursor-pointer group"
              >
                {user.role === 'teacher' ? (
                  <School className="w-4 h-4 text-amber-300 group-hover:scale-125 transition-transform duration-100 ease-out" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-sky-300 group-hover:scale-125 transition-transform duration-100 ease-out" />
                )}
                <span>👤 {user.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-indigo-300 transition-transform duration-150 ${showUserDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Account Dropdown Menu */}
              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-white/20 shadow-2xl p-3 z-50 text-xs backdrop-blur-2xl glass-card space-y-2"
                  >
                    <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
                      <p className="font-extrabold text-sm text-white truncate">{user.name}</p>
                      {user.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
                      <div className="pt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-400/30 font-mono font-bold uppercase text-xs">
                          {user.role}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold uppercase text-xs">
                          {user.educationLevel.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (onOpenProfileModal) onOpenProfileModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 font-extrabold transition-colors flex items-center gap-2 cursor-pointer border border-indigo-500/20"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-300" />
                      <span>My Profile Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveView('dashboard');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white font-bold transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Dashboard & Progress</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveView('dashboard');
                        setTimeout(() => {
                          document.getElementById('achievements-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white font-bold transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Achievements & Badges</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveView('workspace');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white font-bold transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>AI Learning Workspace</span>
                    </button>

                    <div className="pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold uppercase tracking-wider text-xs sm:text-sm shadow-xl shadow-indigo-500/30 transition-all cursor-pointer border border-white/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In / Sign Up</span>
            </motion.button>
          )}

        </div>
      </div>
    </header>
  );
};
