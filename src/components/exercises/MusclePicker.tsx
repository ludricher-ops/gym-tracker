import { useState } from 'react'
import type { MuscleGroup } from '../../types'
import { MUSCLE_LABEL, MUSCLE_REGIONS } from '../../utils/labels'
import { Sheet, Button } from '../ui'

interface MusclePickerProps {
  mode: 'single' | 'multi'
  value: MuscleGroup[]
  onConfirm: (value: MuscleGroup[]) => void
  onClose: () => void
  /** Muscles à masquer (ex. exclure le muscle principal des secondaires). */
  exclude?: MuscleGroup[]
}

export function MusclePicker({ mode, value, onConfirm, onClose, exclude = [] }: MusclePickerProps) {
  const [sel, setSel] = useState<MuscleGroup[]>(value)

  const toggle = (m: MuscleGroup) => {
    if (mode === 'single') {
      onConfirm([m])
      onClose()
      return
    }
    setSel((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))
  }

  return (
    <Sheet title={mode === 'single' ? 'Groupe musculaire' : 'Groupes secondaires'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MUSCLE_REGIONS.map((region) => {
          const muscles = region.muscles.filter((m) => !exclude.includes(m))
          if (muscles.length === 0) return null
          return (
            <div key={region.key}>
              <p className="t-eyebrow" style={{ marginBottom: 8 }}>
                {region.label}
              </p>
              <div className="gt-chips">
                {muscles.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`gt-chip ${sel.includes(m) ? 'gt-chip--active' : ''}`}
                    onClick={() => toggle(m)}
                  >
                    {MUSCLE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {mode === 'multi' && (
          <Button
            onClick={() => {
              onConfirm(sel)
              onClose()
            }}
          >
            Valider ({sel.length})
          </Button>
        )}
      </div>
    </Sheet>
  )
}
