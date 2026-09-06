import { useMemo, useState } from 'react'
import type { MuscleGroup } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { EQUIPMENT_LABEL, MUSCLE_LABEL, MUSCLE_REGIONS } from '../../utils/labels'
import { Card, EmptyState, Icon, Row, Segmented, StatTile } from '../ui'
import { MediaImage } from '../exercises/MediaImage'

export function MyExercisesScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'custom'>('all')
  const [region, setRegion] = useState<string>('all')

  const customCount = useMemo(
    () => store.exercises.filter((e) => e.isCustom).length,
    [store.exercises],
  )

  const visible = useMemo(() => {
    // Normalise le texte pour la recherche : retire les tirets et accents
    const normalize = (s: string) => s.toLowerCase().replace(/[-]/g, '')
    const q = normalize(query.trim())
    const reg = MUSCLE_REGIONS.find((r) => r.key === region)
    const regionSet = reg ? new Set<MuscleGroup>(reg.muscles) : null
    return store.exercises
      .filter((e) => {
        if (q && !normalize(e.name).includes(q)) return false
        if (scope === 'custom' && !e.isCustom) return false
        if (regionSet && !regionSet.has(e.primaryMuscle)) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [store.exercises, query, scope, region])

  // Filtre par groupe musculaire — rangée dédiée (même style que Programmes).
  const regionChips: { key: string; label: string }[] = [
    { key: 'all', label: 'Tous' },
    ...MUSCLE_REGIONS.map((r) => ({ key: r.key, label: r.label })),
  ]

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Mes exercices</h1>
      </div>

      {/* Zone de filtre fixe — toujours visible, hors flux de scroll */}
      <div style={{
        padding: '4px var(--pad-screen) 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 'none',
      }}>
        <input
          className="gt-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un exercice…"
          aria-label="Rechercher"
        />
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'custom', label: 'Perso' },
          ]}
        />
        <div className="gt-chips" role="group" aria-label="Filtrer par groupe musculaire">
          {regionChips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`gt-chip ${region === c.key ? 'gt-chip--active' : ''}`}
              onClick={() => setRegion(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
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
                leading={
                  ex.media ? (
                    <div style={{ width: 46, flex: 'none' }}>
                      <MediaImage
                        blobId={ex.media.blobId}
                        url={ex.media.url}
                        alt=""
                        height={46}
                        radius={10}
                      />
                    </div>
                  ) : undefined
                }
                label={ex.name}
                sub={`${MUSCLE_LABEL[ex.primaryMuscle]} · ${EQUIPMENT_LABEL[ex.equipment]}`}
                value={ex.isCustom ? 'Perso' : undefined}
                chevron
                onClick={() =>
                  // Admin peut tout modifier ; non-admin peut modifier ses exercices perso
                  store.isAdmin || ex.isCustom
                    ? nav.navigate('exerciseForm', { id: ex.id })
                    : nav.navigate('exerciseDetail', { exerciseId: ex.id })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
