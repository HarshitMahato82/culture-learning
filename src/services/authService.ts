import { supabase, isSupabaseConfigured } from '../lib/supabase';

export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    return { user: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (err: any) {
    return { user: null, error: err };
  }
}
