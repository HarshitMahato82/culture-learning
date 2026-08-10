import { EducationLevel, UserRole } from '../types';

export interface LevelMetadata {
  id: EducationLevel;
  title: string;
  ageRange: string;
  badge: string;
  description: string;
  iconName: string;
  accentColor: string;
  gradient: string;
  welcomeHeading: string;
  suggestedPrompts: string[];
  quickActions: { label: string; prompt: string; icon: string }[];
}

export const EDUCATION_LEVELS: Record<EducationLevel, LevelMetadata> = {
  primary: {
    id: 'primary',
    title: 'Primary School',
    ageRange: 'Ages 5–11',
    badge: 'Playful & Visual',
    description: 'Friendly, story-driven explanations with short words, fun analogies, and bright encouragement.',
    iconName: 'Sparkles',
    accentColor: '#10B981', // Emerald
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    welcomeHeading: 'Ready to discover something amazing today? 🎈',
    suggestedPrompts: [
      'Tell me a fun story about how gravity works!',
      'Why is the sky blue during the day?',
      'How do plants turn sunlight into delicious food?',
      'Can you quiz me on basic animal facts?'
    ],
    quickActions: [
      { label: 'Explain with a story 📖', prompt: 'Explain this to me like a fun bedside story with visual examples.', icon: 'BookOpen' },
      { label: 'Mini Quiz 🌟', prompt: 'Give me a super easy 3-question quiz with cheerful hints!', icon: 'Award' },
      { label: 'Fun Analogy 🚀', prompt: 'Give me a cool analogy using LEGOs or toys to explain this.', icon: 'Lightbulb' },
      { label: 'Make it simpler 🎈', prompt: 'Can you explain that using even simpler words and cute emojis?', icon: 'Smile' }
    ]
  },
  middle: {
    id: 'middle',
    title: 'Middle School',
    ageRange: 'Ages 11–14',
    badge: 'Curious & Interactive',
    description: 'Clear explanations using everyday life examples, guided problem solving, and interactive checks.',
    iconName: 'Compass',
    accentColor: '#0EA5E9', // Sky
    gradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
    welcomeHeading: 'Let’s explore how the world really works! 🧭',
    suggestedPrompts: [
      'Explain photosynthesis using a kitchen cooking analogy.',
      'Help me solve 3x + 7 = 22 step-by-step.',
      'Why do the ocean tides go in and out every day?',
      'Give me a quick 4-question check on plant vs animal cells.'
    ],
    quickActions: [
      { label: 'Everyday Example 💡', prompt: 'Explain this concept using a real-world example from daily life or video games.', icon: 'Zap' },
      { label: 'Quiz me 🎯', prompt: 'Give me a 4-question interactive quiz on this topic to test my knowledge.', icon: 'HelpCircle' },
      { label: 'Step-by-step 🪜', prompt: 'Break down how to solve this problem step-by-step.', icon: 'CheckSquare' },
      { label: 'Find my mistake 🔍', prompt: 'I will write my solution steps below. Please help me spot where I made a mistake.', icon: 'Search' }
    ]
  },
  high_school: {
    id: 'high_school',
    title: 'High School',
    ageRange: 'Ages 14–18',
    badge: 'Academic & Exam Focus',
    description: 'Detailed concepts, exam preparation, step-by-step problem breakdown, practice questions, and critical thinking.',
    iconName: 'GraduationCap',
    accentColor: '#6366F1', // Indigo
    gradient: 'from-indigo-500/10 via-violet-500/5 to-transparent',
    welcomeHeading: 'Ready to master concepts and excel in your exams? 🎓',
    suggestedPrompts: [
      'Explain projectile motion and break down the key kinematic formulas.',
      'Help me prepare for my AP Biology exam on Mitosis vs Meiosis.',
      'Find my mistake in this calculus derivative step.',
      'Give me a high-school exam style question on supply and demand.'
    ],
    quickActions: [
      { label: 'Explain a concept 🧠', prompt: 'Explain this concept thoroughly with key formulas, principles, and diagrams.', icon: 'BookOpen' },
      { label: 'Quiz me 📝', prompt: 'Generate a 4-question exam-style multiple-choice quiz on this topic.', icon: 'CheckCircle' },
      { label: 'Exam prep 🏆', prompt: 'Give me top high-school exam tips and common pitfalls for this topic.', icon: 'Award' },
      { label: 'Give me a harder problem ⚡', prompt: 'Give me a challenging practice problem with full step-by-step solution.', icon: 'Target' },
      { label: 'Find my mistake 🕵️‍♂️', prompt: 'I will share my answer below. Please critique my working and identify errors.', icon: 'AlertCircle' },
      { label: 'Explain this simply ⚡', prompt: 'Explain this complex theorem in plain English first, then give the formal proof.', icon: 'Layers' }
    ]
  },
  university: {
    id: 'university',
    title: 'University',
    ageRange: 'Higher Education',
    badge: 'Rigorous & Scholarly',
    description: 'Advanced academic terminology, theoretical depth, literature context, critique, and research synthesis.',
    iconName: 'Library',
    accentColor: '#8B5CF6', // Purple
    gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
    welcomeHeading: 'Welcome to your academic research & synthesis hub. 🔬',
    suggestedPrompts: [
      'Deconstruct quantum entanglement and compare Copenhagen vs Many-Worlds interpretations.',
      'Critique my draft thesis statement on transformer architectures in AI.',
      'Break down multivariable calculus Lagrangian multipliers with proofs.',
      'Synthesize current academic consensus on climate tipping points.'
    ],
    quickActions: [
      { label: 'Deep academic analysis 🔬', prompt: 'Provide a rigorous scholarly analysis including theoretical framework, edge cases, and literature context.', icon: 'Cpu' },
      { label: 'Critique argument ✍️', prompt: 'Critique the logic, evidence, and potential counter-arguments for my position below.', icon: 'FileText' },
      { label: 'Research synthesis 📚', prompt: 'Synthesize the main paradigms, key authors, and open questions surrounding this topic.', icon: 'Share2' },
      { label: 'Generate flashcards 📑', prompt: 'Create 5 high-density recall flashcards for formulas or key definitions.', icon: 'Grid' }
    ]
  }
};

