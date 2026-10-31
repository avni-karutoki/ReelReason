/**
 * Supabase browser client (frontend side of the auth + storage stack).
 * Initialized only when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set.
 * Without them, the studio gracefully falls back to guest demo mode.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

export const isSupabaseAuthConfigured = isConfigured;

export const frontendSupabase: SupabaseClient | null = isConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
