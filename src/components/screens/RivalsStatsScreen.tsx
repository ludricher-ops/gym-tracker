// Écran "Mes stats Rivals" — niveau, rangs, badges, détail XP.

import { useMemo } from 'react'
import { useNavigation } from '../../nav/useNavigation'
import { useStore } from '../../hooks/useStore'
import { computeStreak, longestStreak } from '../../utils/streak'
import { localDayKey } from '../../utils/dates'
import { Card, Icon } from '../ui'
import { computeBadges, levelFromXp, RANKS, rankForLevel, xpToNextLevel } from './rivalsRpg'

// ── Formule XP locale (miroir de groupRoutes.js) ──────────────────────────────

function useLocalXpBreakdown(store: ReturnType<typeof useStore>) {
  return useMemo(() => {
    let setsXp = 0; let heavyBonus = 0; let prBonus = 0
    let sessXp = 0; let durBonus = 0

    for (const s of store.sets) {
      if (s.isWarmup || s.completedAt == null) continue
      let base = 0
      if (s.weightKg > 0) {
        base = Math.max(1, Math.floor(s.weightKg * s.reps / 10))
        if (s.weightKg >= 80) { const hb = Math.floor(s.weightKg * s.reps / 20); heavyBonus += hb; base += hb }
      } else {
        base = s.reps * 3
      }
      setsXp += base
      if (s.isPersonalRecord) { prBonus += 150; setsXp += 150 }
    }

    for (const sess of store.sessions) {
      if (sess.endedAt == null) continue
      sessXp += 100
      const dur = sess.endedAt - sess.startedAt
      if (dur > 3600000) { durBonus += 150; sessXp += 150 }
      else if (dur > 2700000) { durBonus += 75; sessXp += 75 }
    }

    const totalXp = setsXp + sessXp
    return { setsXp, sessXp, heavyBonus, prBonus, durBonus, totalXp }
  }, [store.sets, store.sessions])
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function RivalsStatsScreen() {
  const nav   = useNavigation()
  const store = useStore()

  const { setsXp, sessXp, heavyBonus, prBonus, durBonus, totalXp } = useLocalXpBreakdown(store)

  const level    = levelFromXp(totalXp)
  const myRank   = rankForLevel(level)
  const { current, needed, pct } = xpToNextLevel(totalXp)

  const endedSessions = useMemo(() => store.sessions.filter((s) => s.endedAt != null), [store.sessions])
  const days          = useMemo(() => endedSessions.map((s) => localDayKey(s.startedAt)), [endedSessions])
  const streak        = useMemo(() => computeStreak(days), [days])
  const bestStreak    = useMemo(() => Math.max(longestStreak(days), streak), [days, streak])
  const maxWeightKg   = useMemo(() => Math.max(0, ...store.sets.map((s) => s.weightKg)), [store.sets])
  const prCount       = store.personalRecords.length

  const badges = useMemo(
    () => computeBadges({ sessionCount: endedSessions.length, prCount, streak: bestStreak, maxWeightKg, totalXp }),
    [endedSessions.length, prCount, bestStreak, maxWeightKg, totalXp],
  )

  const unlocked = badges.filter((b) => b.unlocked)
  const locked   = badges.filter((b) => !b.unlocked)

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Mes stats Rivals</h1>
      </div>

      <div className="gt-screen__scroll">
        {/* Carte rang actuel */}
        <Card variant="accent">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 6 }}>{myRank.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>
              Niv.{level} — {myRank.label}
            </div>
            <div className="t-caption" style={{ opacity: 0.8 }}>
              {totalXp.toLocaleString('fr-FR')} XP au total
            </div>
          </div>
          {/* Barre de progression vers prochain niveau */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 8, background: 'rgba(0,0,0,.15)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'white', borderRadius: 4, transition: 'width .5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span className="t-caption" style={{ opacity: 0.8 }}>
                {current.toLocaleString('fr-FR')} / {needed.toLocaleString('fr-FR')} XP
              </span>
              <span className="t-caption" style={{ opacity: 0.8 }}>→ Niv.{level + 1}</span>
            </div>
          </div>
        </Card>

        {/* Stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['🏋️', String(endedSessions.length), 'Séances'],
            ['🏅', String(prCount),              'Records'],
            ['🔥', String(bestStreak),           'Meilleur streak'],
          ].map(([emoji, value, label]) => (
            <Card key={label as string} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 20 }}>{emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>{value}</div>
              <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Détail XP */}
        <p className="t-eyebrow">Détail de l'XP</p>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['⚡', 'Tonnage (séries)',    setsXp - heavyBonus - prBonus],
              ['💪', 'Bonus poids lourd',  heavyBonus],
              ['🏅', 'Bonus records (PR)', prBonus],
              ['🎯', 'Séances complètes',  sessXp - durBonus],
              ['⏱️', 'Bonus durée',        durBonus],
            ].map(([emoji, label, val]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{emoji}</span>
                  <span style={{ fontSize: 'var(--fs-body)' }}>{label}</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                  {(val as number).toLocaleString('fr-FR')} XP
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--accent)' }}>
                {totalXp.toLocaleString('fr-FR')} XP
              </span>
            </div>
          </div>
        </Card>

        {/* Badges débloqués */}
        {unlocked.length > 0 && (
          <>
            <p className="t-eyebrow">Badges débloqués ({unlocked.length})</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {unlocked.map((b) => (
                <Card key={b.id} style={{ textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{b.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>{b.desc}</div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Badges verrouillés */}
        {locked.length > 0 && (
          <>
            <p className="t-eyebrow">Prochains badges ({locked.length})</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {locked.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)', padding: '12px 8px',
                    textAlign: 'center', opacity: 0.5,
                  }}
                >
                  <div style={{ fontSize: 28, filter: 'grayscale(1)', marginBottom: 4 }}>{b.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3 }}>{b.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tous les rangs */}
        <p className="t-eyebrow">Progression des rangs</p>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RANKS.map((r) => {
              const reached = level >= r.minLevel
              return (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: reached ? 1 : 0.4,
                }}>
                  <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{r.emoji}</span>
                  <span style={{ fontWeight: 700, color: r.color, minWidth: 60, fontSize: 13 }}>
                    Niv.{r.minLevel}+
                  </span>
                  <span style={{ fontSize: 'var(--fs-body)', flex: 1 }}>{r.label}</span>
                  {reached && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