export const TEACHER_CONFIG = {
  role: 'teacher' as UserRole,
  title: 'Teacher AI Co-Pilot',
  badge: 'Pedagogy & Productivity',
  accentColor: '#F59E0B', // Amber
  gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
  welcomeHeading: 'What are we building for your classroom today, Educator? 🍎',
  suggestedPrompts: [
    'Create a 45-minute lesson plan for Grade 8 Science on Energy Conservation.',
    'Generate a 20-mark quiz on World War II with complete answer key and marking guide.',
    'Design a differentiated classroom activity for mixed-ability math students.',
    'How do I explain Photosynthesis to Grade 6 students so they instantly get it?'
  ],
  quickActions: [
    { label: 'Create a lesson plan 📐', prompt: 'Build a detailed 45-minute lesson plan including learning objectives, starter, main activity, differentiation, and exit ticket.', icon: 'Calendar' },
    { label: 'Generate a 20-mark quiz ✍️', prompt: 'Create a balanced 20-mark assessment with multiple choice, short answer, answer key, and mark allocation.', icon: 'CheckSquare' },
    { label: 'Create classroom activity 🎲', prompt: 'Design an interactive, group-based 20-minute classroom activity that boosts student engagement.', icon: 'Users' },
    { label: 'Explain for Grade level 🎯', prompt: 'Explain this complex concept in a clear, highly teachable way tailored for students.', icon: 'Sparkles' },
    { label: 'Differentiated questions 📊', prompt: 'Generate 3 tiered sets of practice questions (Support, Core, Extension) for diverse learners.', icon: 'Sliders' },
    { label: 'Build assessment rubric 📋', prompt: 'Create a 4-tier rubrics grid (Beginner, Developing, Proficient, Advanced) with clear descriptors.', icon: 'Table' },
    { label: 'Misconception analysis 🧠', prompt: 'What are the top 5 common misconceptions students have about this topic and how can I address them?', icon: 'HelpCircle' }
  ]
};
