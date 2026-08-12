import { supabase, isSupabaseConfigured } from './supabase';
import { 
  UserProfile, 
  UserRole,
  EducationLevel,
  StreakData, 
  TopicProgress, 
  LearningActivityType, 
  LearningActivityRecord, 
  DashboardCalculatedStats,
  WeakTopic,
  Conversation,
  ChatMessage
} from '../types';

const STORAGE_KEY_OFFLINE_PROFILE = 'culture_ai_supabase_offline_profile';
const STORAGE_KEY_OFFLINE_STREAK = 'culture_ai_supabase_offline_streak';
const STORAGE_KEY_OFFLINE_ACTIVITIES = 'culture_ai_supabase_offline_activities';
const STORAGE_KEY_OFFLINE_PROGRESS = 'culture_ai_supabase_offline_progress';

// Helper for local date string YYYY-MM-DD
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// USER PROFILE SERVICE
// -------------------------------------------------------------
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  if (!isSupabaseConfigured) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_PROFILE}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading offline profile:', e);
    }
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Unable to fetch profile from Supabase:', error.message);
    }

    if (data) {
      const rawSubjects = data.subjects;
      const parsedSubjects = typeof rawSubjects === 'string'
        ? rawSubjects.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(rawSubjects) ? rawSubjects : ['Physics', 'Mathematics']);

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role || 'student',
        educationLevel: data.education_level || 'high_school',
        subjects: parsedSubjects.length > 0 ? parsedSubjects : ['Physics', 'Mathematics'],
        goal: data.learning_goal,
        language: data.preferred_language || 'English',
      };
    }

    // Fallback: If profile row is missing, retrieve metadata from Supabase Auth
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && authData.user.id === userId) {
        const meta = authData.user.user_metadata || {};
        const rawSubjs = meta.subjects;
        const parsedSubjs = typeof rawSubjs === 'string'
          ? rawSubjs.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(rawSubjs) ? rawSubjs : ['Physics', 'Mathematics']);

        const fallbackProfile: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: meta.name || authData.user.email?.split('@')[0] || 'CULTURE Learner',
          role: (meta.role as UserRole) || 'student',
          educationLevel: (meta.education_level as EducationLevel) || 'high_school',
          subjects: parsedSubjs.length > 0 ? parsedSubjs : ['Physics', 'Mathematics'],
          goal: meta.learning_goal || 'Excel in academics',
          language: meta.preferred_language || 'English',
        };

        await upsertUserProfile(fallbackProfile);
        return fallbackProfile;
      }
    } catch (authErr) {
      console.warn('Supabase auth.getUser fallback failed:', authErr);
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_PROFILE}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return null;
  } catch (err) {
    console.warn('Unable to fetch profile from Supabase (offline/network):', err);
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_PROFILE}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<boolean> {
  if (!profile?.id) return false;

  try {
    localStorage.setItem(`${STORAGE_KEY_OFFLINE_PROFILE}_${profile.id}`, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving offline profile to localStorage:', e);
  }

  if (!isSupabaseConfigured) return true;

  try {
    const subjectsStr = Array.isArray(profile.subjects)
      ? profile.subjects.join(', ')
      : (profile.subjects || 'Physics, Mathematics');

    const payload = {
      id: profile.id,
      name: profile.name,
      email: profile.email || '',
      role: profile.role,
      education_level: profile.educationLevel,
      subjects: subjectsStr,
      grade: profile.educationLevel || '',
      learning_goal: profile.goal || '',
      preferred_language: profile.language || 'English',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Unable to upsert user profile to Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Error in upsertUserProfile (offline/network):', err);
    return false;
  }
}

// -------------------------------------------------------------
// STREAK SERVICE
// -------------------------------------------------------------
export async function fetchUserStreak(userId: string): Promise<StreakData> {
  const defaultStreak: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
  };

  if (!userId) return defaultStreak;

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (!isSupabaseConfigured) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_STREAK}_${userId}`);
      if (raw) {
        const stored: StreakData = JSON.parse(raw);
        if (stored.lastActivityDate && stored.lastActivityDate !== today && stored.lastActivityDate !== yesterday) {
          stored.currentStreak = 0;
        }
        return stored;
      }
    } catch (e) {
      console.warn('Error reading offline streak:', e);
    }
    return defaultStreak;
  }

  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Unable to fetch streak from Supabase:', error.message);
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_STREAK}_${userId}`);
        if (raw) {
          const stored: StreakData = JSON.parse(raw);
          if (stored.lastActivityDate && stored.lastActivityDate !== today && stored.lastActivityDate !== yesterday) {
            stored.currentStreak = 0;
          }
          return stored;
        }
      } catch (e) {}
      return defaultStreak;
    }

    if (!data) {
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_STREAK}_${userId}`);
        if (raw) {
          const stored: StreakData = JSON.parse(raw);
          if (stored.lastActivityDate && stored.lastActivityDate !== today && stored.lastActivityDate !== yesterday) {
            stored.currentStreak = 0;
          }
          return stored;
        }
      } catch (e) {}
      return defaultStreak;
    }

    let activeCurrentStreak = data.current_streak || 0;
    // Streak resets to 0 if last activity was prior to yesterday
    if (data.last_activity_date && data.last_activity_date !== today && data.last_activity_date !== yesterday) {
      activeCurrentStreak = 0;
    }

    return {
      currentStreak: activeCurrentStreak,
      longestStreak: data.longest_streak || 0,
      lastActivityDate: data.last_activity_date || null,
    };
  } catch (err) {
    console.warn('Unable to fetch streak from Supabase (offline/network):', err);
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_STREAK}_${userId}`);
      if (raw) {
        const stored: StreakData = JSON.parse(raw);
        if (stored.lastActivityDate && stored.lastActivityDate !== today && stored.lastActivityDate !== yesterday) {
          stored.currentStreak = 0;
        }
        return stored;
      }
    } catch (e) {}
    return defaultStreak;
  }
}

