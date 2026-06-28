# 🚀 StudyTube AI

> **Turn Any YouTube Video Into a Complete Interactive Learning Experience**

Paste a YouTube link → get AI notes, flashcards, a quiz, a mind map, interview prep, an exam revision sheet, and a personal AI tutor — generated from the **entire video**, not just the first few minutes. Open as many videos as you want, side by side, and switch between them instantly.

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash--Lite-8E75B2)](https://ai.google.dev)

---

## 📦 What's in this project

There are **two things** here — use the one that fits what you need:

| Folder | What it is | Real video analysis? | Setup needed |
|---|---|---|---|
| **`frontend/` + `backend/`** | The real, full-stack app | ✅ Yes — fetches the actual transcript of whatever URL you paste | Supabase + Gemini API key |
| **`StudyTubeAI.jsx`** | A single-file UI demo (e.g. for a Claude.ai Artifact) | ❌ No — always shows the same example ML video, regardless of URL pasted | None — just paste into an Artifact |

**If you want it to actually analyze real YouTube videos, use `frontend/` + `backend/`.** The standalone `StudyTubeAI.jsx` can't do that on its own — browsers can't fetch YouTube captions directly (no CORS access), so real extraction needs a server. That file is kept only as a quick, zero-setup visual preview of the UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Multi-video library** | Analyze and have multiple videos open at once. Switch between them instantly (zero re-fetching) via a video-switcher bar; add a new one without losing your place in the current one |
| 📖 **Smart Notes** | Hierarchical notes covering every chapter, scaled to video length — no truncation, even on multi-hour lectures |
| 🃏 **Flashcards** | Flip cards sampled across the whole transcript, with mastery tracking |
| ❓ **Quiz Generator** | MCQs spread from beginning to end, with instant scoring + explanations |
| 🗺️ **Mind Map** | Interactive draggable SVG tree that always fits its container, regardless of branch count |
| 💬 **AI Tutor (Nova)** | RAG-powered chat grounded in the full transcript via FAISS; conversation history persists across tab and video switches |
| 💼 **Interview Prep** | Realistic Q&A sourced from across the whole video, with model answers — generate once, persists across tab/video switches |
| 📝 **Exam Mode** | Must-know facts, likely questions, last-minute revision sheet |
| 🔁 **Resume anywhere** | "Continue Studying" on the home page reopens any past video — fully cached, no re-analysis |
| 🏆 **Gamification** | XP, levels, badges, streaks — persisted to Supabase if logged in |
| 🔐 **Auth** | Email/password + Google OAuth via Supabase, guest mode, and an actual Log Out button |
| 🎮 **Study Modes** | Explorer / Exam / Interview / Quick Revision — changes which tabs are visible |
| 🛡️ **Resilient to AI provider hiccups** | Automatic retry with the *exact* wait time Google's API specifies on rate limits; failed generation steps show a real error + Retry button instead of spinning forever |

---

## 📁 Project Structure

```
studytube-ai/
├── StudyTubeAI.jsx                  # Single-file UI demo artifact (see note above)
├── supabase_schema.sql              # Run this in Supabase SQL Editor on a fresh project
├── migration_add_interview_exam_columns.sql   # Run this too if your project predates interview/exam persistence
├── render.yaml                      # One-click backend deploy blueprint for Render
├── DEPLOYMENT.md                    # Full free-hosting walkthrough (Render + Vercel + Supabase)
│
├── frontend/                         # Vite + React + Supabase
│   ├── index.html / package.json / vite.config.js / .env.example
│   └── src/
│       ├── App.jsx                  # Multi-video state, retry/regenerate handlers, routing between Home/Loading/Dashboard
│       ├── main.jsx
│       ├── lib/
│       │   ├── supabase.js          # Supabase client (browser-safe anon key)
│       │   ├── api.js               # Backend API client — auth header, per-call timeouts
│       │   └── demoContent.js       # Offline demo data (explicit "Try Demo" button only)
│       ├── hooks/useAuth.js         # Supabase auth state hook (login/signup/logout/Google)
│       ├── pages/
│       │   ├── HomePage.jsx         # URL input, Continue Studying, Login/Logout controls
│       │   ├── LoadingPage.jsx      # Reflects real extract/generate network phases
│       │   └── AuthPage.jsx         # Email + Google sign in/up
│       └── components/
│           ├── ui.jsx               # Design system, particles, Nova mascot, shared atoms
│           ├── Dashboard.jsx        # Tab navigation + mode selector for one video
│           ├── VideoSwitcher.jsx    # Multi-video chip bar — switch, close, add videos
│           ├── tabs.jsx             # Notes, Flashcards, Quiz, MindMap, Progress (props-driven)
│           └── tabs-live.jsx        # Chat, Interview, Exam (props-driven; state owned by App.jsx)
│
└── backend/                          # FastAPI + Gemini (google-genai SDK) + Supabase + FAISS
    ├── main.py                      # CORS, app startup
    ├── requirements.txt             # Deliberately unpinned — see comments in the file
    ├── requirements-dev.txt
    ├── .env.example
    ├── routes/api.py                # Every endpoint; auth via Depends(get_current_user); logs every failure
    ├── services/
    │   ├── transcript_service.py    # Full transcript via youtube-transcript-api + yt-dlp; resilient to both v0.x and v1.x of that library
    │   ├── ai_service.py            # Gemini generation — full transcript, length-scaled output, retry-with-exact-delay
    │   ├── rag_service.py           # FAISS index over full transcript; singleton (shared across requests)
    │   └── db_service.py            # All Supabase reads/writes; merge-not-overwrite persistence
    ├── utils/config.py / exporter.py
    └── tests/test_api.py            # Smoke tests, no API keys required
```

---

## ⚡ Quick Start

### 1 — Set up Supabase (database + auth)

1. Create a free project at [supabase.com](https://supabase.com)
2. **SQL Editor → New Query** → paste `supabase_schema.sql` → run it
3. If you ever ran an earlier version of this schema, also run `migration_add_interview_exam_columns.sql` (safe to run regardless — uses `IF NOT EXISTS`)
4. **Project Settings → API** → copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `SUPABASE_ANON_KEY` (safe in the browser)
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**backend only — never expose this**)
5. *(Optional)* For "Sign in with Google": **Authentication → Providers → Google**, add your OAuth client ID/secret, and add your dev/prod URLs under **Authentication → URL Configuration**

### 2 — Backend (FastAPI + Gemini)

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env:
#   GEMINI_API_KEY=...            (free key at https://aistudio.google.com)
#   SUPABASE_URL=...
#   SUPABASE_ANON_KEY=...
#   SUPABASE_SERVICE_ROLE_KEY=...

uvicorn main:app --reload --port 8000
```

API docs: **http://localhost:8000/docs**

> **Free-tier Gemini quota note:** the backend currently uses `gemini-2.5-flash-lite`, which gets the most generous free-tier allowance Google currently offers (1,000 requests/day, 15/minute). If you ever see `RESOURCE_EXHAUSTED` errors, check [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits) for current numbers — Google revises these periodically — and update the single `MODEL_NAME` constant in `ai_service.py` if needed.

### 3 — Frontend (React + Vite)

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env:
#   VITE_API_BASE_URL=http://localhost:8000/api
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...

npm run dev
```

Open **http://localhost:5173**. Paste any YouTube URL with captions enabled, or click **"Try the offline demo video"** to preview the UI without a backend.

> If you leave the Supabase env vars blank, the app still works fully in **guest mode** — no login, no persistence, but real video analysis still runs.

---

## 📚 Multi-Video Architecture

Every analyzed video lives in an in-memory library (`openVideos`, keyed by video ID) inside `App.jsx`, not as a single overwritable slot. This means:

- Opening a second video never discards the first — both stay fully loaded
- Switching between already-open videos is **instant**, zero network calls
- A horizontal switcher bar above the dashboard lets you jump between open videos, close one, or paste another URL to analyze — all without leaving the page
- Interview prep, exam sheets, and AI Tutor conversations are scoped per-video and survive both tab switches *and* video switches
- "Continue Studying" on the home page reopens anything you've analyzed in a past session, pulling from Supabase

---

## 🔌 Backend API Reference

```http
POST /api/extract                  { "url": "https://youtube.com/watch?v=..." }   # checks cache first
GET  /api/video/{video_id}                                                          # full cached video, for resume
POST /api/generate/all             { "transcript": "...", "video_id": "..." }      # runs sequentially, not parallel
POST /api/generate/notes           { "transcript": "...", "video_id": "..." }
POST /api/generate/flashcards      { "transcript": "...", "video_id": "...", "options": {"count": 12} }
POST /api/generate/quiz            { "transcript": "...", "video_id": "...", "options": {"count": 8} }
POST /api/generate/mindmap         { "transcript": "...", "video_id": "..." }
POST /api/generate/interview       { "transcript": "...", "video_id": "..." }
POST /api/generate/exam            { "transcript": "...", "video_id": "..." }
POST /api/chat                     { "messages": [...], "video_id": "...", "transcript": "..." }
GET  /api/chat/history/{video_id}  (requires auth)
POST /api/progress/update          (requires auth)
POST /api/xp/earn                  { "user_id": "...", "xp_delta": 25, "badge_id": "notes" }
GET  /api/user/stats               (requires auth)
GET  /api/user/videos              (requires auth)
GET  /api/user/achievements        (requires auth)
POST /api/export                   { "content_type": "notes", "content": {...} }
```

Requests include `Authorization: Bearer <supabase_jwt>` automatically when logged in (handled by `frontend/src/lib/api.js`, which also applies a per-endpoint timeout — short ones for simple reads, much longer ones for AI generation). Every endpoint degrades gracefully without a token — generation/extraction still works, persistence is just skipped.

`/api/generate/all` deliberately runs its four calls **one at a time with a short gap**, not in parallel — free-tier Gemini rate limits are tight enough that firing them simultaneously reliably triggers `429` errors on 3 of the 4 calls.

---

## 🤖 AI Architecture

```
YouTube URL
    │
    ▼
TranscriptService ──► youtube-transcript-api + yt-dlp (FULL transcript, no truncation)
    │                  Falls back through: requested language → English → any
    │                  available caption track, translated to English if possible
    ▼
Raw Transcript (any length) ── cached in Supabase, keyed by video_id
    │
    ├──► AIService (gemini-2.5-flash-lite via the google-genai SDK)
    │        ├── generate_notes()        → sections scale 3-12 with word count
    │        ├── generate_flashcards()   → cards scale 8-24
    │        ├── generate_quiz()         → questions scale 6-18
    │        ├── generate_mindmap()      → branches scale 3-8
    │        ├── generate_interview_questions()
    │        └── generate_exam_sheet()
    │        Every call retries automatically on 429/503, waiting the EXACT
    │        delay Google's error response specifies — not a guessed backoff.
    │
    └──► RAGService (FAISS + gemini-embedding-001, via the google-genai SDK)
             └── Singleton — the FAISS index per video is built once and reused
                  across every chat message, not rebuilt every time. Chunks the
                  FULL transcript, so chat can answer about any part of the video.
```

**Why `google-genai` and not `google-generativeai`?** The latter is fully deprecated by Google (see [github.com/google-gemini/deprecated-generative-ai-python](https://github.com/google-gemini/deprecated-generative-ai-python)) — every call to it now either 404s or is on borrowed time. This backend uses the current SDK throughout, including a small custom adapter (`_GeminiEmbeddings` in `rag_service.py`) so FAISS gets embeddings from it too, instead of going through LangChain's Google wrapper (which is built on the deprecated package).

---

## 🎮 Gamification

| Action | XP | Persisted to Supabase if logged in |
|---|---|---|
| Video opened (first time this session) | +10 | ✅ |
| Read study notes | +25 | ✅ |
| Mastered 50% of flashcards | +30 | ✅ |
| Completed quiz (≥70%) | +50 | ✅ |
| Completed quiz (<70%) | +20 | ✅ |
| Used AI Tutor | +15 | ✅ |
| Explored Mind Map | +20 | ✅ |
| Generated Interview Prep | +20 | ✅ |
| Generated Exam Sheet | +20 | ✅ |

Every 100 XP = one level. Achievements are stored idempotently (won't double-unlock). XP is account-level and shared across every video, not reset per video.

---

## 🗄️ Supabase Schema Overview

- **`users`** — extends `auth.users` with `xp`, `level`, `streak`. Auto-created via trigger on signup, and self-healed on demand if a row is ever missing (e.g. an account that predates the trigger)
- **`videos`** — cached transcript + notes + flashcards + quiz + mindmap + interview questions + exam sheet, per user. Saves **merge**, not overwrite — generating just the quiz again can't wipe out previously-saved notes
- **`progress`**, **`quiz_results`**, **`achievements`**, **`chat_history`** — as you'd expect
- All tables have **Row-Level Security** — a user can only read/write their own rows
- A `leaderboard` view exposes top-20 XP without exposing emails/PII

---

## 🚀 Deployment

Full step-by-step guide, verified against current (2026) free-tier terms: **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**

Short version: **Render** (backend — needs to be a persistent process, not serverless, since it holds an in-memory FAISS cache) + **Vercel** (frontend — static Vite build) + **Supabase** (already hosted). `render.yaml` lets the backend deploy in one click as a Render Blueprint instead of manual dashboard configuration.

The one real free-tier tradeoff: Render's free web services sleep after 15 minutes idle and take up to ~60s to wake on the next request. The frontend's request timeouts are already tuned to accommodate this.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite · Lucide Icons · CSS-in-JS |
| Auth & DB | Supabase (PostgreSQL + Auth + RLS) |
| Backend | FastAPI · Python · Pydantic v2 |
| AI Generation | Google Gemini 2.5 Flash-Lite, via the current `google-genai` SDK |
| Vector Search | FAISS + Gemini embeddings (`gemini-embedding-001`) |
| Transcripts | `youtube-transcript-api` · `yt-dlp` |
| UI Demo Artifact | Anthropic Claude API (`StudyTubeAI.jsx` only) |
| Deployment | Render (backend) · Vercel (frontend) · Supabase (DB, hosted) |

---

## 🧪 Testing

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

Covers health endpoints, input validation, and the pure scaling/JSON-parsing functions in `ai_service.py` — none require real API keys. Testing live generation/extraction needs a running server with real credentials.

---

## ❓ Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Couldn't analyze this video" | Captions disabled, video is private/age-restricted, or backend isn't running |
| `RESOURCE_EXHAUSTED` / 429 errors | Free-tier Gemini quota — the app retries automatically respecting Google's exact wait time; if it persists, check current rate limits and consider switching `MODEL_NAME` |
| A tab shows "Couldn't generate this content" with a Retry button | Normal failure-handling, not a crash — click Retry. Check the backend terminal for the logged underlying error |
| CORS error in browser console | Add your frontend's exact origin to `ALLOWED_ORIGINS` in `backend/.env` |
| Request hangs / spinner forever | Shouldn't happen — every request has a timeout now. If you still see this, check whether something *else* is bound to your backend's port (e.g. another local service) |
| Backend 401 on `/api/user/*` | Not logged in — those endpoints require a Supabase session |
| "Continue Studying" empty or erroring | Check the error message shown (now surfaced in the UI, not silent) — common causes are a paused free-tier Supabase project or a backend connectivity issue |

---

## 📄 License

MIT — free to use, fork, and build upon.

---

*StudyTube AI — analyzes the whole video, not just the introduction. Open as many as you want.*