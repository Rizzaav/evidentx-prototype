import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Built-in fallback to project credentials so OAuth and cloud database work seamlessly
// even if environment variables are omitted during cloud/Vercel build.
const DEFAULT_SUPABASE_URL = 'https://zgcnyvxymwxfztmfpmuq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_OlCFLoL-jz6IwgHSRpTsqQ_-pQwHqS9';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Checks whether Supabase environment variables are present and configured.
 */
export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0
  );
}

/**
 * Global Supabase Client instance with full TypeScript database definitions.
 * If credentials are missing, falls back safely to null without throwing.
 */
export const supabase = isSupabaseConfigured()
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;
