/**
 * Display tabs that work purely off props (no backend calls of their own):
 * Notes, Flashcards, Quiz, MindMap, Progress.
 *
 * Chat / Interview / Exam live in tabs-live.jsx since they call the backend
 * directly using the real transcript + video_id for the video being studied.
 */
import { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, ChevronRight, Copy, Download } from 'lucide-react'
import { C, GradText, Spin, Pill, GlassCard, GenerationError } from './ui'

// ── Notes ──────────────────────────────────────────────────────────────────
export function NotesTab({ notes, error, onRetry, onEarn }) {
  const [copied, setCopied] = useState(false)
  const earned = useRef(false)
  useEffect(() => { if (notes && !earned.current) { onEarn(25); earned.current = true } }, [notes])

  const exportTxt = () => {
    const content = `# ${notes?.title || 'Study Notes'}\n\n## Overview\n${notes?.overview}\n\n## Key Points\n${(notes?.keyPoints || []).map(p => `• ${p}`).join('\n')}\n\n${(notes?.sections || []).map(s => `## ${s.heading}\n${s.content}\n${(s.bullets || []).map(b => `  • ${b}`).join('\n')}`).join('\n\n')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'study-notes.txt'; a.click()
  }

  if (!notes) {
    if (error) return <GenerationError message={error} onRetry={onRetry} />
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin /><p style={{ color: C.muted, marginTop: 16 }}>Generating your smart notes...</p></div>
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{notes.title || 'Study Notes'}</h2><Pill color={C.primary}>📖 {(notes.sections || []).length} Sections</Pill></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { navigator.clipboard.writeText(notes.overview || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px', color: C.muted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>{copied ? <><CheckCircle size={12} style={{ color: C.green }} />Copied!</> : <><Copy size={12} />Copy</>}</button>
          <button onClick={exportTxt} style={{ background: C.primaryDim, border: `1px solid ${C.primary}44`, borderRadius: 8, padding: '7px 12px', color: C.primaryL, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={12} />Export</button>
        </div>
      </div>

      <GlassCard style={{ marginBottom: 14, borderLeft: `3px solid ${C.cyan}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: 1, marginBottom: 10 }}>OVERVIEW</div>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, margin: 0 }}>{notes.overview}</p>
      </GlassCard>

      {notes.keyPoints?.length > 0 && (
        <GlassCard style={{ marginBottom: 14, borderLeft: `3px solid ${C.gold}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1, marginBottom: 12 }}>KEY POINTS</div>
          {notes.keyPoints.map((pt, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, marginTop: 8, flexShrink: 0 }} />
              <span style={{ color: C.text, fontSize: 14, lineHeight: 1.7 }}>{pt}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {(notes.sections || []).map((sec, i) => (
        <GlassCard key={i} style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: C.primaryL }}>{sec.heading}</h3>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, marginBottom: sec.bullets?.length ? 12 : 0 }}>{sec.content}</p>
          {sec.bullets?.map((b, j) => (
            <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
              <ChevronRight size={13} style={{ color: C.primary, marginTop: 4, flexShrink: 0 }} />
              <span style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{b}</span>
            </div>
          ))}
        </GlassCard>
      ))}
    </div>
  )
}

// ── Flashcards ─────────────────────────────────────────────────────────────
export function FlashcardsTab({ cards, error, onRetry, onEarn }) {
  const [idx, setIdx] = useState(0); const [flip, setFlip] = useState(false)
  const [mastered, setMastered] = useState(new Set()); const earned = useRef(false)
  if (!cards?.length) {
    if (error) return <GenerationError message={error} onRetry={onRetry} />
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin color={C.purple} /><p style={{ color: C.muted, marginTop: 16 }}>Creating your flashcard deck...</p></div>
  }

  const card = cards[idx]
  const next = () => { setFlip(false); setIdx((idx + 1) % cards.length) }
  const mark = () => {
    const nm = new Set(mastered); nm.add(idx); setMastered(nm)
    if (!earned.current && nm.size >= Math.ceil(cards.length * 0.5)) { onEarn(30); earned.current = true }
    next()
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Flashcards</h2><span style={{ color: C.muted, fontSize: 13 }}>{mastered.size}/{cards.length} mastered</span></div>
        <Pill color={C.purple}>🃏 {cards.length} Cards</Pill>
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 24, flexWrap: 'wrap' }}>
        {cards.map((_, i) => <div key={i} onClick={() => { setIdx(i); setFlip(false) }} style={{ width: 26, height: 5, borderRadius: 3, background: mastered.has(i) ? C.green : i === idx ? C.purple : C.border, cursor: 'pointer' }} />)}
      </div>
      <div onClick={() => setFlip(!flip)} style={{ cursor: 'pointer', perspective: 1000, marginBottom: 18, height: 220 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${flip ? 180 : 0}deg)`, transition: 'transform 0.55s ease' }}>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: `linear-gradient(135deg,${C.surface},rgba(124,58,237,0.15))`, border: `1px solid ${C.purple}44`, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: 2, marginBottom: 16 }}>QUESTION — TAP TO FLIP</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: C.text, textAlign: 'center', lineHeight: 1.5 }}>{card.front}</p>
          </div>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: `linear-gradient(135deg,${C.surface},rgba(16,185,129,0.15))`, border: `1px solid ${C.green}44`, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: 2, marginBottom: 16 }}>ANSWER</div>
            <p style={{ fontSize: 15, color: C.text, textAlign: 'center', lineHeight: 1.7 }}>{card.back}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setIdx((idx - 1 + cards.length) % cards.length); setFlip(false) }} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 18px', color: C.muted, cursor: 'pointer', fontSize: 13 }}>← Prev</button>
        {flip && <button onClick={mark} style={{ background: C.greenDim, border: `1px solid ${C.green}44`, borderRadius: 10, padding: '9px 18px', color: C.green, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✓ Got it!</button>}
        <button onClick={() => setFlip(!flip)} style={{ background: C.purpleDim, border: `1px solid ${C.purple}44`, borderRadius: 10, padding: '9px 18px', color: C.purple, cursor: 'pointer', fontSize: 13 }}>{flip ? 'Hide' : 'Show Answer'}</button>
        <button onClick={next} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 18px', color: C.muted, cursor: 'pointer', fontSize: 13 }}>Next →</button>
      </div>
      <p style={{ textAlign: 'center', color: C.dim, fontSize: 12, marginTop: 12 }}>{idx + 1} of {cards.length}</p>
    </div>
  )
}

// ── Quiz ───────────────────────────────────────────────────────────────────
export function QuizTab({ questions, error, onRetry, onEarn }) {
  const [qi, setQi] = useState(0); const [sel, setSel] = useState(null)
  const [ans, setAns] = useState({}); const [done, setDone] = useState(false); const earned = useRef(false)
  if (!questions?.length) {
    if (error) return <GenerationError message={error} onRetry={onRetry} />
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin color={C.cyan} /><p style={{ color: C.muted, marginTop: 16 }}>Building your quiz...</p></div>
  }

  const q = questions[qi]
  const score = Object.entries(ans).filter(([i, a]) => questions[i]?.correct === a).length
  const pct = Math.round(score / questions.length * 100)
  const choose = opt => { if (sel !== null) return; setSel(opt); setAns({ ...ans, [qi]: opt }) }
  const nextQ = () => {
    if (qi < questions.length - 1) { setQi(qi + 1); setSel(ans[qi + 1] ?? null) }
    else { setDone(true); if (!earned.current) { onEarn(pct >= 70 ? 50 : 20); earned.current = true } }
  }

  if (done) {
    const g = pct >= 90 ? { e: '🏆', l: 'Outstanding!', c: C.gold } : pct >= 70 ? { e: '🎉', l: 'Great Job!', c: C.green } : { e: '💪', l: 'Keep Practicing', c: C.cyan }
    return (
      <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease', padding: '32px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{g.e}</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}><GradText>{g.l}</GradText></h2>
        <div style={{ fontSize: 44, fontWeight: 900, color: g.c, marginBottom: 6 }}>{pct}%</div>
        <p style={{ color: C.muted, marginBottom: 28 }}>{score}/{questions.length} correct</p>
        <button onClick={() => { setQi(0); setSel(null); setAns({}); setDone(false); earned.current = false }} style={{ background: C.grad, border: 'none', color: '#fff', padding: '11px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, marginBottom: 32 }}>Retake Quiz</button>
        <div style={{ textAlign: 'left' }}>
          {questions.map((q, i) => { const ok = ans[i] === q.correct; return (
            <GlassCard key={i} style={{ marginBottom: 8, borderLeft: `3px solid ${ok ? C.green : C.red}`, padding: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>{ok ? '✅' : '❌'}</span>
                <div><p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{q.question}</p>
                {!ok && <p style={{ color: C.muted, fontSize: 12 }}>Correct: <span style={{ color: C.green }}>{q.correct}</span></p>}
                {q.explanation && <p style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>{q.explanation}</p>}</div>
              </div>
            </GlassCard>
          )})}
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ fontSize: 20, fontWeight: 800 }}>Quiz Challenge</h2><Pill color={C.cyan}>{qi + 1}/{questions.length}</Pill></div>
      <div style={{ background: C.border, borderRadius: 100, height: 4, marginBottom: 24, overflow: 'hidden' }}><div style={{ width: `${qi / questions.length * 100}%`, height: '100%', background: C.gradCyan, transition: 'width 0.3s' }} /></div>
      <GlassCard style={{ marginBottom: 18, borderLeft: `3px solid ${C.cyan}` }}><p style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.6, margin: 0 }}>{q.question}</p></GlassCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {q.options.map((opt, i) => {
          const isSel = sel === opt, isOk = q.correct === opt, show = sel !== null
          let bg = C.glass, brd = C.border, col = C.text
          if (show && isOk) { bg = C.greenDim; brd = C.green + '66'; col = C.green }
          else if (show && isSel && !isOk) { bg = C.redDim; brd = C.red + '66'; col = C.red }
          else if (isSel) { bg = C.primaryDim; brd = C.primary + '66' }
          return (
            <button key={i} onClick={() => choose(opt)} style={{ background: bg, border: `1px solid ${brd}`, borderRadius: 12, padding: '13px 16px', color: col, textAlign: 'left', cursor: sel ? 'default' : 'pointer', fontSize: 14, fontWeight: isSel || (show && isOk) ? 600 : 400, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: brd, border: `1px solid ${brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1 }}>{opt}</span>
              {show && isOk && <CheckCircle size={15} style={{ color: C.green, flexShrink: 0 }} />}
              {show && isSel && !isOk && <XCircle size={15} style={{ color: C.red, flexShrink: 0 }} />}
            </button>
          )
        })}
      </div>
      {sel && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          {q.explanation && <p style={{ color: C.muted, fontSize: 13, padding: '12px 0', lineHeight: 1.7 }}>💡 {q.explanation}</p>}
          <button onClick={nextQ} style={{ background: C.grad, border: 'none', color: '#fff', padding: 12, borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, width: '100%', marginTop: 6 }}>{qi < questions.length - 1 ? 'Next Question →' : 'See Results →'}</button>
        </div>
      )}
    </div>
  )
}

