import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbLearningProgress } from '../types/database';

export async function getLearningProgress(userId: string): Promise<{ data: DbLearningProgress[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DbLearningProgress[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateLearningProgress(progress: DbLearningProgress): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: progress.user_id,
        subject: progress.subject,
        topic: progress.topic,
        progress_percent: progress.progress_percent,
        completed_units: progress.completed_units,
        total_units: progress.total_units,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject,topic' });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
