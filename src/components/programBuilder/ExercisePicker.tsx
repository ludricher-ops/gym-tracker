import { useMemo, useState } from 'react'
import type { MuscleGroup } from '../../types'
import { useStore } from '../../hooks/useStore'
import { EQUIPMENT_LABEL, MUSCLE_LABEL, MUSCLE_REGIONS } from '../../utils/labels'
import { Sheet, Button, Icon } from '../ui'
import { MediaImage } from '../exercises/MediaImage'

interface ExercisePickerProps {
  onConfirm: (exerciseIds: string[]) => void
  onClose: () => void
  /** Exercices déjà dans la séance — marqués comme ajoutés. */
  alreadyAdded?: string[]
}

export function ExercisePicker({ onConfirm, onClose, alreadyAdded = [] }: ExercisePickerProps) {
  const store = useStore()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const addedSet = useMemo(() => new Set(alreadyAdded), [alreadyAdded])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const reg = MUSCLE_REGIONS.find((r) => r.key === region)
    const regionSet = reg ? new Set<MuscleGroup>(reg.muscles) : null
    return store.exercises
      .filter((e) => {
        if (q && !e.name.toLowerCase().includes(q)) return false
        if (regionSet && !regionSet.has(e.primaryMuscle)) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [store.exercises, query, region])

  const toggle = (id: string) => {
    if (addedSet.has(id)) return
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  return (
    <Sheet title="Ajouter des exercices" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          className="gt-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher…"
          aria-label="Rechercher un exercice"
        />
        <div className="gt-chips">
          <button
            type="button"
            className={`gt-chip ${region === 'all' ? 'gt-chip--active' : ''}`}
            onClick={() => setRegion('all')}
          >
            Tous
          </button>
          {MUSCLE_REGIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`gt-chip ${region === r.key ? 'gt-chip--active' : ''}`}
              onClick={() => setRegion(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '46vh', overflowY: 'auto' }}>
          {visible.map((ex) => {
            const isAdded = addedSet.has(ex.id)
            const isSel = selected.includes(ex.id)
            return (
              <button
                key={ex.id}
                type="button"
                className="gt-row"
                onClick={() => toggle(ex.id)}
                style={isAdded ? { opacity: 0.45 } : undefined}
              >
                {ex.media && (
                  <div style={{ width: 40, flex: 'none' }}>
                    <MediaImage blobId={ex.media.blobId} url={ex.media.url} alt="" height={40} radius={8} />
                  </div>
                )}
                <span className="gt-row__body">
                  <span className="gt-row__label">{ex.name}</span>
                  <span className="gt-row__sub">
                    {MUSCLE_LABEL[ex.primaryMuscle]} · {EQUIPMENT_LABEL[ex.equipment]}
                  </span>
                </span>
                <PickCheck added={isAdded} selected={isSel} />
              </button>
            )
          })}
        </div>

        <Button
          onClick={() => {
            onConfirm(selected)
            onClose()
          }}
          disabled={selected.length === 0}
          icon="plus"
        >
          Ajouter {selected.length > 0 ? `(${selected.length})` : ''}
        </Button>
      </div>
    </Sheet>
  )
}

function PickCheck({ added, selected }: { added: boolean; selected: boolean }) {
  if (added) {
    return (
      <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 600 }}>Ajouté</span>
    )
  }
  return (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        border: `2px solid ${selected ? 'transparent' : 'var(--border)'}`,
        background: selected ? 'var(--accent)' : 'transparent',
        color: 'var(--accent-ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
    >
      {selected && <Icon name="check" size={16} strokeWidth={2.4} />}
    </span>
  )
}
