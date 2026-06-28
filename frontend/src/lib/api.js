/**
 * Backend API client
 *
 * Wraps every FastAPI endpoint. Automatically attaches the Supabase JWT
 * (if the user is logged in) so the backend can persist data against
 * their account. Works fine with no session too — backend treats
 * unauthenticated requests as guest/no-persistence.
 */
import { supabase, isConfigured as supabaseConfigured } from './supabase'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Every request gets a hard timeout — previously a hung backend or
// unreachable Supabase project (e.g. a paused free-tier project) left the
// UI spinning forever with zero feedback, since nothing here ever failed.
// Most calls are simple reads/writes and should never legitimately take
// long; a few (full-video generation, chat) are allowed more time.
const DEFAULT_TIMEOUT_MS = 20000
const SLOW_TIMEOUT_MS = 150000 // generate/all runs 4 sequential AI calls with rate-limit spacing
const MEDIUM_TIMEOUT_MS = 60000 // single generation calls, chat (first message builds an index)

async function authHeader() {
  if (!supabaseConfigured) return {}
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function request(path, { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader()) }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    if (!res.ok) {
      let detail = `Request failed (${res.status})`
      try {
        const errJson = await res.json()
        detail = errJson.detail || detail
      } catch { /* ignore parse error */ }
      throw new Error(detail)
    }
    return await res.json()
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. The backend may be unreachable, ` +
        `or a connected service (e.g. Supabase) may be slow/paused — check the backend terminal for what's hanging.`
      )
    }
    if (e instanceof TypeError) {
      // fetch() throws a generic TypeError for network-level failures (backend not running, CORS, DNS, etc.)
      throw new Error(`Could not reach the backend at ${BASE_URL} — is it running?`)
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  // ── Health ──────────────────────────────────────────────────────────────
  health: () => request('/health'),

  // ── Transcript extraction — fetches the REAL transcript for any URL ─────
  extract: (url, language = 'en') =>
    request('/extract', { method: 'POST', body: { url, language }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  // ── Generation (each runs against the FULL transcript, no truncation) ───
  generateAll: (transcript, videoId) =>
    request('/generate/all', { method: 'POST', body: { transcript, video_id: videoId }, timeoutMs: SLOW_TIMEOUT_MS }),

  generateNotes: (transcript, videoId) =>
    request('/generate/notes', { method: 'POST', body: { transcript, video_id: videoId }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  generateFlashcards: (transcript, videoId, count) =>
    request('/generate/flashcards', { method: 'POST', body: { transcript, video_id: videoId, options: { count } }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  generateQuiz: (transcript, videoId, count) =>
    request('/generate/quiz', { method: 'POST', body: { transcript, video_id: videoId, options: { count } }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  generateMindmap: (transcript, videoId) =>
    request('/generate/mindmap', { method: 'POST', body: { transcript, video_id: videoId }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  generateInterview: (transcript, videoId) =>
    request('/generate/interview', { method: 'POST', body: { transcript, video_id: videoId }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  generateExam: (transcript, videoId) =>
    request('/generate/exam', { method: 'POST', body: { transcript, video_id: videoId }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  // ── Chat (RAG over the full transcript) ──────────────────────────────────
  chat: (messages, videoId, transcript) =>
    request('/chat', { method: 'POST', body: { messages, video_id: videoId, transcript }, timeoutMs: MEDIUM_TIMEOUT_MS }),

  chatHistory: (videoId) => request(`/chat/history/${videoId}`),

  // ── Progress / XP / Achievements ─────────────────────────────────────────
  updateProgress: (payload) => request('/progress/update', { method: 'POST', body: payload }),

  earnXP: (userId, xpDelta, badgeId, badgeLabel) =>
    request('/xp/earn', {
      method: 'POST',
      body: { user_id: userId, xp_delta: xpDelta, badge_id: badgeId, badge_label: badgeLabel },
    }),

  userStats: () => request('/user/stats'),
  userVideos: () => request('/user/videos'),
  userAchievements: () => request('/user/achievements'),
  getVideo: (videoId) => request(`/video/${videoId}`, { timeoutMs: MEDIUM_TIMEOUT_MS }),

  // ── Export ────────────────────────────────────────────────────────────────
  export: (contentType, content) =>
    request('/export', { method: 'POST', body: { content_type: contentType, content } }),
}

export const apiBaseUrl = BASE_URL