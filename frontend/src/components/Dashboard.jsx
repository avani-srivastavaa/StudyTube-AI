import { useState } from 'react'
import { BookOpen, Layers, Target, MessageCircle, Map, Award, GraduationCap, BarChart2, Zap, Flame, Home } from 'lucide-react'
import { C, GlassCard, Pill, XPBar, Nova } from './ui'
import { NotesTab, FlashcardsTab, QuizTab, MindMapTab, ProgressTab } from './tabs'
import { ChatTab, InterviewTab, ExamTab } from './tabs-live'

export const TABS = [
  { id: 'notes', label: 'Notes', icon: BookOpen, color: C.primary },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, color: C.purple },
  { id: 'quiz', label: 'Quiz', icon: Target, color: C.cyan },
  { id: 'chat', label: 'AI Tutor', icon: MessageCircle, color: C.green },
  { id: 'mindmap', label: 'Mind Map', icon: Map, color: C.pink },
  { id: 'interview', label: 'Interview', icon: Award, color: C.gold },
  { id: 'exam', label: 'Exam Mode', icon: GraduationCap, color: C.orange },
  { id: 'progress', label: 'Progress', icon: BarChart2, color: C.primaryL || C.primary },
]

const STUDY_MODES = [
  { id: 'explorer', icon: '🗺️', label: 'Explorer Mode', desc: 'Unlock everything. Explore notes, cards, quiz, and chat at your own pace.', color: C.primary },
  { id: 'exam', icon: '📝', label: 'Exam Mode', desc: 'Focused on quiz & flashcards, geared toward exam readiness.', color: C.cyan },
  { id: 'interview', icon: '💼', label: 'Interview Mode', desc: 'Practice interview-style questions with model answers.', color: C.gold },
  { id: 'revision', icon: '⚡', label: 'Quick Revision', desc: 'Rapid notes + mind map only — for last-minute prep.', color: C.green },
]

function ModeSelector({ onSelect }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,1,16,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌟</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 8 }}>Choose Your Study Mode</h2>
          <p style={{ color: C.muted, fontSize: 14 }}>Select how you'd like to learn today. You can always switch later.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {STUDY_MODES.map(m => (
            <GlassCard key={m.id} onClick={() => onSelect(m.id)} style={{ border: `1px solid ${m.color}33`, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.label}</div>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({
  video, notes, flashcards, quiz, mindmap, transcript, xp, onEarnXP, badges, startTime,
  genErrors = {}, onRetry,
  interview, interviewLoading, interviewError, onGenerateInterview,
  examSheet, examLoading, examError, onGenerateExam,
  chatMessages, chatSending, onSendChat,
  onGoHome,
}) {
  const [tab, setTab] = useState('notes')
  const [modeChosen, setModeChosen] = useState(false)
  const [mode, setMode] = useState('explorer')

  const handleMode = m => {
    setMode(m); setModeChosen(true)
    setTab({ explorer: 'notes', exam: 'quiz', interview: 'interview', revision: 'notes' }[m] || 'notes')
  }

  const visibleTabs = mode === 'exam' ? ['notes', 'flashcards', 'quiz', 'progress']
    : mode === 'interview' ? ['notes', 'interview', 'chat', 'progress']
    : mode === 'revision' ? ['notes', 'mindmap', 'progress']
    : TABS.map(t => t.id)

  const earn = (pts, badge) => { onEarnXP(pts, badge); if (badge) badges.add(badge) }
  const modeInfo = STUDY_MODES.find(m => m.id === mode)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif' }}>
      {!modeChosen && <ModeSelector onSelect={handleMode} />}

      <div style={{ background: `${C.surface}cc`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '13px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={12} style={{ color: '#fff' }} /></div>
          <span style={{ fontWeight: 800, fontSize: 15, background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyTube AI</span>
          {onGoHome && (
            <button onClick={onGoHome} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.glass, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', color: C.muted, cursor: 'pointer', fontSize: 12, marginLeft: 6 }}>
              <Home size={12} /> Home
            </button>
          )}
        </div>
        <div style={{ flex: 1, maxWidth: 280, margin: '0 16px' }}><XPBar xp={xp} level={Math.floor(xp / 100) + 1} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.goldDim, borderRadius: 8, padding: '4px 10px' }}>
            <Flame size={12} style={{ color: C.gold }} /><span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>1 Streak</span>
          </div>
          {modeInfo && <Pill color={modeInfo.color}>{modeInfo.icon} {modeInfo.label}</Pill>}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>
        <GlassCard style={{ marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
          <img src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt="" onError={e => { e.target.style.display = 'none' }} style={{ width: 96, height: 66, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</h2>
            <div style={{ display: 'flex', gap: 12, color: C.muted, fontSize: 12, flexWrap: 'wrap' }}>
              <span>📺 {video.channel}</span><span>⏱ {video.duration}</span>
              {video.wordCount && <span>📝 {video.wordCount.toLocaleString()} words analyzed</span>}
            </div>
          </div>
          <Pill color={C.green}>✓ Fully Analyzed</Pill>
        </GlassCard>

        <div style={{ display: 'flex', gap: 4, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.filter(t => visibleTabs.includes(t.id)).map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: `1px solid ${tab === id ? color + '55' : 'transparent'}`, background: tab === id ? `${color}18` : C.glass, color: tab === id ? color : C.muted, cursor: 'pointer', fontSize: 12, fontWeight: tab === id ? 700 : 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {/* No key={tab} here deliberately — every tab below is fed entirely
            by props owned by App.jsx (per active video), so nothing is lost
            when React swaps which one is visible, and nothing is lost when
            switching to a different open video either (each video's data
            lives in App.jsx's openVideos map, not in any tab's local state). */}
        <div>
          {tab === 'notes' && <NotesTab notes={notes} error={genErrors.notes} onRetry={() => onRetry?.('notes')} onEarn={p => earn(p, 'notes')} />}
          {tab === 'flashcards' && <FlashcardsTab cards={flashcards} error={genErrors.flashcards} onRetry={() => onRetry?.('flashcards')} onEarn={p => earn(p, 'flashcards')} />}
          {tab === 'quiz' && <QuizTab questions={quiz} error={genErrors.quiz} onRetry={() => onRetry?.('quiz')} onEarn={p => earn(p, 'quiz')} />}
          {tab === 'chat' && <ChatTab messages={chatMessages} sending={chatSending} onSend={onSendChat} onEarn={p => earn(p, 'chat')} />}
          {tab === 'mindmap' && <MindMapTab mindmap={mindmap} error={genErrors.mindmap} onRetry={() => onRetry?.('mindmap')} onEarn={p => earn(p, 'mindmap')} />}
          {tab === 'interview' && <InterviewTab items={interview} loading={interviewLoading} error={interviewError} onGenerate={onGenerateInterview} onEarn={p => earn(p, 'interview')} />}
          {tab === 'exam' && <ExamTab sheet={examSheet} loading={examLoading} error={examError} onGenerate={onGenerateExam} onEarn={p => earn(p, 'exam')} />}
          {tab === 'progress' && <ProgressTab xp={xp} badges={badges} startTime={startTime} tabsRef={TABS} />}
        </div>
      </div>

      <Nova xp={xp} />
    </div>
  )
}