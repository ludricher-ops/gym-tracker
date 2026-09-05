// Hub Rivals — liste des groupes, création, rejoindre, accès aux stats perso.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { useStore } from '../../hooks/useStore'
import { computeStreak } from '../../utils/streak'
import { localDayKey } from '../../utils/dates'
import { setCompetitionEnabled } from '../../nav/navigation'
import { Button, Card, Icon } from '../ui'
import { levelFromXp, rankForLevel, xpToNextLevel } from './rivalsRpg'

// ── Types API ─────────────────────────────────────────────────────────────────

interface GroupInfo {
  id: number
  name: string
  code: string
  display_name: string
  member_count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  let res: Response
  try {
    res = await fetch(path, { credentials: 'include', ...opts })
  } catch (e) {
    // fetch() lui-même a échoué (pas de réseau, SW, iOS "Load failed"…)
    throw new Error(`Réseau inaccessible — réessaie dans quelques secondes.`)
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Erreur ${res.status}`)
  return json
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function GroupScreen() {
  const nav   = useNavigation()
  const store = useStore()

  const streak = useMemo(
    () => computeStreak(
      store.sessions.filter((s) => s.endedAt != null).map((s) => localDayKey(s.startedAt)),
    ),
    [store.sessions],
  )

  const [groups,     setGroups]     = useState<GroupInfo[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [mode,       setMode]       = useState<'create' | 'join' | null>(null)
  const [groupName,  setGroupName]  = useState('')
  const [code,       setCode]       = useState('')
  const [dispName,   setDispName]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiFetch('/api/groups/mine')
      setGroups(data.groups ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadGroups() }, [loadGroups])

  const handleSubmit = async () => {
    setFormError(null)
    if (!dispName.trim()) { setFormError('Pseudo requis'); return }
    if (mode === 'create' && !groupName.trim()) { setFormError('Nom du groupe requis'); return }
    if (mode === 'join'   && !code.trim())      { setFormError('Code requis'); return }
    setSubmitting(true)
    try {
      if (mode === 'create') {
        await apiFetch('/api/groups/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: groupName.trim(), displayName: dispName.trim() }),
        })
      } else {
        await apiFetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim(), displayName: dispName.trim() }),
        })
      }
      setMode(null); setGroupName(''); setCode(''); setDispName('')
      await loadGroups()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  // XP local (approximation depuis le store — même formule que le serveur)
  const localXp = useMemo(() => {
    let xp = 0
    for (const s of store.sets) {
      if (s.isWarmup || s.completedAt == null) continue
      if (s.weightKg > 0) {
        xp += Math.max(1, Math.floor(s.weightKg * s.reps / 10))
        if (s.weightKg >= 80) xp += Math.floor(s.weightKg * s.reps / 20)
      } else {
        xp += s.reps * 3
      }
      if (s.isPersonalRecord) xp += 150
    }
    for (const sess of store.sessions) {
      if (sess.endedAt == null) continue
      xp += 100
      const dur = sess.endedAt - sess.startedAt
      if (dur > 3600000) xp += 150
      else if (dur > 2700000) xp += 75
    }
    return xp
  }, [store.sets, store.sessions])

  const myLevel = levelFromXp(localXp)
  const myRank  = rankForLevel(myLevel)
  const { current, needed, pct } = xpToNextLevel(localXp)

  return (
    <div className="gt-screen">
      {/* Topbar style Dashboard */}
      <div className="gt-topbar">
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">RIVALS</div>
          <h1 className="gt-topbar__title" style={{ fontSize: 'var(--fs-title)' }}>
            Mes groupes
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
        {/* Carte mon niveau — compact */}
        <button
          onClick={() => nav.navigate('rivalsStats')}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'var(--accent-subtle)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-card)', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>{myRank.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Niv.{myLevel}</span>
              <span style={{ fontSize: 12, color: myRank.color, fontWeight: 700 }}>{myRank.label}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: myRank.color, borderRadius: 3, transition: 'width .5s' }} />
              </div>
              <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
                {current.toLocaleString('fr-FR')} / {needed.toLocaleString('fr-FR')} XP
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Mes stats</span>
            <Icon name="chevron-right" size={16} />
          </div>
        </button>

        {/* Mes groupes */}
        {error && <p className="t-caption" style={{ color: 'var(--danger)' }}>{error}</p>}

        {loading && <p className="t-caption" style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: 16 }}>Chargement…</p>}

        {!loading && groups.length > 0 && (
          <>
            <p className="t-eyebrow">Mes groupes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => nav.navigate('groupDetail', { code: g.code, name: g.name, displayName: g.display_name })}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--accent)', color: 'var(--accent-ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16, flexShrink: 0,
                  }}>
                    {g.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.name}
                    </div>
                    <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>
                      {g.member_count} membre{g.member_count > 1 ? 's' : ''} · code {g.code}
                    </div>
                  </div>
                  <Icon name="chevron-right" size={18} />
                </button>
              ))}
            </div>
          </>
        )}

        {!loading && groups.length === 0 && !mode && (
          <Card>
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
              <p className="t-body" style={{ fontWeight: 600, marginBottom: 4 }}>Pas encore de groupe</p>
              <p className="t-caption" style={{ color: 'var(--fg-muted)' }}>
                Créez ou rejoignez un groupe pour défier vos amis.
              </p>
            </div>
          </Card>
        )}

        {/* Formulaire */}
        {mode && (
          <>
            <p className="t-eyebrow">{mode === 'create' ? 'Créer un groupe' : 'Rejoindre un groupe'}</p>
            {mode === 'create' && (
              <div className="gt-field">
                <span className="gt-field__label">Nom du groupe</span>
                <input className="gt-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex : Les Barbus du Lundi" maxLength={40} />
              </div>
            )}
            {mode === 'join' && (
              <div className="gt-field">
                <span className="gt-field__label">Code du groupe</span>
                <input className="gt-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={8} style={{ fontFamily: 'var(--font-mono)', letterSpacing: 3 }} />
              </div>
            )}
            <div className="gt-field">
              <span className="gt-field__label">Ton pseudo dans ce groupe</span>
              <input className="gt-input" value={dispName} onChange={(e) => setDispName(e.target.value)} placeholder="Ex : Ludo" maxLength={20} />
            </div>
            {formError && <p className="t-caption" style={{ color: 'var(--danger)', marginTop: -4 }}>{formError}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button icon="check" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'En cours…' : mode === 'create' ? 'Créer' : 'Rejoindre'}
              </Button>
              <Button variant="ghost" onClick={() => { setMode(null); setFormError(null) }}>Annuler</Button>
            </div>
          </>
        )}

        {/* Boutons principaux */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: groups.length > 0 ? 8 : 0 }}>
            <Button icon="plus" onClick={() => { setMode('create'); setDispName('') }}>Créer un groupe</Button>
            <Button variant="secondary" icon="link" onClick={() => { setMode('join'); setDispName('') }}>
              Rejoindre avec un code
            </Button>
          </div>
        )}

        {/* Désactiver Rivals */}
        <button
          onClick={() => { setCompetitionEnabled(false); window.location.reload() }}
          style={{
            width: '100%', padding: '10px 14px', marginTop: 8,
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
