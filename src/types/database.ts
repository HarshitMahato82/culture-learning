export interface DbProfile {
  id: string; // auth.users id
  user_id?: string;
  name: string;
  email?: string;
  role: 'student' | 'teacher';
  education_level: 'primary' | 'middle' | 'high_school' | 'university';
  subjects: string[];
  grade?: string;
  learning_goal?: string;
  preferred_language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbLearningProgress {
  id?: string;
  user_id: string;
  subject: string;
  topic: string;
  progress_percent: number;
  completed_units: number;
  total_units: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbLearningActivity {
  id?: string;
  user_id: string;
  activity_type: string;
  subject?: string;
  topic?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface DbStreak {
  id?: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at?: string;
}

export interface DbChatSession {
  id: string;
  user_id: string;
  title: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  created_at?: string;
}
