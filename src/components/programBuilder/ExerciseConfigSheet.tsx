import { useState } from 'react'
import type { RepsMode, TrackingType } from '../../types'
import { REPS_MODE_LABEL } from '../../utils/labels'
import { Sheet, Button, Segmented, Stepper, Switch } from '../ui'
import type { DraftWE } from './programDraft'

interface ExerciseConfigSheetProps {
  we: DraftWE
  exerciseName: string
  trackingType: TrackingType
  onChange: (next: DraftWE) => void
  onRemove: () => void
  onClose: () => void
}

const REST_PRESETS = [60, 90, 120, 180]
const SUPERSETS = ['A', 'B', 'C']

export function ExerciseConfigSheet({
  we, exerciseName, trackingType, onChange, onRemove, onClose,
}: ExerciseConfigSheetProps) {
  const [d, setD] = useState<DraftWE>(we)
  const patch = (p: Partial<DraftWE>) => setD((prev) => ({ ...prev, ...p }))
  const isTime = trackingType === 'time'

  const setMode = (mode: RepsMode) => {
    if (mode === 'range') {
      patch({ repsMode: mode, targetRepsMax: d.targetRepsMax ?? d.targetRepsMin + 4 })
    } else {
      patch({ repsMode: mode, targetRepsMax: undefined })
    }
  }

  const save = () => {
    onChange(d)
    onClose()
  }

  return (
    <Sheet title={exerciseName} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Séries">
          <Stepper
            value={d.targetSets}
            onChange={(v) => patch({ targetSets: v })}
            min={1}
            max={12}
            ariaLabel="Séries"
          />
        </Field>

        {isTime ? (
          <Field label="Durée par série">
            <Stepper
              value={d.targetDurationSec ?? 30}
              onChange={(v) => patch({ targetDurationSec: v })}
              step={5}
              min={5}
              max={3600}
              unit="s"
              ariaLabel="Durée en secondes"
            />
          </Field>
        ) : (
          <>
            <Field label="Mode de répétitions">
              <Segmented
                value={d.repsMode}
                onChange={setMode}
                options={[
                  { value: 'fixed', label: REPS_MODE_LABEL.fixed },
                  { value: 'range', label: REPS_MODE_LABEL.range },
                  { value: 'amrap', label: REPS_MODE_LABEL.amrap },
                ]}
              />
            </Field>

            {d.repsMode === 'range' ? (
              <div style={{ display: 'flex', gap: 16 }}>
                <Field label="Reps min">
                  <Stepper
                    value={d.targetRepsMin}
                    onChange={(v) => patch({ targetRepsMin: v, targetRepsMax: Math.max(v, d.targetRepsMax ?? v) })}
                    min={1}
                    max={30}
                    ariaLabel="Répétitions minimum"
                  />
                </Field>
                <Field label="Reps max">
                  <Stepper
                    value={d.targetRepsMax ?? d.targetRepsMin}
                    onChange={(v) => patch({ targetRepsMax: Math.max(d.targetRepsMin, v) })}
                    min={1}
                    max={40}
                    ariaLabel="Répétitions maximum"
                  />
                </Field>
              </div>
            ) : (
              <Field label={d.repsMode === 'amrap' ? 'Reps minimum visées' : 'Répétitions'}>
                <Stepper
                  value={d.targetRepsMin}
                  onChange={(v) => patch({ targetRepsMin: v })}
                  min={1}
                  max={40}
                  ariaLabel="Répétitions"
                />
              </Field>
            )}

            <Field label="RPE cible">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Switch
                  checked={d.targetRPE != null}
                  onChange={(on) => patch({ targetRPE: on ? 8 : undefined })}
                  label="Activer le RPE cible"
                />
                {d.targetRPE != null && (
                  <Stepper
                    value={d.targetRPE}
                    onChange={(v) => patch({ targetRPE: v })}
                    step={0.5}
                    min={6}
                    max={10}
                    decimals={1}
                    ariaLabel="RPE cible"
                  />
                )}
              </div>
            </Field>

            <Field label="Progression automatique">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Switch
                  checked={d.autoProgress}
                  onChange={(on) => patch({ autoProgress: on })}
                  label="Progression automatique"
                />
                <span className="t-caption">
                  +{d.progressStepKg} kg quand le haut de fourchette est atteint
                </span>
              </div>
            </Field>
          </>
        )}

        <Field label="Temps de repos">
          <div className="gt-chips" style={{ marginBottom: 8 }}>
            {REST_PRESETS.map((sec) => (
              <button
                key={sec}
                type="button"
                className={`gt-chip ${d.restSec === sec ? 'gt-chip--active' : ''}`}
                onClick={() => patch({ restSec: sec })}
              >
                {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
              </button>
            ))}
          </div>
          <Stepper
            value={d.restSec}
            onChange={(v) => patch({ restSec: v })}
            step={15}
            min={15}
            max={600}
            unit="s"
            ariaLabel="Temps de repos en secondes"
          />
        </Field>

        <Field label="Superset">
          <div className="gt-chips">
            <button
              type="button"
              className={`gt-chip ${!d.supersetGroup ? 'gt-chip--active' : ''}`}
              onClick={() => patch({ supersetGroup: undefined })}
            >
              Aucun
            </button>
            {SUPERSETS.map((g) => (
              <button
                key={g}
                type="button"
                className={`gt-chip ${d.supersetGroup === g ? 'gt-chip--active' : ''}`}
                onClick={() => patch({ supersetGroup: g })}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notes">
          <textarea
            className="gt-textarea"
            value={d.notes ?? ''}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Tempo, variante, point d'attention…"
          />
        </Field>

        <Button onClick={save} icon="check">
          Enregistrer
        </Button>
        <Button variant="ghost" icon="trash" onClick={() => { onRemove(); onClose() }}>
          Retirer de la séance
        </Button>
      </div>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="gt-field" style={{ flex: 1 }}>
      <span className="gt-field__label">{label}</span>
      {children}
    </div>
  )
}
