import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbStreak } from '../types/database';

export async function getStreak(userId: string): Promise<{ data: DbStreak | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DbStreak, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateStreak(streak: DbStreak): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { error } = await supabase
      .from('streaks')
      .upsert({
        user_id: streak.user_id,
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak,
        last_activity_date: streak.last_activity_date,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
