import { useState, useEffect } from 'react'
import { Zap, BookOpen, Layers, Target, MessageCircle, Map, Award, GraduationCap, Trophy, Play, Sparkles, Clock, ChevronRight, LogOut, LogIn } from 'lucide-react'
import { C, GradText, Pill, Particles, GLOBAL_KEYFRAMES, Spin } from '../components/ui'
import { api } from '../lib/api'

const FEATURES = [
  { icon: BookOpen, title: 'Smart Notes', desc: 'AI notes covering the ENTIRE video — every chapter, not just the intro', color: C.primary },
  { icon: Layers, title: 'Flashcards', desc: 'Auto-created flip cards sampled across the whole transcript', color: C.purple },
  { icon: Target, title: 'Quiz Generator', desc: 'Questions drawn from beginning, middle, and end of the video', color: C.cyan },
  { icon: MessageCircle, title: 'AI Tutor', desc: 'RAG-powered chat grounded in the full transcript, any topic', color: C.green },
  { icon: Map, title: 'Mind Maps', desc: 'Visual tree of every major chapter in the video', color: C.pink },
  { icon: Award, title: 'Interview Prep', desc: 'Real questions sourced from across the entire content', color: C.gold },
  { icon: GraduationCap, title: 'Exam Mode', desc: 'Revision sheet covering every topic, weighted by importance', color: C.orange },
  { icon: Trophy, title: 'Gamification', desc: 'Earn XP, unlock badges, and track streaks as you learn', color: '#ec4899' },
]

export default function HomePage({ onStart, onTryDemo, onResume, isLoggedIn, isGuest, userName, onLogout, onSwitchToLogin }) {
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const [myVideos, setMyVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [videosError, setVideosError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) { setMyVideos([]); return }
    setLoadingVideos(true); setVideosError('')
    api.userVideos()
      .then(res => setMyVideos(res.data || []))
      .catch(e => setVideosError(e.message))
      .finally(() => setLoadingVideos(false))
  }, [isLoggedIn])

  const handleStart = () => {
    if (!url.trim()) { setErr('Please paste a YouTube URL to continue'); return }
    if (!/youtu\.?be/.test(url)) { setErr("That doesn't look like a YouTube URL"); return }
    onStart(url.trim())
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,-apple-system,sans-serif', overflowX: 'hidden' }}>
      <style>{GLOBAL_KEYFRAMES}</style>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px', borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,1,16,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={16} style={{ color: '#fff' }} /></div>
          <span style={{ fontWeight: 900, fontSize: 18, background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyTube AI</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Pill color={C.green}>✨ Full-Video Analysis</Pill>
          {isLoggedIn && (
            <>
              <Pill color={C.primary}>👤 {userName}</Pill>
              <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.glass, border: `1px solid ${C.border}`, borderRadius: 100, padding: '5px 12px', color: C.muted, cursor: 'pointer', fontSize: 12 }}>
                <LogOut size={12} /> Log Out
              </button>
            </>
          )}
          {isGuest && (
            <>
              <Pill color={C.dim}>Guest mode</Pill>
              <button onClick={onSwitchToLogin} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.primaryDim, border: `1px solid ${C.primary}44`, borderRadius: 100, padding: '5px 12px', color: C.primaryL, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <LogIn size={12} /> Log In / Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <div style={{ position: 'relative', textAlign: 'center', padding: '72px 32px 56px', overflow: 'hidden' }}>
        <Particles />
        <div style={{ position: 'absolute', top: -80, left: '15%', width: 450, height: 450, background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 40, right: '5%', width: 320, height: 320, background: 'radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', animation: 'fadeUp 0.8s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.primaryDim, border: `1px solid ${C.primary}44`, borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
            <Sparkles size={13} style={{ color: C.primary }} /><span style={{ fontSize: 12, color: C.primaryL, fontWeight: 600 }}>Analyzes the entire video — start to finish</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,58px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 18, letterSpacing: -2 }}>
            Transform YouTube Videos<br /><GradText>Into Interactive Learning</GradText>
          </h1>
          <p style={{ color: C.muted, fontSize: 17, maxWidth: 540, margin: '0 auto 44px', lineHeight: 1.8 }}>
            Paste any YouTube lecture, tutorial, or podcast. We fetch its real transcript and generate notes, flashcards, quizzes, mind maps, and an AI tutor — covering the whole video, not just the first few minutes.
          </p>
          <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, background: C.glass, border: `1px solid ${err ? C.red : C.borderBright}`, borderRadius: 14, padding: '5px 5px 5px 16px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <input value={url} onChange={e => { setUrl(e.target.value); setErr('') }} onKeyDown={e => e.key === 'Enter' && handleStart()} placeholder="Paste YouTube URL — e.g. https://youtube.com/watch?v=..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 14, padding: '9px 0', fontFamily: 'inherit' }} />
              <button onClick={handleStart} style={{ background: C.grad, border: 'none', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><Zap size={14} />Start Learning</button>
            </div>
            {err && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>⚠ {err}</p>}
            <button onClick={onTryDemo} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'center' }}>
              <Play size={13} />Try the offline demo video (no backend required)
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
          {[['100%', 'Of Transcript Used'], ['0', 'Minutes Skipped'], ['Real', 'YouTube Captions'], ['AI', 'Powered']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {isLoggedIn && (loadingVideos || myVideos.length > 0 || videosError) && (
        <div style={{ padding: '0 32px 48px', maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} style={{ color: C.primary }} /> Continue Studying
          </h2>
          {loadingVideos ? (
            <div style={{ padding: 20 }}><Spin size={28} /></div>
          ) : videosError ? (
            <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: C.red, fontSize: 13 }}>⚠ Couldn't load your saved videos: {videosError}</span>
              <button onClick={() => { setLoadingVideos(true); setVideosError(''); api.userVideos().then(res => setMyVideos(res.data || [])).catch(e => setVideosError(e.message)).finally(() => setLoadingVideos(false)) }} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', color: C.text, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
                Retry
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {myVideos.map(v => (
                <button key={v.id} onClick={() => onResume(v.id)} style={{ display: 'flex', gap: 12, alignItems: 'center', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, cursor: 'pointer', textAlign: 'left', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
                  <img src={v.thumbnail || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt="" onError={e => { e.target.style.display = 'none' }} style={{ width: 64, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title || 'Untitled video'}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{v.channel} · {v.duration}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: C.dim, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '48px 32px', maxWidth: 1060, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Everything Covers the<br /><GradText>Whole Video</GradText></h2>
          <p style={{ color: C.muted, fontSize: 14 }}>Every feature pulls from the complete transcript — no truncation, no skipped chapters</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon size={18} style={{ color }} /></div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 7 }}>{title}</h3>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '36px 20px', color: C.dim, fontSize: 12 }}>StudyTube AI</div>
    </div>
  )
}