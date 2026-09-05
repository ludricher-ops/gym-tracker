import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { computeStreak, longestStreak } from '../../utils/streak'
import { localDayKey } from '../../utils/dates'
import { formatVolume } from '../../utils/format'
import { Card, Row, StatTile } from '../ui'
import { isCompetitionEnabled, setCompetitionEnabled } from '../../nav/navigation'
import { useAuth } from '../../auth/AuthContext'

export function ProfileScreen() {
  const store = useStore()
  const nav = useNavigation()
  const { user } = useAuth()
  const { settings } = store
  const isAdmin = user?.id === 1

  const ended = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null),
    [store.sessions],
  )
  const lifetime = useMemo(() => {
    const days = ended.map((s) => localDayKey(s.startedAt))
    return {
      sessions: ended.length,
      recordStreak: Math.max(longestStreak(days), computeStreak(days)),
      tonnage: ended.reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0),
    }
  }, [ended])

  const [rivalsOn, setRivalsOn] = useState(isCompetitionEnabled())

  const toggleRivals = (on: boolean) => {
    setCompetitionEnabled(on)
    setRivalsOn(on)
    window.location.reload()
  }

  const fullName =
    `${settings.firstName} ${settings.lastName}`.trim() || 'Athlète Gym Track'
  const initials =
    (settings.firstName[0] ?? '') + (settings.lastName[0] ?? '') || 'GT'
  const since = new Date(settings.createdAt).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <h1 className="gt-topbar__title">Moi</h1>
      </div>

      <div className="gt-screen__scroll">
        {/* ── Identité ─────────────────────────────────────────────────── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
                textTransform: 'uppercase',
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{fullName}</div>
              <div className="t-caption">Membre depuis {since}</div>
            </div>
          </div>
        </Card>

        <div className="gt-statrow">
          <StatTile label="Séances" value={String(lifetime.sessions)} />
          <StatTile label="Record streak" value={String(lifetime.recordStreak)} />
          <StatTile label="Tonnage" value={`${formatVolume(lifetime.tonnage)} kg`} />
        </div>

        {/* ── Entraînement ─────────────────────────────────────────────── */}
        <p className="t-eyebrow">Entraînement</p>
        <Row
          icon="list"
          label="Programmes"
          chevron
          onClick={() => nav.navigate('programsLibrary')}
        />
        <Row
          icon="dumbbell"
          label="Mes exercices"
          chevron
          onClick={() => nav.navigate('myExercises')}
        />

        {/* ── Suivi ────────────────────────────────────────────────────── */}
        <p className="t-eyebrow">Suivi</p>
        <Row
          icon="target"
          label="Objectifs"
          chevron
          onClick={() => nav.navigate('goalsPrograms')}
        />
        <Row
          icon="scale"
          label="Corps & mesures"
          chevron
          onClick={() => nav.navigate('body')}
        />

        {/* ── Rivals ───────────────────────────────────────────────────── */}
        <p className="t-eyebrow">Rivals</p>
        <Row
          icon="trophy"
          label="Rivals"
          sub={rivalsOn ? 'Activé — onglet épinglé en premier' : 'Classement XP avec vos amis'}
          trailing={
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                role="switch"
                checked={rivalsOn}
                onChange={(e) => toggleRivals(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                width: 42, height: 24, borderRadius: 12,
                background: rivalsOn ? 'var(--accent)' : 'var(--border)',
                padding: 2, transition: 'background 0.2s', flexShrink: 0,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                  transform: rivalsOn ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                }} />
              </span>
            </label>
          }
        />
        {/* ── Admin ────────────────────────────────────────────────────── */}
        {isAdmin && (
          <>
            <p className="t-eyebrow">Administration</p>
            <Row
              icon="cog"
              label="Panneau admin"
              sub="Utilisateurs, stats globales, migrations"
              chevron
              onClick={() => nav.navigate('admin')}
            />
          </>
        )}

        {/* ── Réglages ─────────────────────────────────────────────────── */}
        <p className="t-eyebrow">Réglages</p>
        <Row
          icon="user"
          label="Compte"
          chevron
          onClick={() => nav.navigate('account')}
        />
        <Row
          icon="cog"
          label="Préférences"
          chevron
          onClick={() => nav.navigate('preferences')}
        />

        <p className="t-caption" style={{ marginTop: 12, textAlign: 'center' }}>
          Gym Track · données 100&nbsp;% locales sur cet appareil
        </p>
      </div>
    </div>
  )
}
