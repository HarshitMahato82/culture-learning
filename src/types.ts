export type UserRole = 'student' | 'teacher';

export type EducationLevel = 'primary' | 'middle' | 'high_school' | 'university';

export interface UserProfile {
  id: string;
  email?: string;
  role: UserRole;
  educationLevel: EducationLevel;
  name: string;
  subjects: string[];
  goal?: string;
  language?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // YYYY-MM-DD
}

export interface TopicProgress {
  subject: string;
  topic: string;
  progressPercent: number; // 0 - 100
  completedUnits: number;
  totalUnits: number;
}

export type LearningActivityType = 
  | 'quiz_completed' 
  | 'lesson_completed' 
  | 'practice_completed' 
  | 'ai_learning_session' 
  | 'question_answered';

export interface LearningActivityRecord {
  id?: string;
  userId: string;
  activityType: LearningActivityType;
  subject?: string;
  topic?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface WeakTopic {
  subject: string;
  topic: string;
  incorrectCount: number;
  recentIncorrectCount?: number;
  lastMistakeAt?: string;
  recencyScore?: number;
}

export interface DashboardCalculatedStats {
  overallProgressPercent: number;
  masteredUnits: number;
  totalUnits: number;
  currentStreak: number;
  longestStreak: number;
  totalSessionsCount: number;
  totalActivitiesCount: number;
  savedHoursPerWeek: number;
  topicProgressList: TopicProgress[];
  weakTopics: WeakTopic[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  subject?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  level: string;
  questions: QuizQuestion[];
}

export interface LessonPlanData {
  topic: string;
  gradeLevel: string;
  duration: string;
  objectives: string[];
  starter: string;
  mainActivities: string[];
  differentiation: {
    support: string;
    extension: string;
  };
  assessment: string;
  homework: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface LevelAdaptation {
  topic: string;
  adaptations: {
    primary: string;
    middle: string;
    high_school: string;
    university: string;
  };
}

export type AchievementCategory = 'learning' | 'streak' | 'quiz' | 'progress';
export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

