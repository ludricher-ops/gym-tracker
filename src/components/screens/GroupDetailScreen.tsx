// Détail d'un groupe Rivals — classement, stats membres, saisons.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { useStore } from '../../hooks/useStore'
import { computeStreak } from '../../utils/streak'
import { localDayKey } from '../../utils/dates'
import { Card, Icon } from '../ui'
import type { ScreenProps } from '../../nav/screenRegistry'
import { levelFromXp, rankForLevel, xpToNextLevel } from './rivalsRpg'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  userId: number
  displayName: string
  isMe: boolean
  periodXp: number
  totalXp: number
  sessionCount: number
}

interface FeedEntry {
  display_name: string
  user_id: number
  name: string
  started_at: number
  ended_at: number
  volume_kg: number | null
  set_count: number
}

type Period = 'week' | string

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...opts })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Erreur réseau')
  return json
}

/** Durée en ms → "1h 23min" */
function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

/** Timestamp → "il y a X" ou date courte */
function formatAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function currentMonthPeriod(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatPeriod(p: Period): string {
  if (p === 'week') return 'Semaine en cours'
  const [y, m] = p.split('-')
  const date = new Date(Number(y), Number(m) - 1)
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return p === currentMonthPeriod() ? `${label} (en cours)` : label
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function RankBadge({ rank, size = 20 }: { rank: number; size?: number }) {
  if (rank === 1) return <span style={{ fontSize: size }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: size }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: size }}>🥉</span>
  return (
    <span style={{
      width: size + 8, height: size + 8, borderRadius: '50%',
      background: 'var(--surface-raised)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.65, fontWeight: 700, color: 'var(--fg-muted)', flexShrink: 0,
    }}>
      {rank}
    </span>
  )
}