// ── Mind Map ───────────────────────────────────────────────────────────────
function countLeaves(n) { if (!n.children?.length) return 1; return n.children.reduce((s, c) => s + countLeaves(c), 0) }
function layoutTree(node, x, sy, ey, levelW = 180) {
  const leaves = countLeaves(node), y = (sy + ey) / 2
  const out = { ...node, x, y, leaves, children: [] }
  if (node.children?.length) {
    let cy = sy
    node.children.forEach(c => { const cl = countLeaves(c), h = (cl / leaves) * (ey - sy); out.children.push(layoutTree(c, x + levelW, cy, cy + h, levelW)); cy += h })
  }
  return out
}
function flatTree(node, nodes = [], edges = []) {
  nodes.push(node)
  ;(node.children || []).forEach(c => { edges.push({ from: node, to: c }); flatTree(c, nodes, edges) })
  return { nodes, edges }
}
const BRANCH_COLORS = [C.primary, C.cyan, C.green, C.gold, C.pink, C.orange, C.purple]
const nodeBoxSize = (label, isRoot) => ({
  w: Math.max((label || '').length * 7 + 20, 80),
  h: isRoot ? 38 : 30,
})

export function MindMapTab({ mindmap, error, onRetry, onEarn }) {
  const [scale, setScale] = useState(1); const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false); const [start, setStart] = useState(null); const earned = useRef(false)
  useEffect(() => { if (mindmap && !earned.current) { onEarn(20); earned.current = true } }, [mindmap])

  if (!mindmap) {
    if (error) return <GenerationError message={error} onRetry={onRetry} />
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin color={C.pink} /><p style={{ color: C.muted, marginTop: 16 }}>Generating your mind map...</p></div>
  }

  const H = 420
  const laid = layoutTree(mindmap, 60, 20, H - 20, 180)
  const { nodes, edges } = flatTree(laid)
  const colorMap = {}
  ;(laid.children || []).forEach((c, i) => {
    const col = BRANCH_COLORS[i % BRANCH_COLORS.length]
    const setColor = (n, color) => { colorMap[n.label] = color; (n.children || []).forEach(ch => setColor(ch, color)) }
    setColor(c, col)
  })
  colorMap[mindmap.label || 'Root'] = C.primaryL
  const getColor = label => colorMap[label] || C.primaryL

  // Bounding box over every node's ACTUAL box (label-length-aware), so the
  // viewBox below always contains the whole tree — no more guessing a fixed
  // width and clipping whatever doesn't fit.
  const boxes = nodes.map((n, i) => ({ n, ...nodeBoxSize(n.label, i === 0) }))
  const minX = Math.min(...boxes.map(b => b.n.x - b.w / 2)) - 24
  const maxX = Math.max(...boxes.map(b => b.n.x + b.w / 2)) + 24
  const minY = Math.min(...boxes.map(b => b.n.y - b.h / 2)) - 24
  const maxY = Math.max(...boxes.map(b => b.n.y + b.h / 2)) + 24
  const vbW = maxX - minX
  const vbH = maxY - minY

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Mind Map</h2><p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Drag to pan, zoom to explore</p></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setScale(s => Math.min(s + 0.2, 2))} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.muted, cursor: 'pointer' }}>+</button>
          <button onClick={() => setScale(1)} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.muted, cursor: 'pointer', fontSize: 12 }}>Reset</button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.muted, cursor: 'pointer' }}>−</button>
        </div>
      </div>
      <div style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', position: 'relative', height: H }}
        onMouseDown={e => { setDragging(true); setStart({ x: e.clientX - drag.x, y: e.clientY - drag.y }) }}
        onMouseMove={e => { if (dragging && start) setDrag({ x: e.clientX - start.x, y: e.clientY - start.y }) }}
        onMouseUp={() => { setDragging(false); setStart(null) }}
        onMouseLeave={() => { setDragging(false); setStart(null) }}>
        <svg viewBox={`${minX} ${minY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ cursor: dragging ? 'grabbing' : 'grab', display: 'block' }}>
          <g transform={`translate(${drag.x},${drag.y}) scale(${scale})`}>
            {edges.map((e, i) => {
              const mx = (e.from.x + e.to.x) / 2, col = getColor(e.to.label)
              return <path key={i} d={`M${e.from.x},${e.from.y} C${mx},${e.from.y} ${mx},${e.to.y} ${e.to.x},${e.to.y}`} fill="none" stroke={col} strokeWidth={1.5} strokeOpacity={0.5} />
            })}
            {nodes.map((n, i) => {
              const col = getColor(n.label), isRoot = i === 0, label = n.label || ''
              const { w, h } = nodeBoxSize(label, isRoot)
              return (
                <g key={i} transform={`translate(${n.x - w / 2},${n.y - h / 2})`}>
                  <rect width={w} height={h} rx={isRoot ? 10 : 8} fill={isRoot ? 'rgba(99,102,241,0.25)' : col + '22'} stroke={col} strokeWidth={isRoot ? 2 : 1.5} strokeOpacity={0.7} />
                  <text x={w / 2} y={h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={isRoot ? C.primaryL : col} fontSize={isRoot ? 13 : 11} fontWeight={isRoot ? 700 : 600} fontFamily="system-ui,sans-serif">{label}</text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {(laid.children || []).map((c, i) => <Pill key={i} color={BRANCH_COLORS[i % BRANCH_COLORS.length]}>{c.label}</Pill>)}
      </div>
    </div>
  )
}

// ── Progress ───────────────────────────────────────────────────────────────
export function ProgressTab({ xp, badges, startTime, tabsRef }) {
  const level = Math.floor(xp / 100) + 1
  const mins = Math.floor((Date.now() - startTime) / 60000)
  const allBadges = [
    { id: 'first', icon: '🎬', label: 'First Video', earned: true },
    { id: 'notes', icon: '📖', label: 'Note Taker', earned: badges.has('notes') },
    { id: 'flashcards', icon: '🃏', label: 'Card Master', earned: badges.has('flashcards') },
    { id: 'quiz', icon: '🏆', label: 'Quiz Champion', earned: badges.has('quiz') },
    { id: 'chat', icon: '💬', label: 'Seeker', earned: badges.has('chat') },
    { id: 'mindmap', icon: '🗺️', label: 'Explorer', earned: badges.has('mindmap') },
    { id: 'interview', icon: '💼', label: 'Pro Prepper', earned: badges.has('interview') },
    { id: 'exam', icon: '📝', label: 'Exam Ready', earned: badges.has('exam') },
  ]
  const earned = allBadges.filter(b => b.earned)

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Your Progress</h2>
      <GlassCard style={{ marginBottom: 14, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.08))', border: `1px solid ${C.primary}33` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div><div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Total XP Earned</div><div style={{ fontSize: 40, fontWeight: 900, background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{xp} XP</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ width: 56, height: 56, borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 4px' }}>{level}</div><div style={{ fontSize: 10, color: C.muted }}>Level</div></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 7, overflow: 'hidden' }}><div style={{ width: `${xp % 100}%`, height: '100%', background: C.grad, borderRadius: 100, transition: 'width 1s ease' }} /></div>
        <p style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>{100 - (xp % 100)} XP to Level {level + 1}</p>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
        {[{ label: 'Badges', value: earned.length, icon: '🏅', color: C.gold }, { label: 'Features', value: badges.size + 1, icon: '✅', color: C.green }, { label: 'Min Studied', value: mins, icon: '⏱', color: C.cyan }, { label: 'Level', value: level, icon: '⭐', color: C.primary }].map(({ label, value, icon, color }) => (
          <GlassCard key={label} style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{label}</div>
          </GlassCard>
        ))}
      </div>

      {tabsRef && (
        <GlassCard style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Activity Completion</div>
          {tabsRef.filter(t => t.id !== 'progress').map(t => {
            const done = t.id === 'notes' ? true : badges.has(t.id)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ color: t.color, flexShrink: 0, width: 14, textAlign: 'center' }}>●</span>
                <span style={{ color: C.muted, fontSize: 13, flex: 1 }}>{t.label}</span>
                <div style={{ width: 100, height: 5, background: C.border, borderRadius: 100, overflow: 'hidden' }}><div style={{ width: done ? '100%' : '0%', height: '100%', background: t.color, borderRadius: 100, transition: 'width 1s ease' }} /></div>
                <span style={{ fontSize: 11, color: done ? t.color : C.dim, width: 24, textAlign: 'right' }}>{done ? '✓' : '–'}</span>
              </div>
            )
          })}
        </GlassCard>
      )}

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Achievements</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
        {allBadges.map(b => (
          <GlassCard key={b.id} style={{ textAlign: 'center', padding: '14px 10px', opacity: b.earned ? 1 : 0.4, border: `1px solid ${b.earned ? C.gold + '44' : C.border}` }}>
            <div style={{ fontSize: 26, marginBottom: 6, filter: b.earned ? 'none' : 'grayscale(1)', WebkitFilter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: b.earned ? C.text : C.dim, marginBottom: 3 }}>{b.label}</div>
            <div style={{ fontSize: 10, color: b.earned ? C.gold : C.dim }}>{b.earned ? '✓ Earned' : 'Locked'}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}