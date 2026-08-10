import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap, 
  School,
  KeyRound,
  ShieldCheck,
  Database
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole, EducationLevel, UserProfile } from '../types';
import { upsertUserProfile } from '../lib/dataService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: 'login' | 'signup';
  initialRole?: UserRole;
  pendingProfile?: Partial<UserProfile>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  initialRole = 'student',
  pendingProfile,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(pendingProfile?.name || '');
  const [role, setRole] = useState<UserRole>(initialRole || pendingProfile?.role || 'student');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    pendingProfile?.educationLevel || 'high_school'
  );

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialRole) setRole(initialRole);
      if (pendingProfile?.role) setRole(pendingProfile.role);
      if (pendingProfile?.name) setName(pendingProfile.name);
      if (pendingProfile?.educationLevel) setEducationLevel(pendingProfile.educationLevel);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode, initialRole, pendingProfile]);

  if (!isOpen) return null;

  const formatAuthError = (error: any): string => {
    if (!error) return 'An unexpected error occurred. Please try again.';

    const msg = typeof error === 'string' ? error : (error.message || String(error));
    const lower = msg.toLowerCase();

    if (lower.includes('user already registered') || lower.includes('email already in use') || lower.includes('already exists') || lower.includes('user_already_exists')) {
      return 'An account with this email already exists. Try logging in.';
    }
    if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
      return 'Please enter a valid email address.';
    }
    if (lower.includes('password') && (lower.includes('weak') || lower.includes('short') || lower.includes('at least'))) {
      return 'Your password must meet the required minimum length (at least 6 characters).';
    }
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error')) {
      return 'Unable to connect to CULTURE right now. Please try again.';
    }
    if (lower.includes('unexpected end of json input')) {
      return 'Received empty response from server. Please check your Supabase settings.';
    }

    return error.message || 'An error occurred during authentication. Please try again.';
  };

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured) {
      // Offline fallback mode
      setTimeout(() => {
        const fakeProfile: UserProfile = {
          id: `local-user-${Date.now()}`,
          email: email,
          name: email.split('@')[0] || 'Learner',
          role: role,
          educationLevel: educationLevel,
          subjects: pendingProfile?.subjects || ['Physics', 'Calculus'],
          goal: pendingProfile?.goal || 'Excel in academics',
          language: pendingProfile?.language || 'English',
        };
        upsertUserProfile(fakeProfile);
        onAuthSuccess(fakeProfile);
        setLoading(false);
        onClose();
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch or build user profile
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profErr) {
          console.warn('Could not fetch profile from database:', profErr.message);
        }

        let resolvedProfile: UserProfile;

        if (profData) {
          const rawSubjs = profData.subjects;
          const parsedSubjs = typeof rawSubjs === 'string'
            ? rawSubjs.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(rawSubjs) ? rawSubjs : ['Physics', 'Calculus']);

          resolvedProfile = {
            id: profData.id,
            email: profData.email || data.user.email || email,
            name: profData.name || data.user.user_metadata?.name || 'CULTURE Learner',
            role: (profData.role as UserRole) || data.user.user_metadata?.role || 'student',
            educationLevel: (profData.education_level as EducationLevel) || data.user.user_metadata?.education_level || 'high_school',
            subjects: parsedSubjs,
            goal: profData.learning_goal || data.user.user_metadata?.learning_goal,
            language: profData.preferred_language || data.user.user_metadata?.preferred_language || 'English',
          };
        } else {
          const meta = data.user.user_metadata || {};
          const metaSubjs = meta.subjects;
          const parsedSubjs = typeof metaSubjs === 'string'
            ? metaSubjs.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(metaSubjs) ? metaSubjs : ['Physics', 'Calculus']);

          resolvedProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: meta.name || name || email.split('@')[0] || 'CULTURE Learner',
            role: meta.role || role || 'student',
            educationLevel: meta.education_level || educationLevel || 'high_school',
            subjects: parsedSubjs,
            goal: meta.learning_goal || pendingProfile?.goal || 'Excel in academics',
            language: meta.preferred_language || pendingProfile?.language || 'English',
          };

          await upsertUserProfile(resolvedProfile);
        }

        onAuthSuccess(resolvedProfile);
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errStr = String(err?.message || err || '').toLowerCase();
      if (errStr.includes('failed to fetch') || errStr.includes('networkerror') || errStr.includes('fetch failed')) {
        console.warn('[CULTURE AI] Supabase auth endpoint unreachable. Falling back to local authentication profile.');
        const fakeProfile: UserProfile = {
          id: `local-user-${Date.now()}`,
          email: email,
          name: name || email.split('@')[0] || 'CULTURE Learner',
          role: role,
          educationLevel: educationLevel,
          subjects: pendingProfile?.subjects || ['Physics', 'Calculus'],
          goal: pendingProfile?.goal || 'Excel in academics',
          language: pendingProfile?.language || 'English',
        };
        await upsertUserProfile(fakeProfile);
        onAuthSuccess(fakeProfile);
        onClose();
        return;
      }
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Your password must meet the required minimum length (at least 6 characters).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured) {
      // Offline fallback mode
      setTimeout(() => {
        const newProfile: UserProfile = {
          id: `user-${Date.now()}`,
          email,
          name,
          role,
          educationLevel,
          subjects: pendingProfile?.subjects || ['Physics', 'Calculus'],
          goal: pendingProfile?.goal || 'Excel in academics',
          language: pendingProfile?.language || 'English',
        };
        upsertUserProfile(newProfile);
        onAuthSuccess(newProfile);
        setLoading(false);
        onClose();
      }, 500);
      return;
    }

    try {
      const userSubjects = pendingProfile?.subjects || ['Physics', 'Calculus'];
      const userGoal = pendingProfile?.goal || 'Excel in academics';
      const userLanguage = pendingProfile?.language || 'English';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            education_level: educationLevel,
            subjects: Array.isArray(userSubjects) ? userSubjects.join(', ') : userSubjects,
            grade: educationLevel,
            learning_goal: userGoal,
            preferred_language: userLanguage,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          role,
          educationLevel,
          subjects: userSubjects,
          goal: userGoal,
          language: userLanguage,
        };

        // Always attempt to save the profile
        await upsertUserProfile(newProfile);

        if (data.session) {
          // User session active (email confirmation disabled/auto-confirmed) -> insert into profiles
          onAuthSuccess(newProfile);
          onClose();
        } else {
          // Email confirmation is required by Supabase project settings
          setSuccessMessage(
            'Account created! Please check your email to verify your account before logging in.'
          );
          setMode('login');
        }
      } else {
        setErrorMessage('Failed to create account. Please try again.');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      const errStr = String(err?.message || err || '').toLowerCase();
      if (errStr.includes('failed to fetch') || errStr.includes('networkerror') || errStr.includes('fetch failed')) {
        console.warn('[CULTURE AI] Supabase auth endpoint unreachable. Falling back to local registration.');
        const newProfile: UserProfile = {
          id: `user-${Date.now()}`,
          email,
          name,
          role,
          educationLevel,
          subjects: pendingProfile?.subjects || ['Physics', 'Calculus'],
          goal: pendingProfile?.goal || 'Excel in academics',
          language: pendingProfile?.language || 'English',
        };
        await upsertUserProfile(newProfile);
        onAuthSuccess(newProfile);
        onClose();
        return;
      }
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setSuccessMessage('Password reset instructions sent (simulated mode).');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setSuccessMessage('Password reset link sent to your email address!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-slate-900/90 border border-white/20 p-6 sm:p-8 shadow-2xl shadow-indigo-950/80 glass-card text-white space-y-6"
      >
        {/* Glow ambient decoration */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="space-y-2 text-center relative z-10">
          {mode === 'signup' ? (
            role === 'teacher' ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest shadow-md">
                  <School className="w-3.5 h-3.5 text-amber-400" />
                  <span>TEACHER CO-PILOT WORKSPACE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Create Your Teacher Account
                </h2>
                <p className="text-xs text-amber-200/90 font-medium max-w-sm mx-auto">
                  Access AI tools to generate lesson plans, 20-mark quizzes, rubrics, and track student growth.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-mono font-bold uppercase tracking-widest shadow-md">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                  <span>STUDENT LEARNING WORKSPACE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Create Your Student Account
                </h2>
                <p className="text-xs text-indigo-200/90 font-medium max-w-sm mx-auto">
                  Join CULTURE to get an AI companion tailored to your grade level and build your learning streak.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-mono font-bold uppercase tracking-widest shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CULTURE AUTHENTICATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {mode === 'login' && 'Log in to access your persistent learning profile, streak, & history.'}
                {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
              </p>
            </div>
          )}
        </div>

        {/* Supabase Environment Variables Missing Warning Notice */}
        {!isSupabaseConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs space-y-1 relative z-10">
            <div className="flex items-center gap-2 font-extrabold text-amber-300">
              <Database className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Supabase Cloud Integration Ready</span>
            </div>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">
              Environment variables (<code className="bg-amber-950/80 px-1 rounded font-mono">VITE_SUPABASE_URL</code>) are not set yet.
              You can test authentication now in <strong>Instant Local Mode</strong>, or connect your Supabase keys in <code className="bg-amber-950/80 px-1 rounded font-mono">.env</code>.
            </p>
          </div>
        )}

        {/* Auth Mode Toggle Tabs (Login / Sign Up) */}
        {mode !== 'forgot' && (
          <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-white/10 relative z-10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border border-indigo-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border border-indigo-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2 relative z-10 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 relative z-10">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forms */}
        <div className="relative z-10">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <span>Log In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Role Selection Toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Select Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400'
                        : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                        : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <School className="w-4 h-4 text-amber-400" />
                    <span>Teacher</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'teacher' ? 'Prof. Sarah Davis' : 'Alex Morgan'}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@school.edu"
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              {/* Education Level */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  {role === 'teacher' ? 'Target Grade Level Taught' : 'Education Level'}
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="primary" className="bg-slate-900 text-white">Primary School (K-5)</option>
                  <option value="middle" className="bg-slate-900 text-white">Middle School (6-8)</option>
                  <option value="high_school" className="bg-slate-900 text-white">High School (9-12)</option>
                  <option value="university" className="bg-slate-900 text-white">University Level</option>
                </select>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Role-Styled Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-full text-white font-extrabold uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 ${
                  role === 'teacher'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/30 border border-amber-300/30'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 shadow-indigo-500/30 border border-indigo-300/30'
                }`}
              >
                {loading ? (
                  <span>Creating {role === 'teacher' ? 'Teacher' : 'Student'} Account...</span>
                ) : (
                  <>
                    <span>Create {role === 'teacher' ? 'Teacher' : 'Student'} Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 hover:text-white font-semibold underline cursor-pointer"
                >
                  Back to Log In
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
