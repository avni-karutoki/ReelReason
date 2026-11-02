/**
 * Supabase browser client (frontend side of the auth + storage stack).
 * Initialized only when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set.
 * Without them, the studio gracefully falls back to guest demo mode.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Production defaults for the ReelReason Supabase project.
 * The anon key is a "publishable" key — designed to be shipped in browsers
 * (row-level security on the project protects the data). Vercel env vars
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) always take precedence.
 */
const PROD_SUPABASE_URL = 'https://gatooewjduzykzxistyw.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'sb_publishable_WSW2tDulEJe04Wld6w5MPw_GCGsiFjl';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || PROD_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || PROD_SUPABASE_ANON_KEY;

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