function FeedCard({ item, myUserId }: { item: FeedEntry; myUserId: number | null }) {
  const isMe = item.user_id === myUserId
  const dur = item.ended_at && item.started_at ? item.ended_at - item.started_at : 0
  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-card)', padding: '10px 14px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isMe ? 'var(--accent)' : 'var(--surface-raised)',
        color: isMe ? 'var(--accent-ink)' : 'var(--fg-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14,
      }}>
        {item.display_name[0]?.toUpperCase() ?? '?'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Ligne 1 : nom + heure */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>
            {isMe ? 'Moi' : item.display_name}
          </span>
          <span className="t-caption" style={{ color: 'var(--fg-muted)', flexShrink: 0 }}>
            {formatAgo(item.ended_at)}
          </span>
        </div>

        {/* Ligne 2 : nom de séance */}
        <div className="t-caption" style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🏋️ {item.name || 'Séance'}
        </div>

        {/* Ligne 3 : stats chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {dur > 0 && (
            <span className="t-caption" style={{
              background: 'var(--surface-raised)', borderRadius: 4, padding: '2px 6px', color: 'var(--fg-muted)',
            }}>
              ⏱ {formatDuration(dur)}
            </span>
          )}
          {item.set_count > 0 && (
            <span className="t-caption" style={{
              background: 'var(--surface-raised)', borderRadius: 4, padding: '2px 6px', color: 'var(--fg-muted)',
            }}>
              ⚡ {item.set_count} séries
            </span>
          )}
          {item.volume_kg != null && item.volume_kg > 0 && (
            <span className="t-caption" style={{
              background: 'var(--surface-raised)', borderRadius: 4, padding: '2px 6px', color: 'var(--fg-muted)',
            }}>
              🏔 {Math.round(item.volume_kg).toLocaleString('fr-FR')} kg
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MemberRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const { level, pct } = xpToNextLevel(entry.totalXp)
  const r = rankForLevel(level)
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: entry.isMe ? 'var(--accent-subtle)' : 'var(--surface)',
        border: `1px solid ${entry.isMe ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '12px 14px',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Ligne principale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RankBadge rank={rank} />

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{
            width: 38, height: 38, borderRadius: '50%',
            background: entry.isMe ? 'var(--accent)' : 'var(--surface-raised)',
            color: entry.isMe ? 'var(--accent-ink)' : 'var(--fg-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15,
          }}>
            {entry.displayName[0]?.toUpperCase() ?? '?'}
          </span>
          <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 14, lineHeight: 1 }}>
            {r.emoji}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontWeight: entry.isMe ? 700 : 600, fontSize: 'var(--fs-body)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {entry.displayName}
            </span>
            {entry.isMe && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'var(--accent)', color: 'var(--accent-ink)',
                padding: '1px 5px', borderRadius: 4, flexShrink: 0,
              }}>MOI</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="t-caption" style={{ color: r.color, fontWeight: 700, flexShrink: 0 }}>
              Niv.{level}
            </span>
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 2 }} />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {entry.periodXp.toLocaleString('fr-FR')}
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', marginLeft: 2 }}>XP</span>
          </div>
          <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>
            {entry.totalXp.toLocaleString('fr-FR')} tot.
          </div>
        </div>
      </div>

      {/* Stats détaillées (expandable) */}
      {expanded && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {[
            ['🏋️', 'Séances', String(entry.sessionCount)],
            ['⚡', 'XP période', entry.periodXp.toLocaleString('fr-FR')],
            ['🌟', 'XP total', entry.totalXp.toLocaleString('fr-FR')],
          ].map(([emoji, label, value]) => (
            <div key={label as string} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
              <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export function GroupDetailScreen({ params }: ScreenProps) {
  const nav  = useNavigation()
  const store = useStore()

  const code        = typeof params?.code        === 'string' ? params.code        : ''
  const groupName   = typeof params?.name        === 'string' ? params.name        : 'Groupe'

  const streak = useMemo(
    () => computeStreak(
      store.sessions.filter((s) => s.endedAt != null).map((s) => localDayKey(s.startedAt)),
    ),
    [store.sessions],
  )


  const [members,   setMembers]   = useState<LeaderboardEntry[]>([])
  const [seasons,   setSeasons]   = useState<string[]>([])
  const [period,    setPeriod]    = useState<Period>(currentMonthPeriod())
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [copied,    setCopied]    = useState(false)
  const [groupId,   setGroupId]   = useState<number | null>(null)
  const [feed,      setFeed]      = useState<FeedEntry[]>([])

  const loadLeaderboard = useCallback(async (p: Period) => {
    setLoading(true); setError(null)
    try {
      const data = await apiFetch(`/api/groups/${code}/leaderboard?period=${p}`)
      setMembers(data.members ?? [])
      setGroupId(data.group?.id ?? null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }, [code])

  useEffect(() => {
    void loadLeaderboard(currentMonthPeriod())
    apiFetch(`/api/groups/${code}/seasons`)
      .then((d) => setSeasons(d.seasons ?? []))
      .catch(() => { /* ignore */ })
    apiFetch(`/api/groups/${code}/feed?limit=20`)
      .then((d) => setFeed(d.feed ?? []))
      .catch(() => { /* ignore — le feed est optionnel */ })
  }, [code, loadLeaderboard])

  const handlePeriodChange = (p: Period) => { setPeriod(p); void loadLeaderboard(p) }

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { /* ignore */ }
  }

  const handleLeave = async () => {
    if (!groupId) return
    if (!window.confirm(`Quitter le groupe « ${groupName} » ?`)) return
    try {
      await apiFetch(`/api/groups/${groupId}/leave`, { method: 'DELETE' })
      nav.back()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
  }

  const sorted = [...members].sort((a, b) => b.periodXp - a.periodXp || b.totalXp - a.totalXp)
  const myEntry = members.find((m) => m.isMe)
  // Niveau calculé depuis le totalXp serveur — agrège tous les appareils, plus complet
  const myLevel = myEntry ? levelFromXp(myEntry.totalXp) : 1
  const periodOptions: Period[] = ['week', ...seasons]

  return (
    <div className="gt-screen">
      {/* Topbar style Dashboard */}
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">RIVALS</div>
          <h1 className="gt-topbar__title" style={{ fontSize: 'var(--fs-title)' }}>
            {groupName}
          </h1>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--gap-tile)',
          background: 'var(--surface)', borderRadius: 'var(--radius-card)',
          padding: 'var(--gap-tile)',
        }}>
          <div style={{ color: streak > 0 ? 'var(--accent)' : 'var(--fg-muted)', display: 'flex' }}>
            <Icon name="flame" size={20} />
          </div>
          <div>
            <div className="t-num gt-stat__label" style={{ lineHeight: 1 }}>{streak}</div>
            <div className="gt-stat__label">JOURS</div>
          </div>
        </div>
      </div>

      <div className="gt-screen__scroll">
        {error && <p className="t-caption" style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</p>}

        {/* Code d'invitation compact */}
        <button
          onClick={copyCode}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '8px 12px',
            borderRadius: 'var(--radius-card)', border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: 'pointer',
            color: copied ? 'var(--accent)' : 'var(--fg-muted)',
          }}
        >
          <Icon name={copied ? 'check' : 'copy'} size={15} />
          <span className="t-caption" style={{ fontWeight: 600 }}>
            {copied ? 'Code copié !' : `Inviter — code ${code}`}
          </span>
        </button>

        {/* Mon niveau */}
        {myEntry && (
          <Card variant="accent">
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 32 }}>{rankForLevel(myLevel).emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                Niv.{myLevel}
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginLeft: 6 }}>
                  {rankForLevel(myLevel).label}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{myEntry.periodXp.toLocaleString('fr-FR')}</div>
                <div className="t-caption" style={{ opacity: 0.8 }}>XP période</div>
              </div>
              <div style={{ width: 1, background: 'var(--accent-ink)', opacity: 0.3 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{myEntry.totalXp.toLocaleString('fr-FR')}</div>
                <div className="t-caption" style={{ opacity: 0.8 }}>XP total</div>
              </div>
              <div style={{ width: 1, background: 'var(--accent-ink)', opacity: 0.3 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{myEntry.sessionCount}</div>
                <div className="t-caption" style={{ opacity: 0.8 }}>Séances</div>
              </div>
            </div>
          </Card>
        )}

        {/* Sélecteur de période */}
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div className="gt-chips" style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
            {periodOptions.map((p) => (
              <button
                key={p}
                type="button"
                className={`gt-chip ${period === p ? 'gt-chip--active' : ''}`}
                onClick={() => handlePeriodChange(p)}
              >
                {p === 'week' ? 'Semaine' : formatPeriod(p)}
              </button>
            ))}
          </div>
        </div>

        <p className="t-eyebrow" style={{ marginTop: 0 }}>
          {formatPeriod(period)} {loading && '…'}
        </p>

        {/* Classement — tap pour détails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.length === 0 && !loading && (
            <p className="t-caption" style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: '20px 0' }}>
              Aucune séance enregistrée sur cette période.
            </p>
          )}
          {sorted.map((entry, i) => (
            <MemberRow key={entry.userId} entry={entry} rank={i + 1} />
          ))}
        </div>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', textAlign: 'center' }}>
          Tapez un membre pour voir ses stats détaillées
        </p>

        {/* Fil d'activité */}
        {feed.length > 0 && (
          <>
            <p className="t-eyebrow" style={{ marginTop: 8 }}>Activité récente</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feed.map((item, i) => (
                <FeedCard key={`${item.user_id}-${item.ended_at}-${i}`} item={item} myUserId={myEntry?.userId ?? null} />
              ))}
            </div>
          </>
        )}

        {/* Quitter */}
        <button
          onClick={handleLeave}
          style={{
            width: '100%', padding: '12px 14px', marginTop: 8,
            borderRadius: 'var(--radius-card)', border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--danger)',
            fontSize: 'var(--fs-body)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Icon name="logout" size={18} />
          Quitter le groupe
        </button>
      </div>
    </div>
  )
}
