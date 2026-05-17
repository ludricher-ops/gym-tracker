import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { addWeeks, localDayKey, weekRange } from '../../utils/dates'
import { statsForWeek } from '../../utils/stats'
import { formatVolume } from '../../utils/format'
import { EmptyState, Heatmap, Icon, Row, type HeatmapCell } from '../ui'

const DAY_MS = 86_400_000

export function HistoryScreen() {
  const store = useStore()
  const nav = useNavigation()
  const weekStart = store.settings.preferences.weekStart
  const [monthOffset, setMonthOffset] = useState(0)

  const ended = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null).sort((a, b) => b.startedAt - a.startedAt),
    [store.sessions],
  )

  const month = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1)
  }, [monthOffset])
  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Jour entraîné → volume cumulé (pour l'intensité de la heatmap).
  const volumeByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of ended) {
      const key = localDayKey(s.startedAt)
      map.set(key, (map.get(key) ?? 0) + (s.totalVolumeKg ?? 0))
    }
    return map
  }, [ended])

  const maxDayVolume = Math.max(1, ...volumeByDay.values())

  const weeks = useMemo<HeatmapCell[][]>(() => {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const gridStart = weekRange(month, weekStart).start
    const gridEnd = weekRange(monthEnd, weekStart).end
    const cells: HeatmapCell[] = []
    for (let t = gridStart.getTime(); t < gridEnd.getTime(); t += DAY_MS) {
      const key = localDayKey(t)
      const vol = volumeByDay.get(key) ?? 0
      cells.push({
        key,
        intensity: vol > 0 ? 0.35 + 0.65 * (vol / maxDayVolume) : 0,
        title: key,
      })
    }
    const grouped: HeatmapCell[][] = []
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7))
    return grouped
  }, [month, weekStart, volumeByDay, maxDayVolume])

  // Volume des 4 dernières semaines (par rapport à aujourd'hui).
  const volumeBars = useMemo(() => {
    const ref = Date.now()
    const bars = [3, 2, 1, 0].map(
      (w) => statsForWeek(ended, addWeeks(ref, -w), weekStart).volumeKg,
    )
    const max = Math.max(1, ...bars)
    return bars.map((v) => ({ volume: v, ratio: v / max }))
  }, [ended, weekStart])

  const monthSessions = ended.filter((s) => {
    const d = new Date(s.startedAt)
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
  })

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <span className="gt-topbar__title">Historique</span>
      </div>

      <div className="gt-screen__scroll">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="gt-iconbtn"
            onClick={() => setMonthOffset((o) => o - 1)}
            aria-label="Mois précédent"
          >
            <Icon name="chevron-right" size={20} className="gt-rot-up" />
          </button>
          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{monthLabel}</span>
          <button
            className="gt-iconbtn"
            onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
            aria-label="Mois suivant"
            disabled={monthOffset >= 0}
          >
            <Icon name="chevron-right" size={20} className="gt-rot-down" />
          </button>
        </div>

        <Heatmap weeks={weeks} />

        <div>
          <p className="t-eyebrow" style={{ marginBottom: 8 }}>
            Volume — 4 dernières semaines
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 90 }}>
            {volumeBars.map((b, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: `${Math.max(4, b.ratio * 70)}px`,
                    background: i === 3 ? 'var(--accent)' : 'var(--surface2)',
                    borderRadius: 6,
                  }}
                />
                <div className="t-caption" style={{ fontSize: 10, marginTop: 4 }}>
                  {formatVolume(b.volume)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="t-eyebrow">
          {monthSessions.length} séance{monthSessions.length > 1 ? 's' : ''}
        </p>
        {monthSessions.length === 0 ? (
          <EmptyState
            icon="list"
            title="Aucune séance"
            sub="Aucune séance enregistrée ce mois-ci."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthSessions.map((s) => (
              <Row
                key={s.id}
                icon="dumbbell"
                label={s.name}
                sub={new Date(s.startedAt).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
                value={`${formatVolume(s.totalVolumeKg ?? 0)} kg`}
                chevron
                onClick={() => nav.navigate('sessionRecap', { sessionId: s.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
