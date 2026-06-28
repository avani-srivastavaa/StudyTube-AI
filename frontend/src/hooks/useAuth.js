/**
 * useAuth — Supabase auth state hook
 *
 * Returns:
 *   user        — current Supabase user object (or null)
 *   session     — full session object (access_token etc.)
 *   loading     — true while initial session is being checked
 *   signInEmail — sign in with email + password
 *   signUpEmail — create account with email + password
 *   signInGoogle — trigger Google OAuth (redirects to Google)
 *   signOut     — log out and clear session
 *   error       — last auth error message
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Listen for login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Sign In with Email ────────────────────────────────────────────────────
  const signInEmail = useCallback(async (email, password) => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    return !error
  }, [])

  // ── Sign Up with Email ────────────────────────────────────────────────────
  const signUpEmail = useCallback(async (email, password, displayName = '') => {
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    })
    if (error) setError(error.message)
    else setError('Check your email for a confirmation link!')
    return !error
  }, [])

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInGoogle = useCallback(async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) setError(error.message)
  }, [])

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  return {
    user,
    session,
    loading,
    error,
    setError,
    signInEmail,
    signUpEmail,
    signInGoogle,
    signOut,
    isConfigured,
  }
}
