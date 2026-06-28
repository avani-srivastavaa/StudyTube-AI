# 🚀 StudyTube AI

> **Turn Any YouTube Video Into a Complete Interactive Learning Experience**

Paste a YouTube link → get AI notes, flashcards, a quiz, a mind map, interview prep, an exam revision sheet, and a personal AI tutor — generated from the **entire video**, not just the first few minutes.

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-8E75B2)](https://ai.google.dev)

---

## 📦 What's in this project

There are **two things** in this zip — use the one that fits what you need:

| Folder | What it is | Real video analysis? | Setup needed |
|---|---|---|---|
| **`frontend/` + `backend/`** | The real, full-stack app | ✅ Yes — fetches the actual transcript of whatever URL you paste | Supabase + Gemini API key |
| **`StudyTubeAI.jsx`** | A single-file UI demo (e.g. for a Claude.ai Artifact) | ❌ No — always shows the same example ML video, regardless of URL pasted | None — just paste into an Artifact |

**If you want it to actually analyze real YouTube videos, use `frontend/` + `backend/`.** The standalone `StudyTubeAI.jsx` can't do that on its own — browsers can't fetch YouTube captions directly (no CORS access), so real extraction needs a server. That file is kept only as a quick, zero-setup visual preview of the UI.

---

## ✅ The whole-video-analysis fix

Earlier versions of this backend truncated every transcript to ~1,500 words before generating anything, so a 2-hour lecture only ever got notes/quizzes/flashcards about its first 5 minutes. That's fixed:

- **No truncation.** The full transcript is sent to Gemini 1.5 Flash for every generation task (notes, flashcards, quiz, mind map, interview prep, exam sheet). Gemini 1.5 Flash supports up to ~1M input tokens, which comfortably covers even multi-hour lecture transcripts.
- **Output scales with video length.** A 10-minute clip gets ~3 note sections and ~8 flashcards; a 2-hour course gets up to ~12 sections and ~24 flashcards — proportional coverage instead of a fixed count biased toward the intro.
- **Explicit coverage instructions.** Every prompt tells the model the transcript is the complete video and that output must be distributed across the *entire* timeline, not just the opening topic.
- **RAG chat already covered the whole video** — the AI Tutor embeds the full transcript into a FAISS vector index and retrieves the most relevant chunks for each question, so it could already answer about later parts of a video. The fix above brings notes/flashcards/quiz/mindmap/interview/exam up to the same standard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📖 **Smart Notes** | Hierarchical notes covering every chapter, scaled to video length |
| 🃏 **Flashcards** | Flip cards sampled across the whole transcript, with mastery tracking |
| ❓ **Quiz Generator** | MCQs spread from beginning to end, with instant scoring + explanations |
| 🗺️ **Mind Map** | Interactive draggable SVG tree, one branch per major topic |
| 💬 **AI Tutor (Nova)** | RAG-powered chat grounded in the full transcript via FAISS |
| 💼 **Interview Prep** | Realistic Q&A sourced from across the whole video, with model answers |
| 📝 **Exam Mode** | Must-know facts, likely questions, last-minute revision sheet |
| 🏆 **Gamification** | XP, levels, badges, streaks — persisted to Supabase if logged in |
| 🔐 **Auth** | Email/password + Google OAuth via Supabase, or guest mode |
| 🎮 **Study Modes** | Explorer / Exam / Interview / Quick Revision — changes visible tabs |

---

## 📁 Project Structure

```
studytube-ai/
├── StudyTubeAI.jsx              # Single-file UI demo artifact (see note above)
├── supabase_schema.sql          # Run this in Supabase SQL Editor to create all tables
│
├── frontend/                    # Real React app — Vite + Supabase + your backend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx              # Orchestrates: extract → generate → dashboard
│       ├── main.jsx
│       ├── lib/
│       │   ├── supabase.js      # Supabase client (browser-safe anon key)
│       │   ├── api.js           # Backend API client (attaches auth token)
│       │   └── demoContent.js   # Offline demo data (explicit "Try Demo" button only)
│       ├── hooks/
│       │   └── useAuth.js       # Supabase auth state hook
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── LoadingPage.jsx  # Reflects real extract/generate network phases
│       │   └── AuthPage.jsx     # Email + Google sign in/up
│       └── components/
│           ├── ui.jsx           # Design system, particles, Nova mascot
│           ├── Dashboard.jsx    # Mode selector + tab navigation
│           ├── tabs.jsx         # Notes, Flashcards, Quiz, MindMap, Progress
│           └── tabs-live.jsx    # Chat, Interview, Exam — call backend live
│
└── backend/                     # FastAPI + Gemini + Supabase + FAISS
    ├── main.py
    ├── requirements.txt
    ├── requirements-dev.txt
    ├── .env.example
    ├── routes/
    │   └── api.py               # All endpoints, Supabase JWT auth via Depends()
    ├── services/
    │   ├── transcript_service.py  # Full transcript via youtube-transcript-api + yt-dlp
    │   ├── ai_service.py          # Gemini generation — NO truncation, length-scaled
    │   ├── rag_service.py         # FAISS index over full transcript for chat
    │   └── db_service.py          # All Supabase reads/writes
    ├── utils/
    │   ├── config.py             # Pydantic settings from .env
    │   └── exporter.py           # Plain-text export helpers
    └── tests/
        └── test_api.py           # Basic smoke tests (no API keys required)
```

---

## ⚡ Quick Start

### 1 — Set up Supabase (database + auth)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**, paste the contents of `supabase_schema.sql`, and run it. This creates all tables (`users`, `videos`, `progress`, `quiz_results`, `achievements`, `chat_history`), enables Row-Level Security, and sets up a trigger that auto-creates a `users` row on signup.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → used as `SUPABASE_URL`
   - **anon / public key** → used as `SUPABASE_ANON_KEY` (safe in the browser)
   - **service_role key** → used as `SUPABASE_SERVICE_ROLE_KEY` (**backend only — never expose this**)
4. *(Optional)* To enable "Continue with Google": **Authentication → Providers → Google**, add your OAuth client ID/secret.

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

## 🔌 Backend API Reference

```http
POST /api/extract                  { "url": "https://youtube.com/watch?v=..." }
POST /api/generate/all             { "transcript": "...", "video_id": "..." }
POST /api/generate/notes           { "transcript": "...", "video_id": "..." }
POST /api/generate/flashcards      { "transcript": "...", "video_id": "...", "options": {"count": 12} }
POST /api/generate/quiz            { "transcript": "...", "video_id": "...", "options": {"count": 8} }
POST /api/generate/mindmap         { "transcript": "...", "video_id": "..." }
POST /api/generate/interview       { "transcript": "...", "video_id": "..." }
POST /api/generate/exam            { "transcript": "...", "video_id": "..." }
POST /api/chat                     { "messages": [...], "video_id": "...", "transcript": "..." }
POST /api/progress/update          (requires auth)
POST /api/xp/earn                  { "user_id": "...", "xp_delta": 25, "badge_id": "notes" }
GET  /api/user/stats               (requires auth)
GET  /api/user/videos              (requires auth)
GET  /api/user/achievements        (requires auth)
POST /api/export                   { "content_type": "notes", "content": {...} }
```

Requests include `Authorization: Bearer <supabase_jwt>` automatically when the user is logged in (handled by `frontend/src/lib/api.js`). Endpoints work without it too — they just skip persistence.

---

## 🤖 AI Architecture

```
YouTube URL
    │
    ▼
TranscriptService ──► youtube-transcript-api + yt-dlp (FULL transcript, no truncation)
    │
    ▼
Raw Transcript (any length)
    │
    ├──► AIService (Gemini 1.5 Flash, full transcript, output scaled to length)
    │        ├── generate_notes()        → sections scale 3-12 with word count
    │        ├── generate_flashcards()   → cards scale 8-24
    │        ├── generate_quiz()         → questions scale 6-18
    │        ├── generate_mindmap()      → branches scale 3-8
    │        ├── generate_interview_questions()
    │        └── generate_exam_sheet()
    │
    └──► RAGService (FAISS + Gemini embeddings)
             └── Chunks the FULL transcript → semantic search → grounds chat answers
                  on any part of the video, including later sections
```

---

## 🎮 Gamification

| Action | XP | Persisted to Supabase if logged in |
|---|---|---|
| Video analyzed | +10 | ✅ |
| Read study notes | +25 | ✅ |
| Mastered 50% of flashcards | +30 | ✅ |
| Completed quiz (≥70%) | +50 | ✅ |
| Completed quiz (<70%) | +20 | ✅ |
| Used AI Tutor | +15 | ✅ |
| Explored Mind Map | +20 | ✅ |
| Generated Interview Prep | +20 | ✅ |
| Generated Exam Sheet | +20 | ✅ |

Every 100 XP = one level. Achievements are stored idempotently in the `achievements` table (won't double-unlock).

---

## 🗄️ Supabase Schema Overview

`supabase_schema.sql` creates:

- **`users`** — extends `auth.users` with `xp`, `level`, `streak` (auto-created via trigger on signup)
- **`videos`** — cached transcript + all generated content per user
- **`progress`** — per-video completion state
- **`quiz_results`** — score history
- **`achievements`** — unlocked badges (unique per user+badge)
- **`chat_history`** — AI Tutor conversation log
- All tables have **Row-Level Security** enabled — a user can only read/write their own rows
- A `leaderboard` view exposes top-20 XP without exposing emails/PII

---

## 🚀 Deployment

**Frontend → Vercel**
```bash
cd frontend
npx vercel --prod
# Set VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY in Vercel env vars
```

**Backend → Render**
1. Connect the repo, set root directory to `backend/`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all vars from `.env.example` (including `ALLOWED_ORIGINS=https://your-frontend.vercel.app`)

**Database → Supabase** — already hosted, nothing to deploy.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite · Lucide Icons · CSS-in-JS |
| Auth & DB | Supabase (PostgreSQL + Auth + RLS) |
| Backend | FastAPI · Python 3.11 · Pydantic v2 |
| AI Generation | Google Gemini 1.5 Flash (full transcript, no truncation) |
| Vector Search | FAISS + Gemini embeddings (`text-embedding-004`) |
| Transcripts | `youtube-transcript-api` · `yt-dlp` |
| UI Demo Artifact | Anthropic Claude API (`StudyTubeAI.jsx` only) |
| Deployment | Vercel (frontend) · Render (backend) · Supabase (DB, hosted) |

---

## 🧪 Testing

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

The included tests cover the health endpoints, input validation, and the pure scaling/parsing functions in `ai_service.py` — none require real API keys. Testing live generation/extraction needs a running server with real `GEMINI_API_KEY` / Supabase credentials.

---

## ❓ Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Couldn't analyze this video" | Video has captions disabled, is private/age-restricted, or backend isn't running |
| Frontend shows blank/guest mode always | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` not set in `frontend/.env` |
| Backend 401 on `/api/user/*` | Not logged in — those endpoints require a Supabase session |
| CORS error in browser console | Add your frontend origin to `ALLOWED_ORIGINS` in `backend/.env` |
| Generation feels slow on long videos | Expected — Gemini processes proportionally more content; this is the tradeoff for full-video coverage instead of truncation |

---

## 📄 License

MIT — free to use, fork, and build upon.

---

*StudyTube AI — analyzes the whole video, not just the introduction.*
