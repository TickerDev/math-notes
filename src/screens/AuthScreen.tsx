import { useState } from 'react'
import type { FormEvent } from 'react'
import katex from 'katex'
import { LoaderCircle } from 'lucide-react'
import { Brand } from '../components/Brand'
import { supabase } from '../lib/supabase'

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (result.error) {
      setStatus('error')
      setMessage(result.error.message)
      return
    }

    setStatus('success')
    setMessage(mode === 'signup' && !result.data.session
      ? 'Check your email to confirm your account, then sign in.'
      : 'Opening your documents…')
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setMessage('')
    setStatus('idle')
  }

  return (
    <main className="auth-shell">
      <header className="auth-header"><Brand /><span>Account by dorelboim.com</span></header>
      <section className="auth-layout">
        <div className="auth-statement">
          <h1>Ideas arrive in words.<br /><em>Keep them as math.</em></h1>
          <p>Write naturally, turn spoken mathematics into precise notation, and keep every line of reasoning in its own document.</p>
          <div className="auth-proof" aria-hidden="true">
            <span>“integral from a to b”</span><i />
            <strong dangerouslySetInnerHTML={{ __html: katex.renderToString('\\int_a^b') }} />
          </div>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="proof-mark">A</span>
            <div>
              <h2>{mode === 'signin' ? 'Continue with dorelboim.com' : 'Create a dorelboim.com account'}</h2>
              <p>{mode === 'signin' ? 'One account for Mathnotes and your other apps.' : 'Your account works everywhere on dorelboim.com.'}</p>
            </div>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required placeholder="At least 8 characters" /></label>
            {message && <p className={`auth-message ${status}`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
            <button className="primary-button auth-submit" disabled={status === 'loading'}>
              {status === 'loading' && <LoaderCircle className="spin" size={17} />}
              {status === 'loading' ? 'Please wait' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <button className="auth-switch" onClick={switchMode}>{mode === 'signin' ? 'New to dorelboim.com? Create an account' : 'Already have a dorelboim.com account? Sign in'}</button>
        </div>
      </section>
    </main>
  )
}
