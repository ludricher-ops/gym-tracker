import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { setCompetitionEnabled } from '../../nav/navigation'
import { useStore } from '../../hooks/useStore'
import { computeStreak } from '../../utils/streak'
import { localDayKey } from '../../utils/dates'
import { Button, Card, Icon } from '../ui'

// ── Système de niveaux RPG ────────────────────────────────────────────────────
// XP total requis pour atteindre le niveau n : 100 × n × (n-1) / 2
// Passer du niveau n au niveau n+1 coûte 100n XP.

export function xpForLevel(n: number): number {
  return Math.round(100 * n * (n - 1) / 2)
}

export function levelFromXp(totalXp: number): number {
  // Résolution algébrique : n² - n - 2×xp/100 = 0 → n = (1 + √(1+8xp/100)) / 2
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + 8 * totalXp / 100)) / 2))
}

export function xpToNextLevel(totalXp: number): { level: number; current: number; needed: number; pct: number } {
  const level  = levelFromXp(totalXp)
  const floorXp = xpForLevel(level)
  const ceilXp  = xpForLevel(level + 1)
  const current = totalXp - floorXp
  const needed  = ceilXp - floorXp
  return { level, current, needed, pct: Math.round((current / needed) * 100) }
}

interface Rank { label: string; color: string; emoji: string; minLevel: number }
const RANKS: Rank[] = [
  { minLevel: 1,  emoji: '🩶', color: '#94a3b8', label: 'Recrue'       },
  { minLevel: 6,  emoji: '🥉', color: '#cd7f32', label: 'Combattant'   },
  { minLevel: 11, emoji: '⚔️', color: '#71717a', label: 'Guerrier'     },
  { minLevel: 16, emoji: '🥈', color: '#c0c0c0', label: 'Vétéran'      },
  { minLevel: 21, emoji: '🏆', color: '#f59e0b', label: 'Champion'     },
  { minLevel: 26, emoji: '🌟', color: '#f97316', label: 'Élite'        },
  { minLevel: 31, emoji: '💎', color: '#06b6d4', label: 'Maître'       },
  { minLevel: 36, emoji: '🔮', color: '#a855f7', label: 'Grand Maître' },
  { minLevel: 41, emoji: '🔥', color: '#ef4444', label: 'Légende'      },
  { minLevel: 46, emoji: '⭐', color: '#fbbf24', label: 'Icône'        },
  { minLevel: 50, emoji: '👑', color: '#f59e0b', label: 'Transcendant' },
]

export function rankForLevel(level: number): Rank {
  let rank = RANKS[0]!
  for (const r of RANKS) { if (level >= r.minLevel) rank = r }
  return rank
}

// ── Types API ─────────────────────────────────────────────────────────────────

interface GroupInfo { id: number; name: string; code: string }

interface LeaderboardEntry {
  userId: number; displayName: string; isMe: boolean
  periodXp: number; totalXp: number
}

type Period = 'week' | string // 'week' | 'YYYY-MM'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...opts })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Erreur réseau')
  return json
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
  const cur = currentMonthPeriod()
  return p === cur ? `${label} (en cours)` : label
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

function LevelBadge({ level, totalXp }: { level: number; totalXp: number }) {
  const rank = rankForLevel(level)
  const { current, needed, pct } = xpToNextLevel(totalXp)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, lineHeight: 1 }}>{rank.emoji}</div>
      <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>
        Niv. {level}
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginLeft: 6 }}>
          {rank.label}
        </span>
      </div>
      <div style={{ marginTop: 6 }}>
        <div style={{
          height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: rank.color, borderRadius: 3, transition: 'width 0.5s ease',
          }} />
        </div>
        <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
          {current.toLocaleString('fr-FR')} / {needed.toLocaleString('fr-FR')} XP → Niv.{level + 1}
        </div>
      </div>
    </div>
  )
}

function MemberRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const { level, pct } = xpToNextLevel(entry.totalXp)
  const r = rankForLevel(level)
  return (
    <div style={{
      background: entry.isMe ? 'var(--accent-subtle)' : 'var(--surface)',
      border: `1px solid ${entry.isMe ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-card)',
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RankBadge rank={rank} />

        {/* Avatar + rang */}
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
          <span style={{
            position: 'absolute', bottom: -4, right: -4,
            fontSize: 14, lineHeight: 1,
          }}>
            {r.emoji}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontWeight: entry.isMe ? 700 : 600,
              fontSize: 'var(--fs-body)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {entry.displayName}
            </span>
            {entry.isMe && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'var(--accent)', color: 'var(--accent-ink)',
                padding: '1px 5px', borderRadius: 4, flexShrink: 0,
              }}>
                MOI
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="t-caption" style={{ color: r.color, fontWeight: 700, flexShrink: 0 }}>
              Niv.{level}
            </span>
            {/* Barre XP de niveau */}
            <div style={{
              flex: 1, height: 4, background: 'var(--border)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: r.color, borderRadius: 2,
              }} />
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
    </div>
  )
}

// ── Écran principal ───────────────────────────────────────────────────────────

type View = 'loading' | 'noGroup' | 'leaderboard'

export function GroupScreen() {
  const nav = useNavigation()
  const store = useStore()

  // Streak — même calcul que le Dashboard
  const streak = useMemo(
    () => computeStreak(
      store.sessions.filter((s) => s.endedAt != null).map((s) => localDayKey(s.startedAt)),
    ),
    [store.sessions],
  )

  const [view,         setView]         = useState<View>('loading')
  const [group,        setGroup]        = useState<GroupInfo | null>(null)
  const [members,      setMembers]      = useState<LeaderboardEntry[]>([])
  const [seasons,      setSeasons]      = useState<string[]>([])
  const [period,       setPeriod]       = useState<Period>(currentMonthPeriod())
  const [copied,       setCopied]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [loadingBoard, setLoadingBoard] = useState(false)

  // Formulaires
  const [mode,        setMode]        = useState<'create' | 'join' | null>(null)
  const [groupName,   setGroupName]   = useState('')
  const [code,        setCode]        = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)

  const loadLeaderboard = useCallback(async (groupCode: string, p: Period) => {
    setLoadingBoard(true)
    setError(null)
    try {
      const data = await apiFetch(`/api/groups/${groupCode}/leaderboard?period=${p}`)
      setGroup(data.group)
      setMembers(data.members)
      setView('leaderboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoadingBoard(false)
    }
  }, [])

  const loadSeasons = useCallback(async (groupCode: string) => {
    try {
      const data = await apiFetch(`/api/groups/${groupCode}/seasons`)
      setSeasons(data.seasons ?? [])
    } catch { /* ignore */ }
  }, [])

  // Charge le groupe de l'utilisateur au montage
  useEffect(() => {
    apiFetch('/api/groups/mine')
      .then((data) => {
        const g = data.groups?.[0]
        if (g) {
          const p = currentMonthPeriod()
          setPeriod(p)
          loadLeaderboard(g.code, p)
          loadSeasons(g.code)
        } else {
          setView('noGroup')
        }
      })
      .catch(() => setView('noGroup'))
  }, [loadLeaderboard, loadSeasons])

  // Changement de période
  const handlePeriodChange = (p: Period) => {
    if (!group) return
    setPeriod(p)
    void loadLeaderboard(group.code, p)
  }

  const copyCode = async () => {
    if (!group) return
    try { await navigator.clipboard.writeText(group.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { /* ignore */ }
  }

  const handleLeave = async () => {
    if (!group) return
    if (!window.confirm(`Quitter le groupe « ${group.name} » ?`)) return
    try {
      await apiFetch(`/api/groups/${group.id}/leave`, { method: 'DELETE' })
      setGroup(null); setMembers([]); setSeasons([]); setView('noGroup')
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') }
  }

  const handleSubmit = async () => {
    setFormError(null)
    setSubmitting(true)
    try {
      let data: { group: { code: string } }
      if (mode === 'create') {
        if (!groupName.trim()) { setFormError('Nom du groupe requis'); return }
        if (!displayName.trim()) { setFormError('Pseudo requis'); return }
        data = await apiFetch('/api/groups/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: groupName.trim(), displayName: displayName.trim() }),
        })
      } else {
        if (!code.trim()) { setFormError('Code requis'); return }
        if (!displayName.trim()) { setFormError('Pseudo requis'); return }
        data = await apiFetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim(), displayName: displayName.trim() }),
        })
      }
      const p = currentMonthPeriod()
      setPeriod(p)
      await loadLeaderboard(data.group.code, p)
      await loadSeasons(data.group.code)
      setMode(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  // Bandeau simple (loading + noGroup)
  const topBarSimple = (
    <div className="gt-topbar">
      <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
        <Icon name="arrow" size={22} strokeWidth={1.8} />
      </button>
      <h1 className="gt-topbar__title">Rivals</h1>
    </div>
  )

  // Bandeau style Dashboard (classement)
  const topBarLeaderboard = (
    <div className="gt-topbar">
      <div style={{ flex: 1 }}>
        <div className="t-eyebrow">RIVALS</div>
        <h1 className="gt-topbar__title" style={{ fontSize: 'var(--fs-title)' }}>
          {group?.name}
        </h1>
      </div>
      {/* Chip streak — identique au Dashboard */}
      {streak > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--gap-tile)',
            background: 'var(--surface)', borderRadius: 'var(--radius-card)',
            padding: 'var(--gap-tile)',
          }}
          title="Jours consécutifs"
        >
          <div style={{ color: 'var(--accent)', display: 'flex' }}>
            <Icon name="flame" size={20} />
          </div>
          <div>
            <div className="t-num gt-stat__label" style={{ lineHeight: 1 }}>{streak}</div>
            <div className="gt-stat__label">JOURS</div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="gt-screen">
        {topBarSimple}
        <div className="gt-screen__scroll" style={{ alignItems: 'center', paddingTop: 48 }}>
          <p className="t-caption">Chargement…</p>
        </div>
      </div>
    )
  }

  // ── Pas de groupe ───────────────────────────────────────────────────────────
  if (view === 'noGroup') {
    return (
      <div className="gt-screen">
        {topBarSimple}
        <div className="gt-screen__scroll">
          {!mode && (
            <>
              <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
                <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 14 }}>🏆</div>
                <p className="t-title" style={{ marginBottom: 6 }}>Rivals</p>
                <p className="t-caption" style={{ color: 'var(--fg-muted)', maxWidth: 270, margin: '0 auto' }}>
                  Montez en niveau, grimpez dans le classement, battez vos records.
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

              {/* Rangs */}
              <p className="t-eyebrow" style={{ marginTop: 24 }}>Système de rangs</p>
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {RANKS.map((r) => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{r.emoji}</span>
                      <span style={{ fontWeight: 700, color: r.color, minWidth: 56, fontSize: 13 }}>
                        Niv.{r.minLevel}+
                      </span>
                      <span style={{ fontSize: 'var(--fs-body)' }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Formule XP */}
              <p className="t-eyebrow">Comment gagner de l'XP</p>
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['⚡', 'Tonnage', "floor(kg × reps ÷ 10) par série — ×1.5 si kg ≥ 80"],
                    ['💪', 'Poids du corps', 'reps × 3 XP par série'],
                    ['🏅', 'Record personnel', '+150 XP par PR battu'],
                    ['🎯', 'Séance complète', '+100 XP + bonus durée (75 si 45min, 150 si 60min)'],
                  ].map(([emoji, title, desc]) => (
                    <div key={title as string} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{title}</div>
                        <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Note saison */}
              <Card>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>Saisons mensuelles</div>
                    <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>
                      Le classement se réinitialise chaque 1er du mois. L'historique complet reste
                      accessible dans l'onglet Rivals.
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Formulaire */}
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
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: 3 }}
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

  // ── Classement ──────────────────────────────────────────────────────────────
  const myEntry = members.find((m) => m.isMe)
  const myLevel = myEntry ? levelFromXp(myEntry.totalXp) : 1

  // Tri selon la période sélectionnée
  const sorted = [...members].sort((a, b) => b.periodXp - a.periodXp || b.totalXp - a.totalXp)

  // Périodes disponibles : semaine + tous les mois
  const periodOptions: Period[] = ['week', ...seasons]

  return (
    <div className="gt-screen">
      {topBarLeaderboard}
      <div className="gt-screen__scroll">
        {error && (
          <p className="t-caption" style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</p>
        )}

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
            {copied ? 'Code copié !' : `Inviter — code ${group?.code}`}
          </span>
        </button>

        {/* Mon niveau */}
        {myEntry && (
          <Card variant="accent">
            <div style={{ marginBottom: 12 }}>
              <LevelBadge level={myLevel} totalXp={myEntry.totalXp} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 22 }}>
                  {myEntry.periodXp.toLocaleString('fr-FR')}
                </div>
                <div className="t-caption" style={{ opacity: 0.8 }}>XP ce mois</div>
              </div>
              <div style={{ width: 1, background: 'var(--accent-ink)', opacity: 0.3 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 22 }}>
                  {myEntry.totalXp.toLocaleString('fr-FR')}
                </div>
                <div className="t-caption" style={{ opacity: 0.8 }}>XP total</div>
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

        {/* Label de la période active */}
        <p className="t-eyebrow" style={{ marginTop: 0 }}>
          {formatPeriod(period)} {loadingBoard && '…'}
        </p>

        {/* Classement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.length === 0 && !loadingBoard && (
            <p className="t-caption" style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: '20px 0' }}>
              Aucune séance enregistrée sur cette période.
            </p>
          )}
          {sorted.map((entry, i) => (
            <MemberRow key={entry.userId} entry={entry} rank={i + 1} />
          ))}
        </div>

        {/* Actions secondaires */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => { setView('noGroup'); setMode('join'); setDisplayName('') }}
            style={{
              width: '100%', padding: '12px 14px',
              borderRadius: 'var(--radius-card)', border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--fg-muted)',
              fontSize: 'var(--fs-body)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name="link" size={18} />
            Rejoindre un autre groupe
          </button>
          <button
            onClick={handleLeave}
            style={{
              width: '100%', padding: '12px 14px',
              borderRadius: 'var(--radius-card)', border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--danger)',
              fontSize: 'var(--fs-body)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name="logout" size={18} />
            Quitter le groupe
          </button>
        </div>

        {/* Désactiver Rivals */}
        <button
          onClick={() => { setCompetitionEnabled(false); window.location.reload() }}
          style={{
            width: '100%', padding: '10px 14px',
            borderRadius: 'var(--radius-card)', border: 'none',
            background: 'transparent', color: 'var(--fg-muted)',
            fontSize: 'var(--fs-caption)', cursor: 'pointer',
          }}
        >
          Désactiver Rivals
        </button>
      </div>
    </div>
  )
}
