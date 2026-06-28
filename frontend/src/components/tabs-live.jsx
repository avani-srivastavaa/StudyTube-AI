/**
 * These three tabs call the backend directly, using the REAL transcript and
 * video_id for whichever video is currently loaded — never a hardcoded demo.
 */
import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, ChevronRight } from 'lucide-react'
import { C, Spin, Pill, GlassCard } from './ui'

// ── AI Tutor Chat (RAG over the full transcript) ────────────────────────────
export function ChatTab({ messages, sending, onSend, onEarn }) {
  const [inp, setInp] = useState('')
  const bottom = useRef(null); const earned = useRef(false)
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = () => {
    if (!inp.trim() || sending) return
    if (!earned.current) { onEarn(15); earned.current = true }
    onSend(inp.trim())
    setInp('')
  }

  const suggs = ['Summarize in 5 bullet points', 'What happens later in the video?', 'Give me 3 practice questions', 'Explain the hardest concept simply']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '58vh', animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bounce 2s ease infinite', fontSize: 16 }}>🌟</div>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Nova — AI Tutor</div><div style={{ fontSize: 11, color: C.green }}>● Online · RAG over full transcript</div></div>
        </div>
        <Pill color={C.green}>Context-Aware</Pill>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ maxWidth: '82%', padding: '11px 15px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? C.grad : C.glass, border: m.role === 'user' ? 'none' : `1px solid ${C.border}`, color: C.text, fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {sending && <div style={{ display: 'flex', gap: 5, padding: '11px 15px', background: C.glass, border: `1px solid ${C.border}`, borderRadius: '16px 16px 16px 4px', width: 'fit-content' }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />)}
        </div>}
        <div ref={bottom} />
      </div>
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 0' }}>
          {suggs.map(s => <button key={s} onClick={() => setInp(s)} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 20, padding: '5px 12px', color: C.muted, cursor: 'pointer', fontSize: 12 }}>{s}</button>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, background: C.glass, border: `1px solid ${C.borderBright}`, borderRadius: 12, padding: '5px 5px 5px 14px' }}>
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask Nova anything about the video..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontFamily: 'inherit' }} />
        <button onClick={send} disabled={sending || !inp.trim()} style={{ background: inp.trim() ? C.grad : C.border, border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={14} /></button>
      </div>
    </div>
  )
}

// ── Interview Prep ───────────────────────────────────────────────────────────
export function InterviewTab({ items, loading, error, onGenerate, onEarn }) {
  const [open, setOpen] = useState(null)
  const earned = useRef(false)
  useEffect(() => { if (items?.length && !earned.current) { onEarn(20); earned.current = true } }, [items])

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin color={C.gold} /><p style={{ color: C.muted, marginTop: 16 }}>Generating interview questions from the full video...</p></div>

  if (!items?.length) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>💼</div>
      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Interview Prep Mode</h3>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>Practice real interview questions sourced from across this entire video, with model answers and expert tips.</p>
      {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>⚠ {error}</p>}
      <button onClick={onGenerate} style={{ background: C.grad, border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Generate Interview Questions</button>
    </div>
  )

  const levelColor = { Easy: C.green, Medium: C.gold, Hard: C.red }
  const typeColor = { Conceptual: C.primary, Technical: C.cyan, Scenario: C.purple, Behavioral: C.pink }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Interview Prep</h2><p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{items.length} questions across difficulty levels</p></div>
        <button onClick={onGenerate} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px', color: C.muted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={12} />Regenerate</button>
      </div>
      {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>⚠ Last regenerate attempt failed: {error}</p>}
      {items.map((q, i) => (
        <GlassCard key={i} onClick={() => setOpen(open === i ? null : i)} style={{ marginBottom: 10, cursor: 'pointer' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.primaryDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.primaryL, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <Pill color={levelColor[q.level] || C.cyan}>{q.level}</Pill>
                <Pill color={typeColor[q.type] || C.primary}>{q.type}</Pill>
              </div>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{q.question}</p>
              {open === i && (
                <div style={{ marginTop: 14, animation: 'fadeUp 0.3s ease' }}>
                  <div style={{ background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: 1, marginBottom: 8 }}>MODEL ANSWER</div>
                    <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, margin: 0 }}>{q.answer}</p>
                  </div>
                  {q.tip && <div style={{ background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1, marginBottom: 6 }}>💡 INTERVIEWER TIP</div>
                    <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{q.tip}</p>
                  </div>}
                </div>
              )}
            </div>
            <ChevronRight size={16} style={{ color: C.dim, transform: `rotate(${open === i ? 90 : 0}deg)`, transition: 'transform 0.2s', flexShrink: 0, marginTop: 6 }} />
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

// ── Exam Mode ─────────────────────────────────────────────────────────────────
export function ExamTab({ sheet, loading, error, onGenerate, onEarn }) {
  const earned = useRef(false)
  useEffect(() => { if (sheet && !earned.current) { onEarn(20); earned.current = true } }, [sheet])

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin color={C.orange} /><p style={{ color: C.muted, marginTop: 16 }}>Generating exam revision sheet from the full video...</p></div>

  if (!sheet) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Exam Revision Mode</h3>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>Generate a focused revision sheet covering every chapter of this video — must-know concepts, likely questions, and last-minute tips.</p>
      {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>⚠ {error}</p>}
      <button onClick={onGenerate} style={{ background: `linear-gradient(135deg,${C.orange},${C.gold})`, border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Generate Revision Sheet</button>
    </div>
  )

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{sheet.title || 'Exam Revision Sheet'}</h2><Pill color={C.orange}>⚡ Exam Mode</Pill></div>
        <button onClick={onGenerate} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px', color: C.muted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={12} />Refresh</button>
      </div>
      {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>⚠ Last refresh attempt failed: {error}</p>}
      {sheet.examTips?.length > 0 && (
        <GlassCard style={{ marginBottom: 14, borderLeft: `3px solid ${C.orange}`, background: C.orangeDim }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 1, marginBottom: 10 }}>📋 EXAM TIPS</div>
          {sheet.examTips.map((t, i) => <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: C.orange }}>→</span><span style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{t}</span></div>)}
        </GlassCard>
      )}

      {(sheet.sections || []).map((s, i) => (
        <GlassCard key={i} style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.primaryL, marginBottom: 14 }}>{s.heading}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: 1, marginBottom: 8 }}>MUST KNOW</div>
              {s.mustKnow?.map((c, j) => <div key={j} style={{ display: 'flex', gap: 7, marginBottom: 5 }}><span style={{ color: C.cyan, fontSize: 12, marginTop: 2 }}>✓</span><span style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>{c}</span></div>)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1, marginBottom: 8 }}>LIKELY QUESTIONS</div>
              {s.likelyQuestions?.map((q, j) => <div key={j} style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 5, padding: '4px 8px', background: C.goldDim, borderRadius: 6 }}>❓ {q}</div>)}
            </div>
          </div>
          {s.quickFacts?.length > 0 && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: 1, marginBottom: 8 }}>⚡ QUICK FACTS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{s.quickFacts.map((f, j) => <span key={j} style={{ background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: C.green }}>{f}</span>)}</div>
            </div>
          )}
        </GlassCard>
      ))}

      {sheet.lastMinute?.length > 0 && (
        <GlassCard style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.1))', border: `1px solid ${C.orange}44` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 1, marginBottom: 12 }}>🔥 LAST MINUTE — MOST IMPORTANT</div>
          {sheet.lastMinute.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
              <span style={{ color: C.orange, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ color: C.text, fontSize: 14, lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}