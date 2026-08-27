import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'

type Mode = 'login' | 'register'

export function LoginScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register(email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '24px',
      background: 'var(--bg)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 8v8M9 6.5v11M15 6.5v11M17.5 8v8M9 12h6" />
          </svg>
        </div>
        <p className="t-display" style={{ marginBottom: 2 }}>Gym Tracker</p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)' }}>
          {mode === 'login' ? 'Connectez-vous pour continuer' : 'Créer un compte'}
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div>
          <label className="t-caption" style={{ color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--fg)',
              fontSize: 'var(--fs-body)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label className="t-caption" style={{ color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'Min. 6 caractères' : '••••••••'}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--fg)',
              fontSize: 'var(--fs-body)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="t-caption" style={{ color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--fg)',
                fontSize: 'var(--fs-body)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {error && (
          <p className="t-caption" style={{
            color: 'var(--danger-ink)',
            background: 'color-mix(in srgb, var(--danger-ink) 12%, transparent)',
            padding: '10px 14px',
            borderRadius: 8,
            margin: 0,
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            padding: '14px',
            borderRadius: 10,
            border: 'none',
            background: loading ? 'var(--fg-muted)' : 'var(--accent)',
            color: 'var(--bg)',
            fontSize: 'var(--fs-body)',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? (mode === 'login' ? 'Connexion…' : 'Inscription…')
            : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
        </button>
      </form>

      {/* Toggle login / register */}
      <p className="t-caption" style={{ marginTop: 24, color: 'var(--fg-muted)', textAlign: 'center' }}>
        {mode === 'login' ? "Pas encore de compte ? " : 'Déjà un compte ? '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 600,
          }}
        >
          {mode === 'login' ? "S'inscrire" : 'Se connecter'}
        </button>
      </p>
    </div>
  )
}
