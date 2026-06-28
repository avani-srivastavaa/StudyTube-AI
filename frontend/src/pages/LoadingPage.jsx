import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'
import { C } from '../components/ui'

// Phase 1 happens during the real /extract network call.
// Phase 2 happens during the real /generate/all call — since that one request
// does 4 things in parallel server-side, we animate through sub-steps for
// good UX, then snap to "done" the moment the response actually arrives.
const PHASES = {
  extracting: [
    { label: 'Connecting to YouTube', icon: '🔗' },
    { label: 'Fetching Full Transcript', icon: '📄' },
    { label: 'Reading Video Metadata', icon: 'ℹ️' },
  ],
  generating: [
    { label: 'Analyzing Entire Transcript', icon: '🧠' },
    { label: 'Writing Smart Notes', icon: '✍️' },
    { label: 'Building Flashcard Deck', icon: '🃏' },
    { label: 'Generating Quiz Questions', icon: '❓' },
    { label: 'Mapping Knowledge Tree', icon: '🗺️' },
    { label: 'Preparing AI Tutor', icon: '🤖' },
  ],
}

export default function LoadingPage({ phase, videoTitle, error }) {
  const [subStep, setSubStep] = useState(0)
  const steps = PHASES[phase] || PHASES.extracting

  useEffect(() => {
    setSubStep(0)
    if (phase !== 'generating') return
    // Cosmetic sub-step progression while the single /generate/all call is
    // in flight — purely visual, the real completion is driven by the
    // network response resolving (handled by the parent). Generation runs
    // sequentially with a short gap between calls to respect free-tier
    // Gemini rate limits, so the whole pipeline typically takes 20-35s.
    const id = setInterval(() => {
      setSubStep(s => Math.min(s + 1, steps.length - 1))
    }, 5000)
    return () => clearInterval(id)
  }, [phase])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Couldn't analyze this video</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>{error}</p>
          <p style={{ color: C.dim, fontSize: 12 }}>Common causes: the video has captions disabled, is private/age-restricted, or the backend isn't running.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.grad, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 3s linear infinite', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
          <Brain size={32} style={{ color: '#fff', animation: 'spin 3s linear infinite reverse' }} />
        </div>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          {phase === 'extracting' ? 'Fetching the Real Transcript' : 'Analyzing the Whole Video'}
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 32, lineHeight: 1.7 }}>
          {videoTitle || 'Your video'}<br />
          <span style={{ color: C.dim, fontSize: 12 }}>
            {phase === 'extracting' ? 'Pulling captions directly from YouTube...' : 'StudyTube AI is reading every part of the transcript — not just the intro.'}
          </span>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          {steps.map((s, i) => {
            const done = i < subStep, active = i === subStep
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: done ? C.greenDim : active ? C.primaryDim : C.glass, border: `1px solid ${done ? C.green + '44' : active ? C.primary + '44' : C.border}`, transition: 'all 0.4s' }}>
                <div style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{done ? '✅' : active ? '⏳' : s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? C.green : active ? C.text : C.dim }}>{s.label}</div>
                </div>
                {active && <div style={{ width: 14, height: 14, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 28, background: C.border, borderRadius: 100, height: 4, overflow: 'hidden' }}>
          <div style={{ width: phase === 'extracting' ? '20%' : `${30 + (subStep / steps.length) * 70}%`, height: '100%', background: C.grad, borderRadius: 100, transition: 'width 0.6s ease' }} />
        </div>
      </div>
    </div>
  )
}