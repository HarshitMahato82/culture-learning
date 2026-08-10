import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-id.supabase.co' &&
  !supabaseUrl.includes('your-supabase')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[CULTURE AI] Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are missing or incomplete. Please configure them in your .env file.'
  );
}

// Custom fetch wrapper to handle empty or malformed JSON responses gracefully
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, init);
  const clone = response.clone();

  response.json = async () => {
    try {
      const text = await clone.text();
      if (!text || !text.trim()) {
        return {};
      }
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  return response;
};

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: customFetch,
    },
  }
);

