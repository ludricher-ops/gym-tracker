import { useState } from 'react'
import type { BodyMeasurement } from '../../types'
import { useStore } from '../../hooks/useStore'
import { localDayKey } from '../../utils/dates'
import { weightIn, lengthIn, lbToKg, inToCm } from '../../utils/units'
import { uuid } from '../../utils/uuid'
import { Sheet, Button } from '../ui'

/** Champs de mensuration (tous stockés en cm). */
export const BODY_LENGTH_FIELDS = [
  { key: 'chestCm', label: 'Poitrine' },
  { key: 'waistCm', label: 'Taille' },
  { key: 'hipsCm', label: 'Hanches' },
  { key: 'bicepCm', label: 'Bras' },
  { key: 'thighCm', label: 'Cuisse' },
  { key: 'calfCm', label: 'Mollet' },
] as const

type NumKey =
  | 'weightKg' | 'chestCm' | 'waistCm' | 'hipsCm' | 'bicepCm' | 'thighCm'
  | 'calfCm' | 'bodyFatPct'

const round1 = (n: number) => Math.round(n * 10) / 10

interface BodyMeasurementSheetProps {
  measurement?: BodyMeasurement
  onClose: () => void
}

export function BodyMeasurementSheet({ measurement, onClose }: BodyMeasurementSheetProps) {
  const store = useStore()
  const editing = measurement != null
  const { weightUnit, measurementUnit } = store.settings.preferences

  // Valeur stockée (SI) → chaîne affichée dans l'unité de l'utilisateur.
  const toDisplay = (key: NumKey, v: number | undefined): string => {
    if (v == null) return ''
    if (key === 'weightKg') return String(round1(weightIn(v, weightUnit)))
    if (key === 'bodyFatPct') return String(v)
    return String(round1(lengthIn(v, measurementUnit)))
  }

  const [date, setDate] = useState(
    localDayKey(measurement?.takenAt ?? Date.now()),
  )
  const [vals, setVals] = useState<Record<NumKey, string>>({
    weightKg: toDisplay('weightKg', measurement?.weightKg),
    chestCm: toDisplay('chestCm', measurement?.chestCm),
    waistCm: toDisplay('waistCm', measurement?.waistCm),
    hipsCm: toDisplay('hipsCm', measurement?.hipsCm),
    bicepCm: toDisplay('bicepCm', measurement?.bicepCm),
    thighCm: toDisplay('thighCm', measurement?.thighCm),
    calfCm: toDisplay('calfCm', measurement?.calfCm),
    bodyFatPct: toDisplay('bodyFatPct', measurement?.bodyFatPct),
  })

  const setVal = (key: NumKey, value: string) =>
    setVals((v) => ({ ...v, [key]: value }))

  // Chaîne saisie → valeur SI (undefined si vide / invalide).
  const toSI = (key: NumKey, str: string): number | undefined => {
    const n = parseFloat(str.replace(',', '.'))
    if (!isFinite(n) || n <= 0) return undefined
    if (key === 'weightKg') return weightUnit === 'lb' ? lbToKg(n) : n
    if (key === 'bodyFatPct') return n
    return measurementUnit === 'in' ? inToCm(n) : n
  }

  const hasAny = (Object.keys(vals) as NumKey[]).some((k) => toSI(k, vals[k]) != null)

  const save = async () => {
    if (!hasAny) return
    const [y, m, d] = date.split('-').map(Number)
    const takenAt =
      y && m && d ? new Date(y, m - 1, d, 12).getTime() : Date.now()
    await store.bodyMeasurement.save({
      id: measurement?.id ?? uuid(),
      takenAt,
      weightKg: toSI('weightKg', vals.weightKg),
      chestCm: toSI('chestCm', vals.chestCm),
      waistCm: toSI('waistCm', vals.waistCm),
      hipsCm: toSI('hipsCm', vals.hipsCm),
      bicepCm: toSI('bicepCm', vals.bicepCm),
      thighCm: toSI('thighCm', vals.thighCm),
      calfCm: toSI('calfCm', vals.calfCm),
      bodyFatPct: toSI('bodyFatPct', vals.bodyFatPct),
    })
    onClose()
  }

  const del = async () => {
    if (!measurement) return
    if (!confirm('Supprimer cette mesure ?')) return
    await store.bodyMeasurement.remove(measurement.id)
    onClose()
  }

  const numInput = (key: NumKey, label: string, unit: string) => (
    <div className="gt-field" style={{ flex: 1 }}>
      <label className="gt-field__label" htmlFor={`bm-${key}`}>
        {label} ({unit})
      </label>
      <input
        id={`bm-${key}`}
        type="number"
        className="gt-input"
        value={vals[key]}
        onChange={(e) => setVal(key, e.target.value)}
        placeholder="—"
      />
    </div>
  )

  return (
    <Sheet title={editing ? 'Modifier la mesure' : 'Ajouter une mesure'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="gt-field">
          <label className="gt-field__label" htmlFor="bm-date">
            Date
          </label>
          <input
            id="bm-date"
            type="date"
            className="gt-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {numInput('weightKg', 'Poids', weightUnit)}
          {numInput('bodyFatPct', 'Masse grasse', '%')}
        </div>

        <p className="t-eyebrow">Mensurations</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {BODY_LENGTH_FIELDS.map((f) => (
            <div key={f.key} style={{ flex: '1 1 40%' }}>
              {numInput(f.key, f.label, measurementUnit)}
            </div>
          ))}
        </div>

        <Button icon="check" onClick={save} disabled={!hasAny}>
          {editing ? 'Enregistrer' : 'Ajouter la mesure'}
        </Button>
        {editing && (
          <Button variant="ghost" icon="trash" onClick={del}>
            Supprimer la mesure
          </Button>
        )}
      </div>
    </Sheet>
  )
}
