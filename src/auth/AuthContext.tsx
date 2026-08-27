// Contexte d'authentification — httpOnly cookies, pas de localStorage.
// Le cookie gt_session est géré par le serveur ; le client ne le voit jamais.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { idbClearAll } from '../db/idb'
import { resetSyncCursor, setSyncUserId } from '../db/sync'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

// ── Contexte ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Vérifie la session au démarrage (cookie httpOnly → GET /auth/me)
  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((u: AuthUser | null) => {
        if (u) {
          setSyncUserId(u.id)
          setUser(u)
        }
      })
      .catch(() => { /* réseau indisponible — on reste non connecté */ })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { id?: number; email?: string; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Erreur de connexion')

    // Nouveau compte : efface l'IDB locale et repart de zéro
    await idbClearAll()
    resetSyncCursor()
    setSyncUserId(data.id!)
    setUser({ id: data.id!, email: data.email! })
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    setError(null)
    const res = await fetch('/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { id?: number; email?: string; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Erreur lors de l\'inscription')

    await idbClearAll()
    resetSyncCursor()
    setSyncUserId(data.id!)
    setUser({ id: data.id!, email: data.email! })
  }, [])

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    await idbClearAll()
    resetSyncCursor()
    setSyncUserId(null)
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}
