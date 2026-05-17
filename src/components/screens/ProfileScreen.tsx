import { useMemo } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { computeStreak, longestStreak } from '../../utils/streak'
import { localDayKey } from '../../utils/dates'
import { formatVolume } from '../../utils/format'
import { Card, Row, StatTile } from '../ui'

export function ProfileScreen() {
  const store = useStore()
  const nav = useNavigation()
  const { settings } = store

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
        <span className="gt-topbar__title">Profil</span>
      </div>

      <div className="gt-screen__scroll">
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

        <p className="t-eyebrow">Compte</p>
        <Row
          icon="user"
          label="Compte personnel"
          chevron
          onClick={() => nav.navigate('account')}
        />
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

        <p className="t-eyebrow" style={{ marginTop: 6 }}>
          Application
        </p>
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
