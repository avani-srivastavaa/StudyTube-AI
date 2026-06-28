/**
 * Supabase client singleton
 * Uses ANON key only — safe for the browser.
 * Never use SERVICE_ROLE_KEY in the frontend.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[StudyTube] Supabase env vars not set — running in demo mode (no persistence).')
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,     // stores session in localStorage
        detectSessionInUrl: true, // picks up ?code= after Google OAuth redirect
      },
    })
  : null

export const isConfigured = Boolean(supabase)
