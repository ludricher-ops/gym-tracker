// Panneau d'administration — accessible uniquement à l'utilisateur id=1.

import { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { Card, Icon } from '../ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GroupInfo { name: string; code: string; display_name: string }

interface AdminUser {
  id: number
  email: string
  created_at: string
  last_login_at: string | null
  sessions: number
  sets: number
  prs: number
  exercises_used: number
  last_sync_ms: number
  groups: GroupInfo[]
}

interface GlobalStats {
  total_users: number
  total_sessions: number
  total_sets: number
  total_prs: number
  total_groups: number
  total_members: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...opts })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Erreur ${res.status}`)
  return json
}

function formatAgo(ms: number | null | undefined): string {
  if (!ms) return 'jamais'
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

function formatSync(ms: number) { return formatAgo(ms) }

function formatLogin(iso: string | null): string {
  if (!iso) return 'jamais'
  return formatAgo(new Date(iso).getTime())
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function AdminScreen() {
  const nav = useNavigation()

  const [users,       setUsers]       = useState<AdminUser[]>([])
  const [stats,       setStats]       = useState<GlobalStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [migRunning,  setMigRunning]  = useState(false)
  const [migResult,   setMigResult]   = useState<string | null>(null)
  const [expanded,    setExpanded]    = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [usersData, statsData] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/stats'),
      ])
      setUsers(usersData.users ?? [])
      setStats(statsData)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const runMigration = async () => {
    setMigRunning(true); setMigResult(null)
    try {
      const r = await apiFetch('/api/admin/fix-first-pr', { method: 'POST' })
      setMigResult(`✓ ${r.firstSets} premières séries — ${r.fixedSets} corrigées, ${r.fixedPRs} PR supprimés`)
      void load()
    } catch (e) { setMigResult(`✗ ${e instanceof Error ? e.message : 'Erreur'}`) }
    finally { setMigRunning(false) }
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">ADMIN</div>
          <h1 className="gt-topbar__title" style={{ fontSize: 'var(--fs-title)' }}>Panneau admin</h1>
        </div>
      </div>

      <div className="gt-screen__scroll">
        {error && <p className="t-caption" style={{ color: 'var(--danger)' }}>{error}</p>}
        {loading && <p className="t-caption" style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: 24 }}>Chargement…</p>}

        {/* Stats globales */}
        {stats && (
          <>
            <p className="t-eyebrow">Statistiques globales</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                ['👤', stats.total_users,    'Utilisateurs'],
                ['🏋️', stats.total_sessions, 'Séances'],
                ['⚡', stats.total_sets,     'Séries'],
                ['🏅', stats.total_prs,      'Records'],
                ['🏆', stats.total_groups,   'Groupes'],
                ['🤝', stats.total_members,  'Membres'],
              ].map(([emoji, val, label]) => (
                <Card key={label as string} style={{ textAlign: 'center', padding: '10px 6px' }}>
                  <div style={{ fontSize: 18 }}>{emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{(val as number).toLocaleString('fr-FR')}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', fontSize: 10 }}>{label}</div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Utilisateurs */}
        {users.length > 0 && (
          <>
            <p className="t-eyebrow">{users.length} utilisateurs</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)', overflow: 'hidden',
                  }}
                >
                  {/* En-tête utilisateur */}
                  <button
                    onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: u.id === 1 ? 'var(--accent)' : 'var(--surface-raised)',
                      color: u.id === 1 ? 'var(--accent-ink)' : 'var(--fg-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15,
                    }}>
                      {u.id}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                        {u.id === 1 && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--accent)', color: 'var(--accent-ink)', padding: '1px 5px', borderRadius: 4 }}>ADMIN</span>}
                      </div>
                      <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>
                        Connecté {formatLogin(u.last_login_at)} · sync {formatSync(u.last_sync_ms)}
                      </div>
                    </div>
                    <span style={{ transform: expanded === u.id ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0, display: 'inline-flex' }}>
                      <Icon name="chevron-right" size={16} />
                    </span>
                  </button>

                  {/* Détails dépliables */}
                  {expanded === u.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                      {/* Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                        {[
                          ['🏋️', u.sessions,       'Séances'],
                          ['⚡', u.sets,            'Séries'],
                          ['🏅', u.prs,             'PRs'],
                          ['💪', u.exercises_used,  'Exercices'],
                        ].map(([emoji, val, label]) => (
                          <div key={label as string} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16 }}>{emoji}</div>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>{val as number}</div>
                            <div className="t-caption" style={{ color: 'var(--fg-muted)', fontSize: 10 }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Groupes */}
                      {u.groups.length > 0 ? (
                        <>
                          <p className="t-eyebrow" style={{ marginTop: 8 }}>Groupes</p>
                          {u.groups.map((g) => (
                            <div key={g.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                              <span style={{ fontSize: 16 }}>🏆</span>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: 'var(--fs-caption)' }}>{g.name}</span>
                                <span className="t-caption" style={{ color: 'var(--fg-muted)', marginLeft: 6 }}>
                                  @{g.display_name} · {g.code}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="t-caption" style={{ color: 'var(--fg-muted)' }}>Aucun groupe</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        <p className="t-eyebrow">Actions</p>
        <Card>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)', marginBottom: 2 }}>
              Correction premières séries PR
            </div>
            <div className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 10 }}>
              Marque la 1re série de chaque exercice comme non-record. À rejouer si de nouveaux utilisateurs ont syncé depuis la dernière migration.
            </div>
            {migResult && (
              <p className="t-caption" style={{ color: migResult.startsWith('✓') ? 'var(--accent)' : 'var(--danger)', marginBottom: 8 }}>
                {migResult}
              </p>
            )}
            <button
              onClick={runMigration}
              disabled={migRunning}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-card)',
                background: 'var(--accent)', color: 'var(--accent-ink)',
                border: 'none', fontWeight: 700, fontSize: 'var(--fs-caption)',
                cursor: migRunning ? 'wait' : 'pointer', opacity: migRunning ? 0.6 : 1,
              }}
            >
              {migRunning ? 'En cours…' : 'Lancer la migration'}
            </button>
          </div>
        </Card>

        <button
          onClick={load}
          style={{
            width: '100%', padding: '10px', marginTop: 4,
            borderRadius: 'var(--radius-card)', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--fg-muted)',
            fontSize: 'var(--fs-caption)', cursor: 'pointer',
          }}
        >
          ↻ Rafraîchir
        </button>
      </div>
    </div>
  )
}
