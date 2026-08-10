import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbChatSession, DbChatMessage } from '../types/database';

export async function getChatSessions(userId: string): Promise<{ data: DbChatSession[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DbChatSession[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function saveChatMessage(message: DbChatMessage, sessionTitle?: string, subject?: string): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the environment.')
    };
  }

  try {
    // 1. Ensure chat session exists
    if (sessionTitle) {
      await supabase
        .from('chat_sessions')
        .upsert({
          id: message.session_id,
          user_id: message.user_id,
          title: sessionTitle,
          subject: subject || 'General',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    }

    // 2. Insert chat message
    const { error } = await supabase
      .from('chat_messages')
      .upsert({
        id: message.id,
        session_id: message.session_id,
        user_id: message.user_id,
        role: message.role,
        text: message.text,
        timestamp: message.timestamp,
      }, { onConflict: 'id' });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
