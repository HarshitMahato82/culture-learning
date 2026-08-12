import { supabase, isSupabaseConfigured } from './supabase';
import { UserAchievement } from '../types';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievements';

const STORAGE_KEY_OFFLINE_ACHIEVEMENTS = 'culture_ai_supabase_offline_achievements';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fetch all unlocked achievements for a given user.
 */
export async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  if (!userId) return [];

  if (!isSupabaseConfigured) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_ACHIEVEMENTS}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[CULTURE AI AchievementService] Error reading offline achievements:', e);
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id, user_id, achievement_id, unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: true });

    if (error) {
      console.error('[CULTURE AI AchievementService] Error fetching user achievements:', error);
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY_OFFLINE_ACHIEVEMENTS}_${userId}`);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    const achievements = (data || []) as UserAchievement[];
    try {
      localStorage.setItem(`${STORAGE_KEY_OFFLINE_ACHIEVEMENTS}_${userId}`, JSON.stringify(achievements));
    } catch {}

    return achievements;
  } catch (err) {
    console.error('[CULTURE AI AchievementService] Exception in fetchUserAchievements:', err);
    return [];
  }
}

/**
 * Idempotently unlock an achievement for a user.
 * Returns true if the achievement was NEWLY unlocked, false if it was already unlocked or failed.
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  if (!userId || !achievementId) return false;

  // Verify achievement exists in definitions
  const def = getAchievementById(achievementId);
  if (!def) {
    console.warn(`[CULTURE AI AchievementService] Invalid achievement ID: ${achievementId}`);
    return false;
  }

  if (!isSupabaseConfigured) {
    try {
      const key = `${STORAGE_KEY_OFFLINE_ACHIEVEMENTS}_${userId}`;
      const raw = localStorage.getItem(key);
      const list: UserAchievement[] = raw ? JSON.parse(raw) : [];

      if (list.some((a) => a.achievement_id === achievementId)) {
        return false; // Already unlocked
      }

      const newRecord: UserAchievement = {
        id: generateUUID(),
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      };

      list.push(newRecord);
      localStorage.setItem(key, JSON.stringify(list));
      return true; // Newly unlocked offline
    } catch (e) {
      console.error('[CULTURE AI AchievementService] Error unlocking offline achievement:', e);
      return false;
    }
  }

  try {
    // 1. Check if achievement is already unlocked
    const { data: existing, error: checkError } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[CULTURE AI AchievementService] Check error:', checkError);
    }

    if (existing) {
      return false; // Already unlocked
    }

    // 2. Insert new record
    const newRecord = {
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_achievements')
      .insert([newRecord])
      .select('id, user_id, achievement_id, unlocked_at');

    if (error) {
      // 23505 is PostgreSQL unique constraint violation
      if (error.code === '23505') {
        return false;
      }
      console.error('[CULTURE AI AchievementService] Error inserting achievement:', error);
      return false;
    }

    if (data && data.length > 0) {
      // Sync to offline cache
      try {
        const key = `${STORAGE_KEY_OFFLINE_ACHIEVEMENTS}_${userId}`;
        const raw = localStorage.getItem(key);
        const list: UserAchievement[] = raw ? JSON.parse(raw) : [];
        if (!list.some((a) => a.achievement_id === achievementId)) {
          list.push(data[0] as UserAchievement);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch {}

      return true; // Newly unlocked!
    }

    return false;
  } catch (err) {
    console.error('[CULTURE AI AchievementService] Exception in unlockAchievement:', err);
    return false;
  }
}

/**
 * Helper to validate quiz score for quiz_whiz achievement.
 */
function qualifiesForQuizWhiz(
  activityType?: string,
  metadata?: Record<string, unknown>
): boolean {
  if (activityType !== 'quiz_completed' || !metadata) {
    return false;
  }

  const score = Number(metadata.score);
  const total = Number(metadata.total);

  if (isNaN(score) || isNaN(total) || total <= 0) {
    return false;
  }

  return score / total >= 0.8;
}

/**
 * Evaluates all candidate achievements against the user's latest activity stats.
 * Returns an array containing ONLY achievement IDs that were newly unlocked during this run.
 */
export async function evaluateAchievements(
  userId: string,
  stats: {
    totalActivitiesCount: number;
    currentStreak: number;
    longestStreak: number;
    overallProgressPercent: number;
    activityType?: string;
    activityMetadata?: Record<string, unknown>;
  }
): Promise<string[]> {
  if (!userId) return [];

  const newlyUnlocked: string[] = [];

  const candidateChecklist: { id: string; condition: boolean }[] = [
    {
      id: 'first_step',
      condition: stats.totalActivitiesCount >= 1,
    },
    {
      id: 'streak_3',
      condition: stats.currentStreak >= 3 || stats.longestStreak >= 3,
    },
    {
      id: 'streak_7',
      condition: stats.currentStreak >= 7 || stats.longestStreak >= 7,
    },
    {
      id: 'study_10',
      condition: stats.totalActivitiesCount >= 10,
    },
    {
      id: 'path_pioneer',
      condition: stats.overallProgressPercent >= 25,
    },
    {
      id: 'quiz_whiz',
      condition: qualifiesForQuizWhiz(stats.activityType, stats.activityMetadata),
    },
  ];

  for (const candidate of candidateChecklist) {
    if (candidate.condition) {
      try {
        const wasNewlyUnlocked = await unlockAchievement(userId, candidate.id);
        if (wasNewlyUnlocked) {
          newlyUnlocked.push(candidate.id);
        }
      } catch (err) {
        console.error(`[CULTURE AI AchievementService] Error evaluating ${candidate.id}:`, err);
      }
    }
  }

  return newlyUnlocked;
}
