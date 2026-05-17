import { useMemo, useState } from 'react'
import type { BodyMeasurement } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { lengthIn, weightIn, formatWeight } from '../../utils/units'
import {
  Card, EmptyState, Icon, LineChart, Row, Segmented, StatTile, type ChartPoint,
} from '../ui'
import { BodyMeasurementSheet, BODY_LENGTH_FIELDS } from '../body/BodyMeasurementSheet'

const round1 = (n: number) => Math.round(n * 10) / 10

export function BodyScreen() {
  const store = useStore()
  const nav = useNavigation()
  const { weightUnit, measurementUnit } = store.settings.preferences

  const [creating, setCreating] = useState(false)
  const [editMeasurement, setEditMeasurement] = useState<BodyMeasurement | null>(null)
  const [period, setPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('6m')

  const measurements = useMemo(
    () => [...store.bodyMeasurements].sort((a, b) => b.takenAt - a.takenAt),
    [store.bodyMeasurements],
  )

  // Valeur la plus récente renseignée pour un champ donné.
  const latestValue = (key: keyof BodyMeasurement): number | undefined => {
    for (const m of measurements) {
      const v = m[key]
      if (typeof v === 'number') return v
    }
    return undefined
  }

  const weightGoal = store.goals.find((g) => g.type === 'bodyweight')

  const weightPoints = useMemo<ChartPoint[]>(() => {
    const days = period === '3m' ? 90 : period === '6m' ? 180 : period === '1y' ? 365 : Infinity
    const cutoff = Date.now() - days * 86_400_000
    return [...measurements]
      .filter((m) => m.weightKg != null && m.takenAt >= cutoff)
      .sort((a, b) => a.takenAt - b.takenAt)
      .map((m) => ({ x: m.takenAt, y: weightIn(m.weightKg as number, weightUnit) }))
  }, [measurements, period, weightUnit])

  const latestWeight = latestValue('weightKg')
  const latestFat = latestValue('bodyFatPct')

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <span className="gt-topbar__title">Corps &amp; mesures</span>
        <button
          className="gt-iconbtn"
          onClick={() => setCreating(true)}
          aria-label="Ajouter une mesure"
        >
          <Icon name="plus" size={22} />
        </button>
      </div>

      <div className="gt-screen__scroll">
        {measurements.length === 0 ? (
          <EmptyState
            icon="scale"
            title="Aucune mesure"
            sub="Ajoute ton poids et tes mensurations pour suivre leur évolution."
          />
        ) : (
          <>
            <Card variant="accent">
              <p className="t-eyebrow" style={{ color: 'var(--accent-ink)', opacity: 0.7 }}>
                Poids actuel
              </p>
              <p className="t-num" style={{ fontSize: 34, marginTop: 4 }}>
                {latestWeight != null ? formatWeight(latestWeight, weightUnit) : '—'}
              </p>
              {weightGoal && (
                <p style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                  Objectif : {weightGoal.targetValue} {weightGoal.unit}
                </p>
              )}
            </Card>

            <Card>
              <p className="t-eyebrow" style={{ marginBottom: 10 }}>
                Évolution du poids
              </p>
              <Segmented
                value={period}
                onChange={setPeriod}
                options={[
                  { value: '3m', label: '3M' },
                  { value: '6m', label: '6M' },
                  { value: '1y', label: '1A' },
                  { value: 'all', label: 'Tout' },
                ]}
              />
              <div style={{ marginTop: 12 }}>
                <LineChart points={weightPoints} />
              </div>
            </Card>

            <p className="t-eyebrow">Mensurations</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-tile)' }}>
              {BODY_LENGTH_FIELDS.map((f) => {
                const v = latestValue(f.key)
                return (
                  <div key={f.key} style={{ flex: '1 1 28%', minWidth: 92 }}>
                    <StatTile
                      label={f.label}
                      value={
                        v != null ? `${round1(lengthIn(v, measurementUnit))} ${measurementUnit}` : '—'
                      }
                    />
                  </div>
                )
              })}
              <div style={{ flex: '1 1 28%', minWidth: 92 }}>
                <StatTile
                  label="Masse grasse"
                  value={latestFat != null ? `${latestFat} %` : '—'}
                />
              </div>
            </div>

            <p className="t-eyebrow">Historique</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {measurements.map((m) => (
                <Row
                  key={m.id}
                  icon="scale"
                  label={new Date(m.takenAt).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  value={
                    m.weightKg != null ? formatWeight(m.weightKg, weightUnit) : undefined
                  }
                  chevron
                  onClick={() => setEditMeasurement(m)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {creating && <BodyMeasurementSheet onClose={() => setCreating(false)} />}
      {editMeasurement && (
        <BodyMeasurementSheet
          measurement={editMeasurement}
          onClose={() => setEditMeasurement(null)}
        />
      )}
    </div>
  )
}
