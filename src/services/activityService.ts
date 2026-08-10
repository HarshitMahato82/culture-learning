import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbLearningActivity } from '../types/database';

export async function recordLearningActivity(activity: DbLearningActivity): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { error } = await supabase
      .from('learning_activity')
      .insert({
        user_id: activity.user_id,
        activity_type: activity.activity_type,
        subject: activity.subject || 'General',
        topic: activity.topic || 'General',
        metadata: activity.metadata || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
