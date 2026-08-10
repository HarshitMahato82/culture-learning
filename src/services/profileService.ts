import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbProfile } from '../types/database';

export async function getUserProfile(userId: string): Promise<{ data: DbProfile | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DbProfile, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function saveUserProfile(profile: DbProfile): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const payload = {
      id: profile.id,
      name: profile.name,
      email: profile.email || '',
      role: profile.role,
      education_level: profile.education_level,
      subjects: profile.subjects,
      grade: profile.grade || '',
      learning_goal: profile.learning_goal || '',
      preferred_language: profile.preferred_language || 'English',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
