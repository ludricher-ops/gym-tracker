// Contexte d'authentification — httpOnly cookies, pas de localStorage.
// Le cookie gt_session est géré par le serveur ; le client ne le voit jamais.
//
// Optimisation UX : l'identité de l'utilisateur est mise en cache dans
// localStorage (clé 'gymtrack-user'). Au démarrage, si le cache existe,
// l'AppShell monte immédiatement avec les données IDB — sans attendre /auth/me.
// La vérification réseau se fait en arrière-plan ; si elle échoue (401 / hors
// ligne), on efface le cache et on bascule sur l'écran de login.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { idbClearAll } from '../db/idb'
import { resetSyncCursor, resetSharedCursor, setSyncUserId } from '../db/sync'

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

// ── Cache localStorage ────────────────────────────────────────────────────────

const USER_CACHE_KEY = 'gymtrack-user'

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'id' in parsed && typeof (parsed as Record<string, unknown>).id === 'number' &&
      'email' in parsed && typeof (parsed as Record<string, unknown>).email === 'string'
    ) {
      return parsed as AuthUser
    }
    return null
  } catch {
    return null
  }
}

function writeCachedUser(u: AuthUser): void {
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u)) } catch { /* quota */ }
}

function clearCachedUser(): void {
  try { localStorage.removeItem(USER_CACHE_KEY) } catch { /* quota */ }
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
  // Démarrage optimiste : si on a un utilisateur en cache, on monte l'app
  // immédiatement. loading reste true uniquement si on n'a AUCUN cache.
  const cachedUser = readCachedUser()
  const [user, setUser] = useState<AuthUser | null>(cachedUser)
  const [loading, setLoading] = useState(cachedUser === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedUser) {
      // Utilisateur déjà connu : synchronise l'ID pour le module sync.
      setSyncUserId(cachedUser.id)
    }

    // Vérification réseau en arrière-plan (cookie httpOnly → GET /auth/me).
    // Si le serveur confirme → met à jour l'email au cas où il aurait changé.
    // Si le cookie est expiré (401) → bascule sur l'écran de login.
    // Si hors ligne → ne rien faire (l'app reste accessible avec les données IDB).
    fetch('/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : r.status === 401 ? null : Promise.reject()))
      .then((u: AuthUser | null) => {
        if (u) {
          setSyncUserId(u.id)
          writeCachedUser(u)
          setUser(u)
        } else if (u === null) {
          // 401 explicite : session expirée, cookie invalide.
          clearCachedUser()
          setSyncUserId(null)
          setUser(null)
        }
        // u === undefined (réseau ko) → on ne touche pas à l'état courant
      })
      .catch(() => {
        // Réseau indisponible — l'app reste fonctionnelle en mode offline avec
        // les données IDB. L'état courant (user du cache) est conservé.
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    await idbClearAll()
    resetSyncCursor()
    resetSharedCursor()
    const u: AuthUser = { id: data.id!, email: data.email! }
    setSyncUserId(u.id)
    writeCachedUser(u)
    setUser(u)
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
    resetSharedCursor()
    const u: AuthUser = { id: data.id!, email: data.email! }
    setSyncUserId(u.id)
    writeCachedUser(u)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    await idbClearAll()
    resetSyncCursor()
    resetSharedCursor()
    clearCachedUser()
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
