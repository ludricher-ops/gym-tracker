import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { GOAL_LABEL } from '../../utils/labels'
import { programSummary } from '../../utils/programInfo'
import { Card, EmptyState, Icon, Pill, Row } from '../ui'
import type { WorkoutTemplate, WorkoutType } from '../../types'

type View = 'hub' | 'programmes' | 'seances'

const WORKOUT_FILTER: { key: WorkoutType | 'all'; label: string }[] = [
  { key: 'all',      label: 'Tous'      },
  { key: 'push',     label: 'Push'      },
  { key: 'pull',     label: 'Pull'      },
  { key: 'legs',     label: 'Legs'      },
  { key: 'upper',    label: 'Upper'     },
  { key: 'lower',    label: 'Lower'     },
  { key: 'fullbody', label: 'Full body' },
]

export function ProgrammeScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [view, setView] = useState<View>('hub')
  const [seancesTypeFilter, setSeancesTypeFilter] = useState<WorkoutType | 'all'>('all')

  // ── Données ──────────────────────────────────────────────────────────────────

  const mine = useMemo(
    () => store.programs.filter((p) => !p.isTemplate && p.name !== '__libre__'),
    [store.programs],
  )
  const templates = useMemo(
    () =>
      store.programs
        .filter((p) => p.isTemplate)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [store.programs],
  )

  const allWorkouts = useMemo(
    () => store.workoutTemplates.filter((w) => !w.deleted),
    [store.workoutTemplates],
  )

  type SeanceGroup = {
    programId: string
    label: string
    isTemplate: boolean
    isActive: boolean
    isLibre: boolean
    workouts: WorkoutTemplate[]
  }

  const seanceGroups = useMemo((): SeanceGroup[] => {
    const visible = seancesTypeFilter === 'all'
      ? allWorkouts
      : allWorkouts.filter((w) => w.type === seancesTypeFilter)

    // Grouper par programme
    const byProg = new Map<string, WorkoutTemplate[]>()
    for (const wt of visible) {
      const arr = byProg.get(wt.programId) ?? []
      arr.push(wt)
      byProg.set(wt.programId, arr)
    }

    const groups: SeanceGroup[] = []
    for (const [progId, workouts] of byProg) {
      const prog = store.programs.find((p) => p.id === progId)
      if (!prog) continue
      const isLibre = prog.name === '__libre__'
      groups.push({
        programId: progId,
        label: isLibre ? 'Mes séances' : prog.name,
        isTemplate: prog.isTemplate,
        isActive: prog.isActive,
        isLibre,
        workouts,
      })
    }

    // Tri : standalone en premier, puis programmes actifs, puis inactifs, puis templates
    groups.sort((a, b) => {
      if (a.isLibre !== b.isLibre) return a.isLibre ? -1 : 1
      if (a.isTemplate !== b.isTemplate) return a.isTemplate ? 1 : -1
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return a.label.localeCompare(b.label, 'fr')
    })

    return groups
  }, [allWorkouts, seancesTypeFilter, store.programs])

  // ── Rendu ────────────────────────────────────────────────────────────────────

  const renderProgramRow = (id: string) => {
    const p = store.programs.find((x) => x.id === id)
    if (!p) return null
    const s = programSummary(p, store)
    return (
      <Row
        key={p.id}
        label={p.name}
        sub={`${GOAL_LABEL[p.goal]} · ${s.trainingDays} j/sem · ${s.exerciseCount} exos`}
        value={p.isActive ? <Pill variant="accent">ACTIF</Pill> : undefined}
        chevron
        onClick={() => nav.navigate('programDetail', { id: p.id })}
      />
    )
  }

  const renderSeanceRow = (wt: WorkoutTemplate) => (
    <div
      key={wt.id}
      role="button"
      tabIndex={0}
      onClick={() => nav.navigate('seanceBuilder', { id: wt.id })}
      onKeyDown={(e) => e.key === 'Enter' && nav.navigate('seanceBuilder', { id: wt.id })}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Icône / emoji */}
      <div style={{
        width: 42, minWidth: 42, display: 'flex', alignItems: 'center',
        justifyContent: 'center', paddingLeft: 14,
      }}>
        {wt.icon
          ? <span style={{ fontSize: 20, lineHeight: 1 }}>{wt.icon}</span>
          : <Icon name="dumbbell" size={18} strokeWidth={1.8} />
        }
      </div>
      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 10px' }}>
        <div style={{
          fontWeight: 600, fontSize: 'var(--fs-body)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {wt.name}
        </div>
        {wt.type !== 'custom' && (
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-muted)', marginTop: 2 }}>
            {wt.type.charAt(0).toUpperCase() + wt.type.slice(1)}
          </div>
        )}
      </div>
      <Icon name="chevron-right" size={16} strokeWidth={2}
        style={{ color: 'var(--fg-muted)', marginRight: 12, flexShrink: 0 }} />
    </div>
  )

  const renderGroupHeader = (group: SeanceGroup) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginTop: 16, marginBottom: 6,
    }}>
      {/* Ligne gauche */}
      <div style={{ width: 10, height: 1, background: 'var(--border)', flexShrink: 0 }} />
      {/* Label programme */}
      <span style={{
        fontSize: 'var(--fs-caption)',
        fontWeight: 700,
        color: 'var(--fg-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {group.label}
      </span>
      {group.isActive && <Pill variant="accent">ACTIF</Pill>}
      {group.isTemplate && !group.isLibre && (
        <span style={{
          fontSize: 10, color: 'var(--fg-muted)', opacity: 0.65,
          fontWeight: 500, flexShrink: 0,
        }}>
          template
        </span>
      )}
      {/* Ligne droite */}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {/* Compteur */}
      <span style={{
        fontSize: 'var(--fs-caption)',
        color: 'var(--fg-muted)',
        opacity: 0.65,
        flexShrink: 0,
      }}>
        {group.workouts.length}
      </span>
    </div>
  )

  const title =
    view === 'hub' ? 'Programme'
    : view === 'programmes' ? 'Mes programmes'
    : 'Mes séances'

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        {view !== 'hub' && (
          <button
            className="gt-iconbtn"
            onClick={() => setView('hub')}
            aria-label="Retour"
          >
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
        )}
        <h1 className="gt-topbar__title">{title}</h1>
      </div>

      <div className="gt-screen__scroll">

        {/* ── Hub : 3 boutons + templates ─────────────────────────────── */}
        {view === 'hub' && (
          <>
            <Row
              icon="list"
              label="Mes programmes"
              chevron
              onClick={() => setView('programmes')}
            />
            <Row
              icon="dumbbell"
              label="Mes séances"
              chevron
              onClick={() => setView('seances')}
            />
            <Row
              icon="target"
              label="Mes exercices"
              chevron
              onClick={() => nav.navigate('myExercises')}
            />

            {templates.length > 0 && (
              <>
                <p className="t-eyebrow" style={{ marginTop: 'var(--gap-section, 20px)' }}>
                  Templates disponibles
                </p>
                {templates.map((p) => renderProgramRow(p.id))}
              </>
            )}
          </>
        )}

        {/* ── Mes programmes ──────────────────────────────────────────── */}
        {view === 'programmes' && (
          <>
            <Card variant="accent" onClick={() => nav.navigate('programGenerator')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>
                    Générer mon programme
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', opacity: 0.8 }}>
                    8 questions — programme prêt en 1 min
                  </div>
                </div>
              </div>
            </Card>

            <button
              onClick={() => nav.navigate('programBuilder')}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '12px 16px',
                color: 'var(--fg)',
                fontSize: 'var(--fs-body)',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              + Créer manuellement
            </button>

            {mine.length === 0 ? (
              <EmptyState message="Aucun programme pour l'instant" />
            ) : (
              <>
                <p className="t-eyebrow">Mes programmes</p>
                {mine.map((p) => renderProgramRow(p.id))}
              </>
            )}
          </>
        )}

        {/* ── Mes séances ─────────────────────────────────────────────── */}
        {view === 'seances' && (
          <>
            {/* Générer ma séance */}
            <Card variant="accent" onClick={() => nav.navigate('freeWorkout', { saveAsTemplate: 'true' })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🧠</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>
                    Générer ma séance
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', opacity: 0.8 }}>
                    Wizard IA — séance prête en 1 min
                  </div>
                </div>
              </div>
            </Card>

            {/* Créer manuellement */}
            <button
              onClick={() => nav.navigate('seanceBuilder')}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '12px 16px',
                color: 'var(--fg)',
                fontSize: 'var(--fs-body)',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              + Créer manuellement
            </button>

            {/* Filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {WORKOUT_FILTER.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className="gt-chip"
                  onClick={() => setSeancesTypeFilter(key)}
                  style={{
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: seancesTypeFilter === key ? 'var(--accent)' : undefined,
                    color: seancesTypeFilter === key ? 'var(--accent-ink)' : undefined,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Groupes par programme */}
            {seanceGroups.length === 0 ? (
              allWorkouts.length === 0
                ? <EmptyState message="Aucune séance pour l'instant" />
                : <p className="t-caption" style={{ padding: '16px 0', color: 'var(--fg-muted)', textAlign: 'center' }}>
                    Aucune séance dans cette catégorie
                  </p>
            ) : (
              seanceGroups.map((group) => (
                <div key={group.programId}>
                  {renderGroupHeader(group)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
                    {group.workouts.map(renderSeanceRow)}
                  </div>
                </div>
              ))
            )}
          </>
        )}

      </div>

    </div>
  )
}
