/**
 * Shared design system + small reusable UI atoms used across every page.
 */
import { useState, useEffect, useRef } from 'react'

export const C = {
  bg: '#060110', surface: '#0b0620', glass: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)', borderBright: 'rgba(255,255,255,0.15)',
  primary: '#6366f1', primaryL: '#818cf8', primaryDim: 'rgba(99,102,241,0.18)',
  purple: '#7c3aed', purpleDim: 'rgba(124,58,237,0.18)',
  cyan: '#06b6d4', cyanDim: 'rgba(6,182,212,0.15)',
  green: '#10b981', greenDim: 'rgba(16,185,129,0.15)',
  gold: '#f59e0b', goldDim: 'rgba(245,158,11,0.15)',
  orange: '#f97316', orangeDim: 'rgba(249,115,22,0.15)',
  pink: '#ec4899', pinkDim: 'rgba(236,72,153,0.15)',
  red: '#ef4444', redDim: 'rgba(239,68,68,0.15)',
  text: '#f1f5f9', muted: '#94a3b8', dim: '#475569',
  grad: 'linear-gradient(135deg,#6366f1,#7c3aed)',
  gradText: 'linear-gradient(135deg,#818cf8,#c084fc,#67e8f9)',
  gradCyan: 'linear-gradient(135deg,#06b6d4,#6366f1)',
}

export const GLOBAL_KEYFRAMES = `
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:2px}
  input::placeholder{color:#475569}
`

export function GradText({ children, style = {} }) {
  return (
    <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', ...style }}>
      {children}
    </span>
  )
}

export function Spin({ color = C.primary, size = 40 }) {
  return <div style={{ width: size, height: size, border: `3px solid ${color}33`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
}

export function Pill({ children, color = C.primary }) {
  return <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>{children}</span>
}

export function GlassCard({ children, style = {}, onClick }) {
  const [h, sH] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{ background: h && onClick ? 'rgba(255,255,255,0.07)' : C.glass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${h && onClick ? C.borderBright : C.border}`, borderRadius: 16, padding: 20, transition: 'all 0.2s', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

export function XPBar({ xp, level }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: C.goldDim, border: `1px solid ${C.gold}44`, borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>★ Lv {level}</span>
      </div>
      <div style={{ flex: 1, background: C.border, borderRadius: 100, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${xp % 100}%`, height: '100%', background: C.grad, borderRadius: 100, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ color: C.muted, fontSize: 12, whiteSpace: 'nowrap' }}>{xp} XP</span>
    </div>
  )
}

export function Particles() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    let raf
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > c.width) p.vx *= -1
        if (p.y < 0 || p.y > c.height) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99,102,241,0.5)'; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

const NOVA_TIPS = [
  '💡 Try Flashcards for active recall — proven to boost retention significantly!',
  '🏆 Complete the Quiz to earn XP and unlock the Quiz Champion badge!',
  '🧠 Use the Mind Map to see how all the concepts in this video connect.',
  "💬 Ask me anything in AI Tutor — I've read the entire video for you!",
  '⚡ Interview Mode prepares you for real questions on this exact topic.',
  '📖 Export your notes anytime to study offline.',
  '🔥 Come back tomorrow to keep your study streak alive!',
  '🎯 Exam Mode generates the most likely exam questions from this video.',
]

export function GenerationError({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Couldn't generate this content</p>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>{message || 'An unexpected error occurred.'}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ background: C.grad, border: 'none', color: '#fff', padding: '10px 22px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          Try Again
        </button>
      )}
    </div>
  )
}

export function Nova({ xp }) {
  const [open, setOpen] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)
  const [bounce, setBounce] = useState(false)

  useEffect(() => { const t = setInterval(() => setTipIdx(i => (i + 1) % NOVA_TIPS.length), 8000); return () => clearInterval(t) }, [])
  useEffect(() => { setBounce(true); const t = setTimeout(() => setBounce(false), 600); return () => clearTimeout(t) }, [xp])

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      {open && (
        <div style={{ background: '#0d0820', border: `1px solid ${C.purple}55`, borderRadius: 16, padding: 16, width: 260, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', animation: 'fadeUp 0.3s ease', boxShadow: '0 20px 60px rgba(124,58,237,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌟</div>
            <div><div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Nova</div><div style={{ fontSize: 10, color: C.green }}>● Your AI Study Coach</div></div>
          </div>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: '0 0 12px' }}>{NOVA_TIPS[tipIdx]}</p>
          <button onClick={() => setTipIdx(i => (i + 1) % NOVA_TIPS.length)} style={{ width: '100%', background: C.primaryDim, border: `1px solid ${C.primary}44`, borderRadius: 8, padding: '6px 0', color: C.primaryL, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Next Tip ✨</button>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} style={{ width: 52, height: 52, borderRadius: '50%', background: C.grad, border: 'none', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(99,102,241,0.5)', animation: bounce ? 'bounce 0.5s ease' : 'none', transition: 'transform 0.2s', transform: open ? 'scale(1.1)' : 'scale(1)' }}>
        {open ? '✕' : '🌟'}
      </button>
    </div>
  )
}