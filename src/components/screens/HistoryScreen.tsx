import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { addWeeks, localDayKey, weekRange } from '../../utils/dates'
import { statsForWeek } from '../../utils/stats'
import { formatDuration, formatVolume } from '../../utils/format'
import { DateBlock, EmptyState, Heatmap, Icon, Row, SectionHeader, type HeatmapCell } from '../ui'

const DAY_MS = 86_400_000

export function HistoryScreen() {
  const store = useStore()
  const nav = useNavigation()
  const weekStart = store.settings.preferences.weekStart
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const ended = useMemo(
    () => store.sessions.filter((s) => s.endedAt != null).sort((a, b) => b.startedAt - a.startedAt),
    [store.sessions],
  )

  const month = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1)
  }, [monthOffset])
  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

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
        intensity: volumeByDay.has(key) ? 0.35 + 0.65 * (vol / maxDayVolume) : 0,
        title: key,
        outOfMonth: new Date(t).getMonth() !== month.getMonth(),
      })
    }
    const grouped: HeatmapCell[][] = []
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7))
    return grouped
  }, [month, weekStart, volumeByDay, maxDayVolume])

  // Volume des 4 dernières semaines (par rapport à aujourd'hui).
  const volumeBars = useMemo(() => {
    const ref = Date.now()
    const bars = [3, 2, 1, 0].map((w) => {
      const ts = addWeeks(ref, -w)
      return {
        volume: statsForWeek(ended, ts, weekStart).volumeKg,
        wStart: weekRange(ts, weekStart).start,
      }
    })
    const max = Math.max(1, ...bars.map((b) => b.volume))
    return bars.map((b) => ({ ...b, ratio: b.volume / max }))
  }, [ended, weekStart])

  // Volume de la semaine courante (dernier bar)
  const currentWeekVolume = volumeBars[3]?.volume ?? 0

  const monthSessions = ended.filter((s) => {
    const d = new Date(s.startedAt)
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
  })

  const visibleSessions = selectedDay
    ? monthSessions.filter((s) => localDayKey(s.startedAt) === selectedDay)
    : monthSessions

  const handleDayClick = (key: string) => {
    setSelectedDay((prev) => (prev === key ? null : key))
  }

  const handleMonthChange = (delta: number) => {
    setSelectedDay(null)
    setMonthOffset((o) => Math.min(0, o + delta))
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <h1 className="gt-topbar__title">Historique</h1>
      </div>

      <div className="gt-screen__scroll">
        {/* ── Navigation mois ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="gt-iconbtn"
            onClick={() => handleMonthChange(-1)}
            aria-label="Mois précédent"
          >
            <Icon name="chevron-right" size={20} className="gt-rot-up" />
          </button>
          <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{monthLabel}</span>
          <button
            className="gt-iconbtn"
            onClick={() => handleMonthChange(1)}
            aria-label="Mois suivant"
            disabled={monthOffset >= 0}
          >
            <Icon name="chevron-right" size={20} className="gt-rot-down" />
          </button>
        </div>

        {/* ── Heatmap avec en-tête L M M J V S D ──────────────────────── */}
        <Heatmap
          weeks={weeks}
          selectedKey={selectedDay}
          onCellClick={handleDayClick}
          showHeaders
          weekStart={weekStart}
        />

        {/* ── Volume 4 semaines — chiffre courant en display + barres ──── */}
        <div>
          <SectionHeader label="Volume — 4 dernières semaines" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span className="t-num" style={{ fontSize: 'var(--fs-display)', fontWeight: 700, lineHeight: 1 }}>
              {Math.round(currentWeekVolume).toLocaleString('fr-FR')}
            </span>
            <span className="t-caption" style={{ color: 'var(--muted)' }}>kg cette semaine</span>
          </div>
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
                <div className="t-caption" style={{ fontSize: 'var(--fs-eyebrow)', marginTop: 4 }}>
                  {b.wStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Liste des séances du mois ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="t-eyebrow" style={{ margin: 0 }}>
            {selectedDay
              ? `${visibleSessions.length} séance${visibleSessions.length > 1 ? 's' : ''} — ${new Date(selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
              : `${monthSessions.length} séance${monthSessions.length > 1 ? 's' : ''}`}
          </p>
          {selectedDay && (
            <button
              className="gt-iconbtn"
              onClick={() => setSelectedDay(null)}
              aria-label="Effacer la sélection"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        {visibleSessions.length === 0 ? (
          <EmptyState
            icon="list"
            title="Aucune séance"
            sub={selectedDay ? 'Aucune séance ce jour-là.' : 'Aucune séance enregistrée ce mois-ci.'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleSessions.map((s) => {
              const start = new Date(s.startedAt)
              const endTs = s.endedAt ? new Date(s.endedAt) : null
              const timeRange = endTs
                ? `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → ${endTs.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              return (
                <Row
                  key={s.id}
                  leading={<DateBlock date={s.startedAt} />}
                  label={s.name}
                  sub={timeRange}
                  value={`${formatVolume(s.totalVolumeKg ?? 0)} kg · ${formatDuration(s.durationSec ?? 0)}`}
                  chevron
                  onClick={() => nav.navigate('sessionRecap', { sessionId: s.id })}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
