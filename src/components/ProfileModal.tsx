import React, { useState, useEffect } from 'react';
import { UserProfile, EducationLevel, UserRole } from '../types';
import { EDUCATION_LEVELS } from '../data/personas';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  School, 
  BookOpen, 
  Target, 
  Globe, 
  Plus, 
  Check, 
  Sparkles,
  Save,
  AlertCircle
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => Promise<void>;
}

const COMMON_SUBJECTS = [
  'Mathematics', 
  'Physics', 
  'Chemistry', 
  'Biology', 
  'Computer Science', 
  'English Literature', 
  'World History', 
  'Geography', 
  'Economics', 
  'Art & Design'
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Hindi',
  'Japanese',
  'Arabic',
  'Portuguese'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState(user.name || '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(user.educationLevel || 'high_school');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(user.subjects || ['Physics', 'Mathematics']);
  const [customSubject, setCustomSubject] = useState('');
  const [goal, setGoal] = useState(user.goal || '');
  const [language, setLanguage] = useState(user.language || 'English');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep internal form state synchronized with user prop whenever user changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEducationLevel(user.educationLevel || 'high_school');
      setSelectedSubjects(user.subjects || ['Physics', 'Mathematics']);
      setGoal(user.goal || '');
      setLanguage(user.language || 'English');
      setSaveSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length <= 1) {
        showError('At least one subject must be selected.');
        return;
      }
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects([...selectedSubjects, trimmed]);
      setCustomSubject('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('Name cannot be empty.');
      return;
    }
    if (selectedSubjects.length === 0) {
      showError('Please select at least one subject.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const updatedProfile: UserProfile = {
        ...user,
        name: name.trim(),
        educationLevel,
        subjects: selectedSubjects,
        goal: goal.trim(),
        language,
      };

      await onSaveProfile(updatedProfile);
      setSaveSuccess(true);
      showSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showError('Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 glass-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shadow-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">CULTURE Profile Settings</h2>
            <p className="text-xs text-slate-400 font-medium">
              Manage your profile details and personalize your AI dashboard suggestions.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* READ-ONLY ACCOUNT INFORMATION SECTION */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Account Credentials (Read-Only)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email (Read Only) */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="text"
                  value={user.email || 'No email registered'}
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 text-xs font-mono cursor-not-allowed select-none"
                />
              </div>

              {/* Role (Read Only) */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-semibold">
                  {user.role === 'teacher' ? <School className="w-3.5 h-3.5 text-amber-400" /> : <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>Account Role</span>
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                    user.role === 'teacher' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">(Fixed upon account creation)</span>
                </div>
              </div>
            </div>
          </div>

          {/* EDITABLE PROFILE DETAILS */}
          <div className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Display Name</span>
                <span className="text-[10px] text-slate-400 font-normal">Visible across sessions</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Education Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Education Level / Grade</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(EDUCATION_LEVELS) as EducationLevel[]).map((level) => {
                  const meta = EDUCATION_LEVELS[level];
                  const isSelected = educationLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEducationLevel(level)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold">{meta.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{meta.ageRange}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Focus Subjects */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Selected Focus Subjects</span>
                </span>
                <span className="text-[10px] text-indigo-300 font-mono">
                  {selectedSubjects.length} selected
                </span>
              </label>

              {/* Subject Badges */}
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-950/60 border border-white/10 min-h-[52px]">
                {selectedSubjects.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className="hover:text-rose-300 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Subject Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSubject();
                    }
                  }}
                  placeholder="Add custom subject (e.g. Organic Chemistry, Quantum Mechanics)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Common Subjects Options */}
              <div className="pt-1">
                <p className="text-[11px] font-mono text-slate-400 mb-1.5">Quick add common subjects:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SUBJECTS.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40'
                            : 'bg-slate-950/40 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        {isSelected ? `✓ ${sub}` : `+ ${sub}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Learning Goal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Learning Goal / Target</span>
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Ace college calculus and master physics problem solving"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Preferred Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="bg-slate-900 text-white">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
