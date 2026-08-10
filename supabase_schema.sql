-- CULTURE Education Platform Supabase Schema (User-Isolated Multi-Tenant Security)

-- Enable Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT,
  education_level TEXT,
  subjects TEXT,
  grade TEXT,
  learning_goal TEXT,
  preferred_language TEXT DEFAULT 'English',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles SELECT policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles INSERT policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles UPDATE policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles DELETE policy" ON public.profiles;

CREATE POLICY "Profiles SELECT policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles INSERT policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles UPDATE policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles DELETE policy" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 2. AUTOMATIC PROFILE CREATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    education_level,
    subjects,
    grade,
    learning_goal,
    preferred_language
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'CULTURE Learner'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'education_level', 'high_school'),
    COALESCE(NEW.raw_user_meta_data->>'subjects', 'Physics, Mathematics'),
    COALESCE(NEW.raw_user_meta_data->>'grade', ''),
    COALESCE(NEW.raw_user_meta_data->>'learning_goal', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'English')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    education_level = EXCLUDED.education_level,
    subjects = EXCLUDED.subjects,
    grade = EXCLUDED.grade,
    learning_goal = EXCLUDED.learning_goal,
    preferred_language = EXCLUDED.preferred_language,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profile records
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  education_level,
  subjects,
  grade,
  learning_goal,
  preferred_language
)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', 'CULTURE Learner'),
  email,
  COALESCE(raw_user_meta_data->>'role', 'student'),
  COALESCE(raw_user_meta_data->>'education_level', 'high_school'),
  COALESCE(raw_user_meta_data->>'subjects', 'Physics, Mathematics'),
  COALESCE(raw_user_meta_data->>'grade', ''),
  COALESCE(raw_user_meta_data->>'learning_goal', ''),
  COALESCE(raw_user_meta_data->>'preferred_language', 'English')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. LEARNING_PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  topic TEXT,
  progress_percent INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  completed_units INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 4,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_subject_topic UNIQUE (user_id, subject, topic)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learning progress SELECT policy" ON public.learning_progress;
DROP POLICY IF EXISTS "Learning progress INSERT policy" ON public.learning_progress;
DROP POLICY IF EXISTS "Learning progress UPDATE policy" ON public.learning_progress;
DROP POLICY IF EXISTS "Learning progress DELETE policy" ON public.learning_progress;

CREATE POLICY "Learning progress SELECT policy" ON public.learning_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Learning progress INSERT policy" ON public.learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning progress UPDATE policy" ON public.learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Learning progress DELETE policy" ON public.learning_progress
  FOR DELETE USING (auth.uid() = user_id);

-- 4. LEARNING_ACTIVITY TABLE
CREATE TABLE IF NOT EXISTS public.learning_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT,
  subject TEXT,
  topic TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learning activity SELECT policy" ON public.learning_activity;
DROP POLICY IF EXISTS "Learning activity INSERT policy" ON public.learning_activity;
DROP POLICY IF EXISTS "Learning activity UPDATE policy" ON public.learning_activity;
DROP POLICY IF EXISTS "Learning activity DELETE policy" ON public.learning_activity;

CREATE POLICY "Learning activity SELECT policy" ON public.learning_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Learning activity INSERT policy" ON public.learning_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning activity UPDATE policy" ON public.learning_activity
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Learning activity DELETE policy" ON public.learning_activity
  FOR DELETE USING (auth.uid() = user_id);

-- 5. STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Streaks SELECT policy" ON public.streaks;
DROP POLICY IF EXISTS "Streaks INSERT policy" ON public.streaks;
DROP POLICY IF EXISTS "Streaks UPDATE policy" ON public.streaks;
DROP POLICY IF EXISTS "Streaks DELETE policy" ON public.streaks;

CREATE POLICY "Streaks SELECT policy" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Streaks INSERT policy" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Streaks UPDATE policy" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Streaks DELETE policy" ON public.streaks
  FOR DELETE USING (auth.uid() = user_id);

-- 6. CHAT_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  subject TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat sessions SELECT policy" ON public.chat_sessions;
DROP POLICY IF EXISTS "Chat sessions INSERT policy" ON public.chat_sessions;
DROP POLICY IF EXISTS "Chat sessions UPDATE policy" ON public.chat_sessions;
DROP POLICY IF EXISTS "Chat sessions DELETE policy" ON public.chat_sessions;

CREATE POLICY "Chat sessions SELECT policy" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Chat sessions INSERT policy" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Chat sessions UPDATE policy" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Chat sessions DELETE policy" ON public.chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 7. CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  text TEXT,
  content TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat messages SELECT policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages INSERT policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages UPDATE policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages DELETE policy" ON public.chat_messages;

CREATE POLICY "Chat messages SELECT policy" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Chat messages INSERT policy" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Chat messages UPDATE policy" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Chat messages DELETE policy" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);


