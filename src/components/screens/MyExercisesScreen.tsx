import { useMemo, useState } from 'react'
import type { MuscleGroup } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { EQUIPMENT_LABEL, MUSCLE_LABEL, MUSCLE_REGIONS } from '../../utils/labels'
import { Card, EmptyState, Icon, Row, StatTile } from '../ui'

type Filter = 'all' | 'custom' | string

export function MyExercisesScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const customCount = useMemo(
    () => store.exercises.filter((e) => e.isCustom).length,
    [store.exercises],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const region = MUSCLE_REGIONS.find((r) => r.key === filter)
    const regionSet = region ? new Set<MuscleGroup>(region.muscles) : null
    return store.exercises
      .filter((e) => {
        if (q && !e.name.toLowerCase().includes(q)) return false
        if (filter === 'custom' && !e.isCustom) return false
        if (regionSet && !regionSet.has(e.primaryMuscle)) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [store.exercises, query, filter])

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'custom', label: 'Perso' },
    ...MUSCLE_REGIONS.map((r) => ({ key: r.key, label: r.label })),
  ]

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <span className="gt-topbar__title">Mes exercices</span>
      </div>

      <div className="gt-screen__scroll">
        <div className="gt-statrow">
          <StatTile label="Exercices perso" value={String(customCount)} />
          <StatTile label="Bibliothèque" value={String(store.exercises.length)} />
        </div>

        <Card variant="accent" onClick={() => nav.navigate('exerciseForm')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="plus" size={24} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Créer un exercice</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Une variation ou un exercice spécifique
              </div>
            </div>
          </div>
        </Card>

        <input
          className="gt-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un exercice…"
          aria-label="Rechercher"
        />

        <div className="gt-chips gt-chips--scroll">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`gt-chip ${filter === c.key ? 'gt-chip--active' : ''}`}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon="search"
            title="Aucun exercice"
            sub="Aucun exercice ne correspond à ce filtre."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((ex) => (
              <Row
                key={ex.id}
                icon="dumbbell"
                label={ex.name}
                sub={`${MUSCLE_LABEL[ex.primaryMuscle]} · ${EQUIPMENT_LABEL[ex.equipment]}`}
                value={ex.isCustom ? 'Perso' : undefined}
                chevron
                onClick={() => nav.navigate('exerciseForm', { id: ex.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
