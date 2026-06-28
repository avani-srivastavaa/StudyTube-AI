import { useState } from 'react'
import { Zap, Mail, Lock, User as UserIcon } from 'lucide-react'
import { C, GradText, Particles, GLOBAL_KEYFRAMES } from '../components/ui'

export default function AuthPage({ auth, onContinueAsGuest }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email.trim() || !password.trim()) { auth.setError('Please enter both email and password'); return }
    setBusy(true)
    if (mode === 'signin') await auth.signInEmail(email.trim(), password)
    else await auth.signUpEmail(email.trim(), password, name.trim())
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 24 }}>
      <style>{GLOBAL_KEYFRAMES}</style>
      <Particles />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, animation: 'fadeUp 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Zap size={22} style={{ color: '#fff' }} /></div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}><GradText>StudyTube AI</GradText></h1>
          <p style={{ color: C.muted, fontSize: 13 }}>{mode === 'signin' ? 'Welcome back — sign in to continue' : 'Create an account to save your progress'}</p>
        </div>

        <div style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, backdropFilter: 'blur(20px)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); auth.setError('') }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: mode === m ? C.primaryDim : 'transparent', color: mode === m ? C.primaryL : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
              <UserIcon size={15} style={{ color: C.dim }} />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13 }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <Mail size={15} style={{ color: C.dim }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <Lock size={15} style={{ color: C.dim }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Password (min 6 characters)" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 13 }} />
          </div>

          {auth.error && <p style={{ color: auth.error.includes('Check your email') ? C.green : C.red, fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>{auth.error}</p>}

          <button onClick={submit} disabled={busy} style={{ width: '100%', background: C.grad, border: 'none', color: '#fff', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 12, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ color: C.dim, fontSize: 11 }}>OR</span><div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <button onClick={auth.signInGoogle} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, padding: 11, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <button onClick={onContinueAsGuest} style={{ width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 12, cursor: 'pointer', padding: 6 }}>
            Continue as guest (progress won't be saved) →
          </button>
        </div>
      </div>
    </div>
  )
}