// -------------------------------------------------------------
// RECORD ACTIVITY & UPDATE STREAK & PROGRESS
// -------------------------------------------------------------
export async function recordLearningActivity(
  userId: string,
  activityType: LearningActivityType,
  subject: string,
  topic: string,
  metadata: Record<string, any> = {}
): Promise<{ updatedStreak: StreakData; newProgressPercent: number }> {
  if (!userId) {
    return {
      updatedStreak: { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
      newProgressPercent: 0,
    };
  }

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // 1. Fetch current streak
  const currentStreakData = await fetchUserStreak(userId);

  let newCurrentStreak = currentStreakData.currentStreak;
  let newLongestStreak = currentStreakData.longestStreak;

  if (currentStreakData.lastActivityDate === today) {
    // Already did an activity today -> keep current streak count
    if (newCurrentStreak === 0) newCurrentStreak = 1;
  } else if (currentStreakData.lastActivityDate === yesterday) {
    // Consecutive day activity -> increment streak by 1
    newCurrentStreak = newCurrentStreak + 1;
  } else {
    // Missed a day or first ever activity -> start/reset to 1
    newCurrentStreak = 1;
  }

  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }

  const updatedStreakData: StreakData = {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: today,
  };

  let calculatedProgress = 15;

  // 2. Persist activity & streak in Supabase (or LocalStorage fallback)
  if (isSupabaseConfigured) {
    try {
      // Record user activity
      await supabase.from('learning_activity').insert({
        user_id: userId,
        activity_type: activityType,
        subject: subject || 'General',
        topic: topic || 'General Study',
        metadata: metadata,
        created_at: new Date().toISOString(),
      });

      // Upsert streak
      await supabase.from('streaks').upsert(
        {
          user_id: userId,
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      // Fetch existing topic progress
      const { data: existingProgress } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subject', subject)
        .eq('topic', topic)
        .maybeSingle();

      const currentProgress = existingProgress?.progress_percent || existingProgress?.progress_percentage || 0;
      const boostMap: Record<LearningActivityType, number> = {
        quiz_completed: 25,
        lesson_completed: 25,
        practice_completed: 20,
        ai_learning_session: 15,
        question_answered: 10,
      };
      const boost = boostMap[activityType] || 15;
      calculatedProgress = Math.min(100, currentProgress + boost);
      const totalUnits = existingProgress?.total_units || 4;
      const completedUnits = Math.min(totalUnits, Math.floor((calculatedProgress / 100) * totalUnits));

      await supabase.from('learning_progress').upsert(
        {
          user_id: userId,
          subject: subject,
          topic: topic,
          progress_percent: calculatedProgress,
          progress_percentage: calculatedProgress,
          completed_units: completedUnits,
          total_units: totalUnits,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,subject,topic' }
      );
    } catch (err) {
      console.error('Failed to save activity to Supabase:', err);
    }
  } else {
    // LocalStorage fallback scoped to userId
    try {
      localStorage.setItem(`${STORAGE_KEY_OFFLINE_STREAK}_${userId}`, JSON.stringify(updatedStreakData));

      const rawActs = localStorage.getItem(`${STORAGE_KEY_OFFLINE_ACTIVITIES}_${userId}`);
      const acts = rawActs ? JSON.parse(rawActs) : [];
      acts.push({
        userId,
        activityType,
        subject,
        topic,
        metadata,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(`${STORAGE_KEY_OFFLINE_ACTIVITIES}_${userId}`, JSON.stringify(acts));
    } catch (e) {
      console.error(e);
    }
  }

  return {
    updatedStreak: updatedStreakData,
    newProgressPercent: calculatedProgress,
  };
}

// Helper to extract weak topics from activity records where activity_type === 'question_answered' and isCorrect === false
function extractWeakTopics(activities: any[]): WeakTopic[] {
  if (!activities || !Array.isArray(activities)) return [];

  const now = Date.now();
  const map: Record<
    string,
    {
      subject: string;
      topic: string;
      incorrectCount: number;
      recentIncorrectCount: number;
      latestTimestamp: number;
      lastMistakeAt?: string;
      recencyScore: number;
    }
  > = {};

  for (const act of activities) {
    if (!act) continue;
    try {
      const type = act.activity_type || act.activityType;
      if (type === 'question_answered') {
        let meta = act.metadata;
        if (typeof meta === 'string') {
          try {
            meta = JSON.parse(meta);
          } catch {
            meta = {};
          }
        }
        if (meta && typeof meta === 'object' && meta.isCorrect === false) {
          const rawSub = (act.subject || 'General').toString().trim();
          const rawTop = (act.topic || 'General Study').toString().trim();
          if (rawSub && rawTop) {
            // Determine timestamp of activity
            const tsRaw = act.created_at || act.createdAt || act.timestamp;
            let actTime = now;
            if (tsRaw) {
              const parsed = new Date(tsRaw).getTime();
              if (!isNaN(parsed)) {
                actTime = parsed;
              }
            }

            const ageMs = Math.max(0, now - actTime);
            const ageDays = ageMs / (1000 * 60 * 60 * 24);

            // Recency weighting: 7-day half-life decay formula
            const weight = Math.pow(0.5, ageDays / 7);

            const key = `${rawSub.toLowerCase()}:::${rawTop.toLowerCase()}`;
            if (!map[key]) {
              map[key] = {
                subject: rawSub,
                topic: rawTop,
                incorrectCount: 0,
                recentIncorrectCount: 0,
                latestTimestamp: 0,
                lastMistakeAt: undefined,
                recencyScore: 0,
              };
            }

            map[key].incorrectCount += 1;
            if (ageDays <= 14) {
              map[key].recentIncorrectCount += 1;
            }
            map[key].recencyScore += weight;

            if (actTime > map[key].latestTimestamp) {
              map[key].latestTimestamp = actTime;
              map[key].lastMistakeAt = new Date(actTime).toISOString();
            }
          }
        }
      }
    } catch {
      // Safely ignore malformed activity rows
    }
  }

  return Object.values(map)
    .map((item) => ({
      subject: item.subject,
      topic: item.topic,
      incorrectCount: item.incorrectCount,
      recentIncorrectCount: item.recentIncorrectCount,
      lastMistakeAt: item.lastMistakeAt,
      recencyScore: Math.round(item.recencyScore * 100) / 100,
    }))
    .sort((a, b) => {
      const scoreA = a.recencyScore ?? a.incorrectCount;
      const scoreB = b.recencyScore ?? b.incorrectCount;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const recentA = a.recentIncorrectCount ?? a.incorrectCount;
      const recentB = b.recentIncorrectCount ?? b.incorrectCount;
      if (recentB !== recentA) {
        return recentB - recentA;
      }
      return b.incorrectCount - a.incorrectCount;
    });
}

// -------------------------------------------------------------
// CALCULATED DASHBOARD STATS (STRICTLY USER-SCOPED)
// -------------------------------------------------------------
export async function fetchCalculatedDashboardStats(
  userId: string,
  userSubjects: string[] = ['Physics', 'Mathematics']
): Promise<DashboardCalculatedStats> {
  const fallbackStats: DashboardCalculatedStats = {
    overallProgressPercent: 0,
    masteredUnits: 0,
    totalUnits: (userSubjects?.length || 1) * 4,
    currentStreak: 0,
    longestStreak: 0,
    totalSessionsCount: 0,
    totalActivitiesCount: 0,
    savedHoursPerWeek: 0,
    topicProgressList: [],
    weakTopics: [],
  };

  if (!userId) return fallbackStats;

  const streak = await fetchUserStreak(userId);
  fallbackStats.currentStreak = streak.currentStreak;
  fallbackStats.longestStreak = streak.longestStreak;

  if (isSupabaseConfigured) {
    try {
      // 1. Fetch user activities
      const { data: activities } = await supabase
        .from('learning_activity')
        .select('*')
        .eq('user_id', userId);

      const totalActivitiesCount = activities?.length || 0;
      fallbackStats.totalActivitiesCount = totalActivitiesCount;

      // Extract weak topics from quiz question records
      fallbackStats.weakTopics = extractWeakTopics(activities || []);

      // 2. Fetch user chat sessions
      const { data: chatSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId);

      fallbackStats.totalSessionsCount = chatSessions?.length || 0;

      // 3. Fetch user topic progress
      const { data: topicProgresses } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId);

      let totalProgressSum = 0;
      let totalMasteredUnits = 0;
      const topicList: TopicProgress[] = [];

      if (topicProgresses && topicProgresses.length > 0) {
        topicProgresses.forEach((tp) => {
          const progVal = tp.progress_percent || tp.progress_percentage || 0;
          totalProgressSum += progVal;
          if (progVal >= 80) {
            totalMasteredUnits += 1;
          }
          topicList.push({
            subject: tp.subject,
            topic: tp.topic,
            progressPercent: progVal,
            completedUnits: tp.completed_units || 0,
            totalUnits: tp.total_units || 4,
          });
        });

        const overallPercent = Math.min(100, Math.round(totalProgressSum / topicProgresses.length));
        fallbackStats.overallProgressPercent = overallPercent;
        fallbackStats.masteredUnits = totalMasteredUnits;
        fallbackStats.topicProgressList = topicList;
      } else if (totalActivitiesCount > 0) {
        const calculatedOverall = Math.min(100, Math.round(totalActivitiesCount * 15));
        fallbackStats.overallProgressPercent = calculatedOverall;
        fallbackStats.masteredUnits = Math.min(fallbackStats.totalUnits, Math.floor(totalActivitiesCount / 2));
      } else {
        fallbackStats.overallProgressPercent = 0;
        fallbackStats.masteredUnits = 0;
      }

      fallbackStats.savedHoursPerWeek = parseFloat(((totalActivitiesCount * 0.4) + (fallbackStats.totalSessionsCount * 0.25)).toFixed(1));

      return fallbackStats;
    } catch (err) {
      console.error('Error calculating dashboard stats from Supabase:', err);
      return fallbackStats;
    }
  } else {
    // Offline local storage calculation
    try {
      const rawActs = localStorage.getItem(`${STORAGE_KEY_OFFLINE_ACTIVITIES}_${userId}`);
      const acts: any[] = rawActs ? JSON.parse(rawActs) : [];
      const actCount = acts.length;

      const rawChats = localStorage.getItem(`culture_ai_conversations_${userId}`);
      const chats: any[] = rawChats ? JSON.parse(rawChats) : [];

      fallbackStats.totalActivitiesCount = actCount;
      fallbackStats.totalSessionsCount = chats.length;

      // Extract weak topics from offline activities
      fallbackStats.weakTopics = extractWeakTopics(acts);

      if (actCount === 0) {
        fallbackStats.overallProgressPercent = 0;
        fallbackStats.masteredUnits = 0;
      } else {
        fallbackStats.overallProgressPercent = Math.min(100, Math.round(actCount * 15));
        fallbackStats.masteredUnits = Math.min(fallbackStats.totalUnits, Math.floor(actCount / 2));
      }

      fallbackStats.savedHoursPerWeek = parseFloat(((actCount * 0.4) + (chats.length * 0.25)).toFixed(1));

      return fallbackStats;
    } catch (e) {
      console.error(e);
      return fallbackStats;
    }
  }
}

// Helper to validate or generate UUIDs for database operations
function ensureUUID(id?: string): string {
  if (!id) return generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  return generateUUID();
}

// -------------------------------------------------------------
// USER-ISOLATED CHAT MEMORY SERVICE
// -------------------------------------------------------------
function getOfflineConversations(userId: string): Conversation[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`culture_ai_conversations_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading offline conversations:', e);
  }
  return [];
}

export async function migrateLocalConversationsToSupabase(userId: string): Promise<void> {
  if (!userId || !isSupabaseConfigured) return;

  const markerKey = `culture_ai_chat_migration_v1_${userId}`;

  try {
    if (typeof window !== 'undefined' && localStorage.getItem(markerKey)) {
      return;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('Supabase session retrieval error in migrateLocalConversationsToSupabase:', sessionError.message);
      return;
    }

    if (!session || !session.user) {
      console.warn('Migration skipped: no active Supabase authentication session.');
      return;
    }

    if (session.user.id !== userId) {
      console.warn('Migration skipped: requested userId does not match authenticated session user id.');
      return;
    }

    const localConvs = getOfflineConversations(userId);
    if (!localConvs || localConvs.length === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(markerKey, 'completed');
      }
      return;
    }

    let allSucceeded = true;

    for (const conv of localConvs) {
      try {
        if (!conv || !conv.id || !Array.isArray(conv.messages) || conv.messages.length === 0) {
          continue;
        }
        const success = await saveConversationSession(userId, conv);
        if (!success) {
          allSucceeded = false;
        }
      } catch (err) {
        console.error('Error migrating individual conversation session:', err);
        allSucceeded = false;
      }
    }

    if (allSucceeded && typeof window !== 'undefined') {
      localStorage.setItem(markerKey, 'completed');
    }
  } catch (err) {
    console.error('Error in migrateLocalConversationsToSupabase:', err);
  }
}

export async function fetchUserConversations(userId: string): Promise<Conversation[]> {
  if (!userId) return [];

  const localConvs = getOfflineConversations(userId);

  if (!isSupabaseConfigured) {
    return localConvs;
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('Supabase session retrieval error in fetchUserConversations:', sessionError.message);
      return localConvs;
    }

    if (!session || !session.user) {
      return localConvs;
    }

    const activeUserId = session.user.id;

    // Run one-time migration of localStorage conversations for active authenticated user if needed
    await migrateLocalConversationsToSupabase(activeUserId);

    const activeLocalConvs = activeUserId !== userId ? getOfflineConversations(activeUserId) : localConvs;
    const offlineList = activeLocalConvs.length > 0 ? activeLocalConvs : localConvs;

    // 1. Fetch chat sessions for active user
    const { data: sessions, error: sessErr } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', activeUserId)
      .order('updated_at', { ascending: false });

    if (sessErr || !sessions || sessions.length === 0) {
      if (sessErr) {
        console.warn('Supabase fetch chat_sessions failed:', sessErr.message);
      }
      return offlineList;
    }

    const sessionIds = sessions.map((s) => s.id);

    // 2. Fetch chat messages for active user & sessions
    const { data: messages, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', activeUserId)
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (msgErr) {
      console.warn('Supabase fetch chat_messages failed:', msgErr.message);
    }

    const remoteConvList: Conversation[] = sessions.map((s) => {
      const sessMsgs = (messages || [])
        .filter((m) => m.session_id === s.id)
        .map((m) => ({
          id: ensureUUID(m.id),
          role: (m.role || 'user') as 'user' | 'assistant',
          text: m.text || m.content || '',
          timestamp: Number(m.timestamp) || (m.created_at ? new Date(m.created_at).getTime() : Date.now()),
        }));

      return {
        id: ensureUUID(s.id),
        title: s.title || 'AI Session',
        subject: s.subject || 'General',
        updatedAt: s.updated_at ? new Date(s.updated_at).getTime() : Date.now(),
        messages: sessMsgs,
      };
    });

    // Merge remote and local conversations
    const convMap = new Map<string, Conversation>();
    offlineList.forEach((c) => convMap.set(c.id, c));
    remoteConvList.forEach((r) => {
      const existing = convMap.get(r.id);
      if (!existing || (r.messages && r.messages.length >= (existing.messages?.length || 0))) {
        convMap.set(r.id, r);
      }
    });

    const finalConvs = Array.from(convMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const nonEmptyConvs = finalConvs.filter((c) => c.messages && c.messages.length > 0);
    const emptyConvs = finalConvs.filter((c) => !c.messages || c.messages.length === 0);

    if (emptyConvs.length > 0 && activeUserId) {
      emptyConvs.forEach((empty) => {
        deleteConversationSession(activeUserId, empty.id);
      });
    }

    try {
      localStorage.setItem(`culture_ai_conversations_${activeUserId}`, JSON.stringify(nonEmptyConvs));
    } catch (e) {}

    return nonEmptyConvs;
  } catch (err) {
    console.warn('Unable to fetch conversations from Supabase (offline/network):', err);
    return localConvs.filter((c) => c.messages && c.messages.length > 0);
  }
}

export async function purgeEmptyConversations(
  userId: string | undefined,
  convs: Conversation[],
  exceptId?: string | null
): Promise<Conversation[]> {
  if (!convs || convs.length === 0) return [];
  const emptyConvs = convs.filter((c) => (!c.messages || c.messages.length === 0) && c.id !== exceptId);
  if (emptyConvs.length === 0) return convs;

  const remaining = convs.filter((c) => (c.messages && c.messages.length > 0) || c.id === exceptId);

  if (userId) {
    for (const empty of emptyConvs) {
      await deleteConversationSession(userId, empty.id);
    }
  }

  return remaining;
}

export async function saveConversationSession(userId: string, conv: Conversation): Promise<boolean> {
  if (!userId || !conv?.id) return false;

  // Do not save empty conversations with zero messages to persistent storage
  if (!conv.messages || conv.messages.length === 0) return true;

  const validSessionId = ensureUUID(conv.id);
  conv.id = validSessionId;

  // Local storage backup scoped strictly to user
  try {
    const existingRaw = localStorage.getItem(`culture_ai_conversations_${userId}`);
    const existing: Conversation[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [conv, ...existing.filter((c) => c.id !== validSessionId)];
    localStorage.setItem(`culture_ai_conversations_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error backing up conversation to localStorage:', e);
  }

  if (!isSupabaseConfigured) return false;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('Supabase session retrieval error in saveConversationSession:', sessionError.message);
      return false;
    }

    if (!session || !session.user) {
      console.warn('Chat persistence skipped: no active Supabase authentication session.');
      return false;
    }

    const effectiveUserId = session.user.id;

    // 1. Upsert session row into chat_sessions
    const { error: sessErr } = await supabase
      .from('chat_sessions')
      .upsert({
        id: validSessionId,
        user_id: effectiveUserId,
        title: conv.title || 'AI Session',
        subject: conv.subject || 'General',
        updated_at: new Date(conv.updatedAt || Date.now()).toISOString(),
      }, { onConflict: 'id' });

    if (sessErr) {
      console.error('Supabase chat_sessions upsert error:', sessErr);
      return false;
    }

    // 2. Upsert message rows into chat_messages
    if (conv.messages && conv.messages.length > 0) {
      const msgPayloads = conv.messages.map((m) => {
        const msgId = ensureUUID(m.id);
        m.id = msgId;
        return {
          id: msgId,
          session_id: validSessionId,
          user_id: effectiveUserId,
          role: m.role,
          text: m.text,
          content: m.text,
          timestamp: m.timestamp || Date.now(),
        };
      });

      const { error: msgErr } = await supabase
        .from('chat_messages')
        .upsert(msgPayloads, { onConflict: 'id' });

      if (msgErr) {
        console.error('Supabase chat_messages upsert error:', msgErr);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Error saving conversation session to Supabase:', err);
    return false;
  }
}

export async function deleteConversationSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;

  // Remove from user-scoped localStorage
  try {
    const existingRaw = localStorage.getItem(`culture_ai_conversations_${userId}`);
    if (existingRaw) {
      const existing: Conversation[] = JSON.parse(existingRaw);
      const filtered = existing.filter((c) => c.id !== sessionId);
      localStorage.setItem(`culture_ai_conversations_${userId}`, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Error deleting offline conversation from localStorage:', e);
  }

  if (!isSupabaseConfigured) return;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      console.warn('Delete conversation skipped: no active Supabase authentication session.');
      return;
    }

    const effectiveUserId = session.user.id;

    // Delete chat messages first to avoid Foreign Key constraint error on chat_sessions
    const { error: msgErr } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', effectiveUserId);

    if (msgErr) {
      console.error('Supabase delete chat_messages error:', msgErr);
    }

    const { error: delErr } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', effectiveUserId);

    if (delErr) {
      console.error('Supabase delete chat_sessions error:', delErr);
    }
  } catch (err) {
    console.error('Error deleting conversation session from Supabase:', err);
  }
}

export async function deleteAllUserConversations(userId: string): Promise<void> {
  if (!userId) return;

  try {
    localStorage.removeItem(`culture_ai_conversations_${userId}`);
  } catch (e) {
    console.warn('Error deleting offline conversations from localStorage:', e);
  }

  if (!isSupabaseConfigured) return;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      console.warn('Delete all conversations skipped: no active Supabase authentication session.');
      return;
    }

    const effectiveUserId = session.user.id;

    const { error: msgErr } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', effectiveUserId);

    if (msgErr) {
      console.error('Supabase delete all chat_messages error:', msgErr);
    }

    const { error: sessErr } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', effectiveUserId);

    if (sessErr) {
      console.error('Supabase delete all chat_sessions error:', sessErr);
    }
  } catch (err) {
    console.error('Error deleting all user conversations from Supabase:', err);
  }
}

