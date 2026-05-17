import { useState } from 'react'
import type { SetRecord, TrackingType, WeightUnit } from '../../types'
import { Sheet, Button, Stepper, Switch } from '../ui'

interface SetEditSheetProps {
  set: SetRecord
  trackingType?: TrackingType
  weightUnit: WeightUnit
  /** Incrément du stepper de poids (kg). */
  weightStep?: number
  onSave: (updated: SetRecord) => void
  onDelete: (set: SetRecord) => void
  onClose: () => void
}

/** Édition d'une série — champs adaptés au type de suivi. */
export function SetEditSheet({
  set, trackingType = 'weight_reps', weightUnit, weightStep = 2.5, onSave, onDelete, onClose,
}: SetEditSheetProps) {
  const [weightKg, setWeightKg] = useState(set.weightKg)
  const [reps, setReps] = useState(set.reps)
  const [rpe, setRpe] = useState<number | null>(set.rpe ?? null)
  const [warmup, setWarmup] = useState(set.isWarmup)

  return (
    <Sheet title="Modifier la série" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {trackingType === 'weight_reps' && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                Poids ({weightUnit})
              </div>
              <Stepper
                value={weightKg}
                onChange={setWeightKg}
                step={weightStep}
                min={0}
                decimals={weightKg % 1 === 0 ? 0 : 1}
                ariaLabel="Poids"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="t-eyebrow" style={{ marginBottom: 4 }}>Reps</div>
              <Stepper value={reps} onChange={setReps} min={0} ariaLabel="Répétitions" />
            </div>
          </div>
        )}

        {trackingType === 'reps_only' && (
          <div style={{ textAlign: 'center' }}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>Reps</div>
            <Stepper value={reps} onChange={setReps} min={0} ariaLabel="Répétitions" />
          </div>
        )}

        {trackingType === 'time' && (
          <div style={{ textAlign: 'center' }}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>Durée (s)</div>
            <Stepper value={reps} onChange={setReps} step={5} min={5} ariaLabel="Durée en secondes" />
          </div>
        )}

        {trackingType === 'weight_reps' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Switch
              checked={rpe != null}
              onChange={(on) => setRpe(on ? 8 : null)}
              label="RPE"
            />
            <span className="t-caption">RPE</span>
            {rpe != null && (
              <Stepper
                value={rpe}
                onChange={setRpe}
                step={0.5}
                min={6}
                max={10}
                decimals={1}
                ariaLabel="RPE"
              />
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Switch checked={warmup} onChange={setWarmup} label="Échauffement" />
          <span className="t-caption">Série d&apos;échauffement</span>
        </div>

        <Button
          icon="check"
          onClick={() =>
            onSave({
              ...set,
              weightKg: trackingType === 'weight_reps' ? weightKg : 0,
              reps,
              rpe: trackingType === 'weight_reps' ? (rpe ?? undefined) : undefined,
              isWarmup: warmup,
            })
          }
        >
          Enregistrer
        </Button>
        <Button variant="ghost" icon="trash" onClick={() => onDelete(set)}>
          Supprimer la série
        </Button>
      </div>
    </Sheet>
  )
}
