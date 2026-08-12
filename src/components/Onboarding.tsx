import React, { useState } from 'react';
import { UserProfile, UserRole, EducationLevel } from '../types';
import { EDUCATION_LEVELS } from '../data/personas';
import { 
  GraduationCap, 
  School, 
  Sparkles, 
  Compass, 
  BookOpen, 
  Library, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Target, 
  Globe, 
  Plus
} from 'lucide-react';

interface OnboardingProps {
  initialRole?: UserRole;
  onCompleteOnboarding: (profile: UserProfile) => void;
  onBackToLanding: () => void;
}

const COMMON_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 
  'Computer Science', 'English Literature', 'World History', 
  'Geography', 'Economics', 'Art & Design'
];

export const Onboarding: React.FC<OnboardingProps> = ({
  initialRole,
  onCompleteOnboarding,
  onBackToLanding,
}) => {
  const [role, setRole] = useState<UserRole>(initialRole || 'student');
  const [step, setStep] = useState<number>(initialRole ? 2 : 1);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('high_school');

  // Form State
  const [name, setName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Physics', 'Mathematics']);
  const [customSubject, setCustomSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState('English');

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      role,
      educationLevel,
      name: name.trim() || (role === 'teacher' ? 'Educator' : 'Student'),
      subjects: selectedSubjects.length > 0 ? selectedSubjects : ['General Studies'],
      goal: goal.trim() || (role === 'teacher' ? 'Enhance classroom learning' : 'Improve understanding'),
      language,
    };
    onCompleteOnboarding(profile);
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-slate-950 text-[#E5E7EB] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background blur elements */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3B82F6] rounded-full blur-[160px] opacity-10 pointer-events-none" />

      <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-[36px] p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Back Button */}
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else onBackToLanding();
          }}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step > 1 ? 'Previous Step' : 'Back to Home'}</span>
        </button>

        {/* Step Indicator Bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-white/10'}`} />
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="text-center animate-in fade-in duration-200">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Who are you?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-lg mx-auto font-medium">
              CULTURE customizes its persona, teaching style, and tools based on whether you are learning or teaching.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-left">
              <div
                onClick={() => {
                  setRole('student');
                  setStep(2);
                }}
                className={`cursor-pointer p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                  role === 'student'
                    ? 'bg-sky-500/10 border-sky-500 shadow-xl shadow-sky-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">🎓 STUDENT</h3>
                <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed font-medium">
                  I want an AI tutor that explains concepts, quizzes me, and adapts to my grade level.
                </p>
              </div>

              <div
                onClick={() => {
                  setRole('teacher');
                  setStep(2); // Goes directly to teacher info step
                }}
                className={`cursor-pointer p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                  role === 'teacher'
                    ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <School className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">👨‍🏫 TEACHER</h3>
                <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed font-medium">
                  I want a teaching co-pilot to generate lesson plans, 20-mark quizzes, rubrics, and activities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: STUDENT LEVEL SELECTION (If student) OR TEACHER LEVEL */}
        {step === 2 && role === 'student' && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-8">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-300 bg-sky-500/15 px-3.5 py-1.5 rounded-full border border-sky-500/30">
                Student Stage Selection
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
                What stage are you studying at?
              </h2>
              <p className="text-base text-slate-300 mt-2">
                This dictates vocabulary, complexity, analogies, and exam orientation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(EDUCATION_LEVELS).map((lvl) => {
                const isSelected = educationLevel === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => {
                      setEducationLevel(lvl.id);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-400/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          {lvl.id === 'primary' && <Sparkles className="w-6 h-6 text-emerald-400" />}
                          {lvl.id === 'middle' && <Compass className="w-6 h-6 text-sky-400" />}
                          {lvl.id === 'high_school' && <BookOpen className="w-6 h-6 text-indigo-400" />}
                          {lvl.id === 'university' && <Library className="w-6 h-6 text-purple-400" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {lvl.title}
                          </h4>
                          <span className="text-sm text-slate-300 font-medium">{lvl.ageRange}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-200 mt-3 leading-relaxed font-medium">
                      {lvl.description}
                    </p>

                    <div className="mt-3 inline-block text-xs font-bold text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded border border-indigo-500/30">
                      {lvl.badge}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(3)}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-base font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 for TEACHER or STEP 3 for STUDENT: ADDITIONAL INFORMATION */}
        {((step === 2 && role === 'teacher') || step === 3) && (
          <form onSubmit={handleFinish} className="animate-in fade-in duration-200 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-3.5 py-1.5 rounded-full border border-indigo-500/30">
                {role === 'teacher' ? 'Teacher Context' : 'Student Context'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                Almost done! Tell CULTURE a little about yourself
              </h2>
              <p className="text-sm text-slate-300 mt-1 font-medium">
                This helps customize welcome greetings, suggested topics, and initial context.
              </p>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span>{role === 'teacher' ? 'Teacher Name / Title' : 'Your Name or Nickname'}</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'teacher' ? 'e.g. Ms. Sarah or Mr. Davis' : 'e.g. Alex'}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-base placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Grade level for Teacher if teacher */}
            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Target Grade Level Taught
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'primary', label: 'Primary (K-5)' },
                    { id: 'middle', label: 'Middle (6-8)' },
                    { id: 'high_school', label: 'High School (9-12)' },
                    { id: 'university', label: 'University' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setEducationLevel(lvl.id as EducationLevel)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                        educationLevel === lvl.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Subjects */}
            <div>
              <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
                {role === 'teacher' ? 'Subject(s) You Teach' : 'Main Subjects You Study'}
              </label>
              <div className="flex flex-wrap gap-2.5 mb-3">
                {COMMON_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/40 border-indigo-400 text-indigo-100 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-indigo-300" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Subject */}
              <div className="flex items-center gap-2.5">
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
                  placeholder="Add another subject..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm sm:text-base text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Optional Goal */}
            <div>
              <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>{role === 'teacher' ? 'Optional Teaching Goal' : 'Optional Learning Goal'}</span>
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={
                  role === 'teacher'
                    ? 'e.g. Build engaging 20-mark quizzes & differentiated lesson plans'
                    : 'e.g. Ace my AP Physics exam and master calculus'
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-base placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Preferred AI Output Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-base outline-none transition-all cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Nepali">Nepali (नेपाली)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Mandarin">Mandarin (中文)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-base font-black shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                <span>Launch CULTURE Workspace</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
