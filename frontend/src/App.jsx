import { useState, useRef, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { api } from './lib/api'
import { C, Spin, GLOBAL_KEYFRAMES } from './components/ui'
import HomePage from './pages/HomePage'
import LoadingPage from './pages/LoadingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './components/Dashboard'
import VideoSwitcher from './components/VideoSwitcher'
import { DEMO_VIDEO, DEMO_TRANSCRIPT, DEMO_NOTES, DEMO_FLASHCARDS, DEMO_QUIZ, DEMO_MINDMAP } from './lib/demoContent'

function wordCount(text) { return text ? text.trim().split(/\s+/).length : 0 }

const NOVA_GREETING = { role: 'assistant', content: "Hi! I'm Nova 🌟 I've read this entire video — every chapter, start to finish — and I'm ready to help. Ask me anything, including about later parts of the video!" }

export default function App() {
  const auth = useAuth()
  const [guestMode, setGuestMode] = useState(false)

  const [view, setView] = useState('home')          // home | loading | dashboard
  const [phase, setPhase] = useState('extracting')  // extracting | generating
  const [loadError, setLoadError] = useState(null)
  const [loadingTitle, setLoadingTitle] = useState(null)

  // ── Multi-video library ────────────────────────────────────────────────────
  // Every analyzed video this session lives here, keyed by video_id, so
  // opening a second (or third...) video never discards the others — you can
  // switch back to any of them instantly with zero re-fetching.
  const [openVideos, setOpenVideos] = useState({})
  const [activeVideoId, setActiveVideoId] = useState(null)

  const [xp, setXP] = useState(0)
  const badges = useRef(new Set())
  const startTime = useRef(Date.now())

  const activeEntry = activeVideoId ? openVideos[activeVideoId] : null

  // ── XP / achievement persistence (account-level, shared across videos) ───
  const onEarnXP = useCallback((pts, badgeId) => {
    setXP(prev => prev + pts)
    if (auth.user) {
      const label = badgeId ? badgeId[0].toUpperCase() + badgeId.slice(1) : undefined
      api.earnXP(auth.user.id, pts, badgeId, label)
        .catch(e => console.warn('XP persistence failed (non-fatal):', e.message))
    }
  }, [auth.user])

  // ── Merge a partial update into one video's entry ─────────────────────────
  const updateVideoEntry = useCallback((videoId, patch) => {
    setOpenVideos(prev => ({ ...prev, [videoId]: { ...prev[videoId], ...patch } }))
  }, [])

  // ── Add (or refresh) a video in the library and make it active ───────────
  const openVideoWithContent = useCallback((vid, transcriptText, data) => {
    setOpenVideos(prev => {
      const isNew = !prev[vid.id]
      if (isNew) setXP(p => p + 10) // small bonus, once per newly-opened video
      return {
        ...prev,
        [vid.id]: {
          video: vid,
          transcript: transcriptText,
          notes: data.notes || null,
          flashcards: data.flashcards || [],
          quiz: data.quiz || [],
          mindmap: data.mindmap || null,
          interview: data.interview_questions || null,
          examSheet: data.exam_sheet || null,
          chatMessages: [NOVA_GREETING],
          chatSending: false,
          genErrors: data.field_errors || {},
        },
      }
    })
    setActiveVideoId(vid.id)
    setView('dashboard')
  }, [])

  // ── Real pipeline: paste URL → check cache → fetch transcript if needed ──
  const startLearning = async (url) => {
    setView('loading'); setPhase('extracting'); setLoadError(null); setLoadingTitle(null)
    try {
      const extracted = await api.extract(url)
      const vid = {
        id: extracted.video_id,
        title: extracted.title,
        channel: extracted.channel,
        duration: extracted.duration,
        thumbnail: extracted.thumbnail,
        wordCount: wordCount(extracted.transcript),
      }
      setLoadingTitle(vid.title)

      if (extracted.cached && extracted.notes) {
        openVideoWithContent(vid, extracted.transcript, extracted)
      } else {
        setPhase('generating')
        const gen = await api.generateAll(extracted.transcript, extracted.video_id)
        if (gen.errors?.length) console.warn('Some generation steps failed:', gen.errors)
        openVideoWithContent(vid, extracted.transcript, gen)
      }
    } catch (e) {
      setLoadError(e.message || 'Something went wrong analyzing this video.')
    }
  }

  // ── Resume a previously-analyzed video from "My Videos" ──────────────────
  const resumeVideo = async (videoId) => {
    // Already open this session — instant switch, no network call at all.
    if (openVideos[videoId]) {
      setActiveVideoId(videoId)
      setView('dashboard')
      return
    }
    setView('loading'); setPhase('extracting'); setLoadError(null); setLoadingTitle(null)
    try {
      const res = await api.getVideo(videoId)
      const v = res.data
      const vid = {
        id: v.id, title: v.title, channel: v.channel, duration: v.duration,
        thumbnail: v.thumbnail, wordCount: wordCount(v.transcript || ''),
      }
      setLoadingTitle(vid.title)

      if (v.notes) {
        openVideoWithContent(vid, v.transcript || '', v)
      } else {
        setPhase('generating')
        const gen = await api.generateAll(v.transcript, v.id)
        openVideoWithContent(vid, v.transcript, gen)
      }
    } catch (e) {
      setLoadError(e.message || 'Could not load this video.')
    }
  }

  // ── Close a video from the switcher (just removes it from this session — ──
  // it's still saved in "Continue Studying" on the home page) ───────────────
  const closeVideo = useCallback((videoId) => {
    setOpenVideos(prev => {
      const next = { ...prev }
      delete next[videoId]
      return next
    })
    setActiveVideoId(prev => {
      if (prev !== videoId) return prev
      const remaining = Object.keys(openVideos).filter(id => id !== videoId)
      return remaining[0] || null
    })
  }, [openVideos])

  // ── Retry a single generation step for the ACTIVE video ───────────────────
  const retryGeneration = useCallback(async (type) => {
    if (!activeEntry || !activeVideoId) return
    updateVideoEntry(activeVideoId, { genErrors: { ...activeEntry.genErrors, [type]: null } })
    try {
      let patch
      if (type === 'notes') patch = { notes: (await api.generateNotes(activeEntry.transcript, activeVideoId)).data }
      else if (type === 'flashcards') patch = { flashcards: (await api.generateFlashcards(activeEntry.transcript, activeVideoId)).data }
      else if (type === 'quiz') patch = { quiz: (await api.generateQuiz(activeEntry.transcript, activeVideoId)).data }
      else if (type === 'mindmap') patch = { mindmap: (await api.generateMindmap(activeEntry.transcript, activeVideoId)).data }
      if (patch) updateVideoEntry(activeVideoId, patch)
    } catch (e) {
      updateVideoEntry(activeVideoId, { genErrors: { ...activeEntry.genErrors, [type]: e.message || 'Retry failed — please try again.' } })
    }
  }, [activeEntry, activeVideoId, updateVideoEntry])

  // ── Interview / Exam / Chat for the ACTIVE video ──────────────────────────
  const generateInterview = useCallback(async () => {
    if (!activeEntry || !activeVideoId) return
    updateVideoEntry(activeVideoId, { interviewLoading: true, interviewError: '' })
    try {
      const res = await api.generateInterview(activeEntry.transcript, activeVideoId)
      updateVideoEntry(activeVideoId, { interview: res.data, interviewLoading: false })
    } catch (e) {
      updateVideoEntry(activeVideoId, { interviewError: e.message, interviewLoading: false })
    }
  }, [activeEntry, activeVideoId, updateVideoEntry])

  const generateExam = useCallback(async () => {
    if (!activeEntry || !activeVideoId) return
    updateVideoEntry(activeVideoId, { examLoading: true, examError: '' })
    try {
      const res = await api.generateExam(activeEntry.transcript, activeVideoId)
      updateVideoEntry(activeVideoId, { examSheet: res.data, examLoading: false })
    } catch (e) {
      updateVideoEntry(activeVideoId, { examError: e.message, examLoading: false })
    }
  }, [activeEntry, activeVideoId, updateVideoEntry])

  const sendChatMessage = useCallback(async (text) => {
    if (!activeEntry || !activeVideoId) return
    const nm = [...activeEntry.chatMessages, { role: 'user', content: text }]
    updateVideoEntry(activeVideoId, { chatMessages: nm, chatSending: true })
    try {
      const res = await api.chat(nm.map(m => ({ role: m.role, content: m.content })), activeVideoId, activeEntry.transcript)
      updateVideoEntry(activeVideoId, { chatMessages: [...nm, { role: 'assistant', content: res.reply }], chatSending: false })
    } catch (e) {
      updateVideoEntry(activeVideoId, { chatMessages: [...nm, { role: 'assistant', content: `Sorry, I hit a connection error (${e.message}). Please try again!` }], chatSending: false })
    }
  }, [activeEntry, activeVideoId, updateVideoEntry])

  // ── Offline demo — explicit, never a silent fallback for a real URL ─────
  const startDemo = () => {
    openVideoWithContent(DEMO_VIDEO, DEMO_TRANSCRIPT, {
      notes: DEMO_NOTES, flashcards: DEMO_FLASHCARDS, quiz: DEMO_QUIZ, mindmap: DEMO_MINDMAP,
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  let body

  if (auth.loading) {
    body = (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    )
  } else if (auth.isConfigured && !auth.user && !guestMode) {
    body = <AuthPage auth={auth} onContinueAsGuest={() => setGuestMode(true)} />
  } else {
    const accountProps = {
      isLoggedIn: Boolean(auth.user),
      isGuest: !auth.user && guestMode,
      userName: auth.user?.user_metadata?.full_name || auth.user?.email?.split('@')[0],
      onLogout: async () => { await auth.signOut(); setGuestMode(false); setView('home') },
      onSwitchToLogin: () => setGuestMode(false),
    }

    if (view === 'home') {
      body = <HomePage onStart={startLearning} onTryDemo={startDemo} onResume={resumeVideo} {...accountProps} />
    } else if (view === 'loading') {
      body = <LoadingPage phase={phase} videoTitle={loadingTitle} error={loadError} />
    } else if (activeEntry) {
      body = (
        <>
          <VideoSwitcher
            openVideos={openVideos}
            activeVideoId={activeVideoId}
            onSwitch={setActiveVideoId}
            onClose={closeVideo}
            onAddVideo={startLearning}
          />
          <Dashboard
            key={activeVideoId}
            video={activeEntry.video}
            notes={activeEntry.notes}
            flashcards={activeEntry.flashcards}
            quiz={activeEntry.quiz}
            mindmap={activeEntry.mindmap}
            transcript={activeEntry.transcript}
            interview={activeEntry.interview}
            interviewLoading={activeEntry.interviewLoading}
            interviewError={activeEntry.interviewError}
            onGenerateInterview={generateInterview}
            examSheet={activeEntry.examSheet}
            examLoading={activeEntry.examLoading}
            examError={activeEntry.examError}
            onGenerateExam={generateExam}
            chatMessages={activeEntry.chatMessages}
            chatSending={activeEntry.chatSending}
            onSendChat={sendChatMessage}
            xp={xp}
            onEarnXP={onEarnXP}
            badges={badges.current}
            startTime={startTime.current}
            genErrors={activeEntry.genErrors}
            onRetry={retryGeneration}
            onGoHome={() => setView('home')}
          />
        </>
      )
    } else {
      // Shouldn't normally happen, but fall back to home rather than a blank screen.
      body = <HomePage onStart={startLearning} onTryDemo={startDemo} onResume={resumeVideo} {...accountProps} />
    }
  }

  return (
    <>
      <style>{GLOBAL_KEYFRAMES}</style>
      {body}
    </>
  )
}