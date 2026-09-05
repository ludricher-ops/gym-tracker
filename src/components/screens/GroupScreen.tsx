import { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { Button, Card, Icon, Row } from '../ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GroupInfo {
  id: number
  name: string
  code: string
}

interface LeaderboardEntry {
  userId: number
  displayName: string
  isMe: boolean
  weekXp: number
  totalXp: number
}

interface MineEntry {
  id: number
  name: string
  code: string
  display_name: string
}

type View = 'loading' | 'noGroup' | 'leaderboard'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...opts })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Erreur réseau')
  return json
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  if (medal) return <span style={{ fontSize: 20 }}>{medal}</span>
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--surface-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--fg-muted)',
        flexShrink: 0,
      }}
    >
      {rank}
    </span>
  )
}

function Avatar({ name, isMe }: { name: string; isMe: boolean }) {
  const letter = name[0]?.toUpperCase() ?? '?'
  return (
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: isMe ? 'var(--accent)' : 'var(--surface-raised)',
        color: isMe ? 'var(--accent-ink)' : 'var(--fg-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  )
}

function XpBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      style={{
        height: 4,
        background: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

// ── Écran principal ───────────────────────────────────────────────────────────

export function GroupScreen() {
  const nav = useNavigation()

  const [view, setView] = useState<View>('loading')
  const [, setGroups] = useState<MineEntry[]>([])
  const [activeGroup, setActiveGroup] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<LeaderboardEntry[]>([])
  const [tab, setTab] = useState<'week' | 'total'>('week')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Formulaires
  const [mode, setMode] = useState<'create' | 'join' | null>(null)
  const [groupName, setGroupName] = useState('')
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadLeaderboard = useCallback(async (groupCode: string) => {
    try {
      const data = await apiFetch(`/api/groups/${groupCode}/leaderboard`)
      setActiveGroup(data.group)
      setMembers(data.members)
      setView('leaderboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }, [])

  useEffect(() => {
    apiFetch('/api/groups/mine')
      .then((data) => {
        const g: MineEntry[] = data.groups ?? []
        setGroups(g)
        if (g.length > 0 && g[0]) {
          loadLeaderboard(g[0].code)
        } else {
          setView('noGroup')
        }
      })
      .catch(() => setView('noGroup'))
  }, [loadLeaderboard])

  const copyCode = async () => {
    if (!activeGroup) return
    try {
      await navigator.clipboard.writeText(activeGroup.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleLeave = async () => {
    if (!activeGroup) return
    if (!window.confirm(`Quitter le groupe « ${activeGroup.name} » ?`)) return
    try {
      await apiFetch(`/api/groups/${activeGroup.id}/leave`, { method: 'DELETE' })
      setGroups([])
      setActiveGroup(null)
      setMembers([])
      setView('noGroup')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleSubmit = async () => {
    setFormError(null)
    setSubmitting(true)
    try {
      if (mode === 'create') {
        if (!groupName.trim()) { setFormError('Nom du groupe requis'); setSubmitting(false); return }
        if (!displayName.trim()) { setFormError('Pseudo requis'); setSubmitting(false); return }
        const data = await apiFetch('/api/groups/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: groupName.trim(), displayName: displayName.trim() }),
        })
        await loadLeaderboard(data.group.code)
      } else {
        if (!code.trim()) { setFormError('Code requis'); setSubmitting(false); return }
        if (!displayName.trim()) { setFormError('Pseudo requis'); setSubmitting(false); return }
        const data = await apiFetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim(), displayName: displayName.trim() }),
        })
        await loadLeaderboard(data.group.code)
      }
      setMode(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render : loading ────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Mode Compétition</h1>
        </div>
        <div className="gt-screen__scroll" style={{ alignItems: 'center', paddingTop: 40 }}>
          <p className="t-caption">Chargement…</p>
        </div>
      </div>
    )
  }

  // ── Render : pas de groupe ──────────────────────────────────────────────────
  if (view === 'noGroup') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Mode Compétition</h1>
        </div>

        <div className="gt-screen__scroll">
          {/* Hero */}
          {!mode && (
            <>
              <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
                <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>🏆</div>
                <p className="t-title" style={{ marginBottom: 6 }}>
                  Défiez vos amis
                </p>
                <p className="t-caption" style={{ color: 'var(--fg-muted)', maxWidth: 260, margin: '0 auto' }}>
                  Gagnez de l'XP à chaque séance, montez dans le classement, battez vos PRs.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Button icon="plus" onClick={() => { setMode('create'); setDisplayName('') }}>
                  Créer un groupe
                </Button>
                <Button variant="secondary" icon="link" onClick={() => { setMode('join'); setDisplayName('') }}>
                  Rejoindre avec un code
                </Button>
              </div>

              {/* Comment ça marche */}
              <p className="t-eyebrow" style={{ marginTop: 24 }}>Comment ça marche</p>
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['⚡', 'Sets & tonnage', "Chaque série validée rapporte de l'XP selon le poids soulevé"],
                    ['🏅', 'Records personnels', '+100 XP par PR battu'],
                    ['💪', 'Séances complètes', '+50 XP par séance terminée'],
                  ].map(([emoji, title, desc]) => (
                    <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{title}</div>
                        <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Formulaire créer / rejoindre */}
          {mode && (
            <>
              <p className="t-eyebrow">
                {mode === 'create' ? 'Créer un groupe' : 'Rejoindre un groupe'}
              </p>

              {mode === 'create' && (
                <div className="gt-field">
                  <span className="gt-field__label">Nom du groupe</span>
                  <input
                    className="gt-input"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex : Les Barbus du Lundi"
                    maxLength={40}
                  />
                </div>
              )}

              {mode === 'join' && (
                <div className="gt-field">
                  <span className="gt-field__label">Code du groupe</span>
                  <input
                    className="gt-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={8}
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: 2 }}
                  />
                </div>
              )}

              <div className="gt-field">
                <span className="gt-field__label">Ton pseudo dans ce groupe</span>
                <input
                  className="gt-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex : Ludo"
                  maxLength={20}
                />
              </div>

              {formError && (
                <p className="t-caption" style={{ color: 'var(--danger)', marginTop: -4 }}>
                  {formError}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <Button icon="check" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'En cours…' : mode === 'create' ? 'Créer' : 'Rejoindre'}
                </Button>
                <Button variant="ghost" onClick={() => { setMode(null); setFormError(null) }}>
                  Annuler
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Render : classement ─────────────────────────────────────────────────────
  const sorted =
    tab === 'week'
      ? [...members].sort((a, b) => b.weekXp - a.weekXp || b.totalXp - a.totalXp)
      : [...members].sort((a, b) => b.totalXp - a.totalXp || b.weekXp - a.weekXp)

  const maxXp = sorted[0]?.[tab === 'week' ? 'weekXp' : 'totalXp'] ?? 1

  const myEntry = members.find((m) => m.isMe)

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">{activeGroup?.name ?? 'Groupe'}</h1>
        <button className="gt-iconbtn" onClick={handleLeave} aria-label="Quitter le groupe">
          <Icon name="logout" size={20} strokeWidth={1.8} />
        </button>
      </div>

      <div className="gt-screen__scroll">
        {error && (
          <p className="t-caption" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        {/* Code du groupe */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 2 }}>
                Code d'invitation
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 4,
                }}
              >
                {activeGroup?.code}
              </div>
            </div>
            <button
              className="gt-iconbtn"
              onClick={copyCode}
              aria-label="Copier le code"
              style={{ color: copied ? 'var(--accent)' : undefined }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={20} />
            </button>
          </div>
        </Card>

        {/* Mon XP */}
        {myEntry && (
          <Card variant="accent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="t-caption" style={{ opacity: 0.8, marginBottom: 2 }}>
                  Ton XP cette semaine
                </div>
                <div style={{ fontWeight: 800, fontSize: 28 }}>
                  {myEntry.weekXp.toLocaleString('fr-FR')}
                  <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4, opacity: 0.8 }}>XP</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="t-caption" style={{ opacity: 0.8, marginBottom: 2 }}>Total</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {myEntry.totalXp.toLocaleString('fr-FR')} XP
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Onglets semaine / total */}
        <div className="gt-chips" style={{ marginTop: 4 }}>
          <button
            type="button"
            className={`gt-chip ${tab === 'week' ? 'gt-chip--active' : ''}`}
            onClick={() => setTab('week')}
          >
            Cette semaine
          </button>
          <button
            type="button"
            className={`gt-chip ${tab === 'total' ? 'gt-chip--active' : ''}`}
            onClick={() => setTab('total')}
          >
            All-time
          </button>
        </div>

        {/* Classement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((entry, i) => {
            const xp = tab === 'week' ? entry.weekXp : entry.totalXp
            return (
              <div
                key={entry.userId}
                style={{
                  background: entry.isMe ? 'var(--accent-subtle)' : 'var(--surface)',
                  border: `1px solid ${entry.isMe ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-card)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RankBadge rank={i + 1} />
                  <Avatar name={entry.displayName} isMe={entry.isMe} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: entry.isMe ? 700 : 600,
                        fontSize: 'var(--fs-body)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.displayName}
                      {entry.isMe && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'var(--accent)',
                            color: 'var(--accent-ink)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            verticalAlign: 'middle',
                          }}
                        >
                          MOI
                        </span>
                      )}
                    </div>
                    <XpBar value={xp} max={maxXp} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, flexShrink: 0, minWidth: 64, textAlign: 'right' }}>
                    {xp.toLocaleString('fr-FR')}
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', marginLeft: 2 }}>
                      XP
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rejoindre un autre groupe */}
        <div style={{ marginTop: 8 }}>
          <Row
            icon="link"
            label="Rejoindre un autre groupe"
            chevron
            onClick={() => { setView('noGroup'); setMode('join'); setDisplayName('') }}
          />
        </div>
      </div>
    </div>
  )
}
