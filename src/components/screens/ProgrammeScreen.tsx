import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { GOAL_LABEL } from '../../utils/labels'
import { programSummary } from '../../utils/programInfo'
import { startSessionFromTemplate } from '../../utils/sessionOps'
import { Card, EmptyState, Icon, Pill, Row } from '../ui'

type View = 'hub' | 'programmes' | 'seances'

export function ProgrammeScreen() {
  const store = useStore()
  const nav = useNavigation()
  const [view, setView] = useState<View>('hub')

  const mine = useMemo(
    () => store.programs.filter((p) => !p.isTemplate),
    [store.programs],
  )
  const templates = useMemo(
    () =>
      store.programs
        .filter((p) => p.isTemplate)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [store.programs],
  )
  const workoutTemplates = useMemo(
    () => store.workoutTemplates.filter((w) => !w.deleted),
    [store.workoutTemplates],
  )

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

  const startFromWorkout = async (wtId: string) => {
    const wt = store.workoutTemplates.find((w) => w.id === wtId)
    if (!wt) return
    const session = await startSessionFromTemplate(wt, store)
    nav.openModal('session', { sessionId: session.id })
  }

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
            {/* Générer automatiquement */}
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

            {/* Créer manuellement */}
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
            {workoutTemplates.length === 0 ? (
              <EmptyState message="Aucune séance pour l'instant" />
            ) : (
              workoutTemplates.map((wt) => (
                <Row
                  key={wt.id}
                  leading={
                    wt.icon
                      ? <span className="gt-row__icon" style={{ fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{wt.icon}</span>
                      : undefined
                  }
                  icon={wt.icon ? undefined : 'dumbbell'}
                  label={wt.name}
                  chevron
                  onClick={() => startFromWorkout(wt.id)}
                />
              ))
            )}
          </>
        )}

      </div>
    </div>
  )
}
