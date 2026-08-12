import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first genuine learning activity.',
    icon: 'Sprout',
    category: 'learning',
    tier: 'bronze',
  },
  {
    id: 'streak_3',
    title: 'Consistency Champion',
    description: 'Maintain a 3-day learning streak.',
    icon: 'Flame',
    category: 'streak',
    tier: 'silver',
  },
  {
    id: 'streak_7',
    title: 'Unstoppable Learner',
    description: 'Maintain a 7-day learning streak.',
    icon: 'Zap',
    category: 'streak',
    tier: 'gold',
  },
  {
    id: 'quiz_whiz',
    title: 'Quiz Master',
    description: 'Score 80% or higher on an interactive quiz.',
    icon: 'Brain',
    category: 'quiz',
    tier: 'silver',
  },
  {
    id: 'study_10',
    title: 'Dedicated Learner',
    description: 'Complete 10 genuine learning activities.',
    icon: 'BookOpen',
    category: 'learning',
    tier: 'silver',
  },
  {
    id: 'path_pioneer',
    title: 'Path Pioneer',
    description: 'Reach 25% overall curriculum progress.',
    icon: 'Map',
    category: 'progress',
    tier: 'gold',
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
};
