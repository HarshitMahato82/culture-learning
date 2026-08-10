import { UserProfile } from '../types';

export const DEMO_PRESETS: { name: string; profile: UserProfile }[] = [
  {
    name: '🎓 High School - Alex (Physics & Calculus)',
    profile: {
      id: 'demo-hs',
      role: 'student',
      educationLevel: 'high_school',
      name: 'Alex',
      subjects: ['Physics', 'Calculus', 'Chemistry'],
      goal: 'Prepare for AP Physics & Calculus exams with high scores',
      language: 'English',
    },
  },
  {
    name: '👨‍🏫 Teacher - Ms. Sarah (8th Grade Science)',
    profile: {
      id: 'demo-teacher',
      role: 'teacher',
      educationLevel: 'middle',
      name: 'Ms. Sarah',
      subjects: ['Integrated Science', 'Biology', 'Earth Science'],
      goal: 'Build engaging lesson plans and differentiated quizzes',
      language: 'English',
    },
  },
  {
    name: '🎈 Primary School - Leo (Ages 8)',
    profile: {
      id: 'demo-primary',
      role: 'student',
      educationLevel: 'primary',
      name: 'Leo',
      subjects: ['Science', 'Math', 'Space'],
      goal: 'Learn fun science facts and stories!',
      language: 'English',
    },
  },
  {
    name: '🔬 University - Maya (Computer Science)',
    profile: {
      id: 'demo-uni',
      role: 'student',
      educationLevel: 'university',
      name: 'Maya',
      subjects: ['Artificial Intelligence', 'Data Structures', 'Linear Algebra'],
      goal: 'Master machine learning theory and paper synthesis',
      language: 'English',
    },
  },
];
