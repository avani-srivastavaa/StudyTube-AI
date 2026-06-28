import { useState } from 'react'
import { Plus, X, Zap } from 'lucide-react'
import { C } from './ui'

export default function VideoSwitcher({ openVideos, activeVideoId, onSwitch, onClose, onAddVideo }) {
  const [adding, setAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')

  const ids = Object.keys(openVideos)

  const submit = () => {
    if (!url.trim()) { setErr('Paste a YouTube URL'); return }
    if (!/youtu\.?be/.test(url)) { setErr("That doesn't look like a YouTube URL"); return }
    onAddVideo(url.trim())
    setUrl(''); setErr(''); setAdding(false)
  }

  if (ids.length <= 1 && !adding) {
    // Only one video open — still show a slim "+ Analyze another video" entry
    // point so the feature is discoverable without cluttering single-video use.
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '12px 16px 0' }}>
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.glass, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 14px', color: C.muted, cursor: 'pointer', fontSize: 12 }}>
          <Plus size={13} /> Analyze another video
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '12px 16px 0' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }}>
        {ids.map(id => {
          const v = openVideos[id].video
          const active = id === activeVideoId
          return (
            <button key={id} onClick={() => onSwitch(id)} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: active ? C.primaryDim : C.glass, border: `1px solid ${active ? C.primary + '66' : C.border}`, borderRadius: 10, padding: '6px 10px 6px 6px', cursor: 'pointer', maxWidth: 220 }}>
              <img src={v.thumbnail || `https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" onError={e => { e.target.style.display = 'none' }} style={{ width: 32, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.primaryL : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title || 'Video'}</span>
              {ids.length > 1 && (
                <span onClick={e => { e.stopPropagation(); onClose(id) }} style={{ display: 'flex', color: C.dim, flexShrink: 0, padding: 2 }}>
                  <X size={12} />
                </span>
              )}
            </button>
          )
        })}

        {!adding ? (
          <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.glass, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '8px 12px', color: C.muted, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
            <Plus size={13} /> Add
          </button>
        ) : null}
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, background: C.glass, border: `1px solid ${err ? C.red : C.borderBright}`, borderRadius: 10, padding: '5px 5px 5px 12px', animation: 'fadeUp 0.2s ease' }}>
          <input
            autoFocus
            value={url}
            onChange={e => { setUrl(e.target.value); setErr('') }}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Paste another YouTube URL to analyze..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13, padding: '7px 0' }}
          />
          <button onClick={submit} style={{ background: C.grad, border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Zap size={12} /> Analyze
          </button>
          <button onClick={() => { setAdding(false); setErr('') }} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', padding: '0 8px' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {err && <p style={{ color: C.red, fontSize: 12, marginTop: 6 }}>⚠ {err}</p>}
    </div>
  )
}