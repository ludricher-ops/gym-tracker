import { useMemo, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { GOAL_LABEL, LEVEL_LABEL, WORKOUT_TYPE_LABEL } from '../../utils/labels'
import { programSummary } from '../../utils/programInfo'
import { Button, Card, EmptyState, Icon, Pill, PrimaryBar } from '../ui'
import { deleteProgram } from '../../utils/programOps'
import { ActivationSheet } from '../programBuilder/ActivationSheet'
import { WEEKDAYS, WEEKDAY_LABEL } from '../programBuilder/programDraft'

export function ProgramDetailScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const id = params?.id as string | undefined
  const program = useMemo(
    () => store.programs.find((p) => p.id === id),
    [store.programs, id],
  )
  const [sheet, setSheet] = useState(false)

  if (!program) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <span className="gt-topbar__title">Programme</span>
        </div>
        <div className="gt-screen__scroll">
          <EmptyState icon="info" title="Programme introuvable" />
        </div>
      </div>
    )
  }

  const summary = programSummary(program, store)
  const assignedWtIds = new Set(Object.values(program.weekTemplate).filter(Boolean) as string[])
  const workouts = store.workoutTemplates
    .filter((w) => w.programId === program.id && assignedWtIds.has(w.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  const del = async () => {
    const warn = program.isActive ? ' Ce programme est actuellement actif.' : ''
    if (!confirm(`Supprimer le programme « ${program.name} » ?${warn}`)) return
    await deleteProgram(program, store)
    nav.back()
  }

  const exerciseNames = (workoutTemplateId: string) =>
    store.workoutExerciseTemplates
      .filter((e) => e.workoutTemplateId === workoutTemplateId)
      .sort((a, b) => a.order - b.order)
      .map((e) => store.exercises.find((x) => x.id === e.exerciseId)?.name)
      .filter(Boolean)

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <span className="gt-topbar__title">{program.isTemplate ? 'Template' : 'Programme'}</span>
        {program.isActive && <Pill variant="accent">ACTIF</Pill>}
      </div>

      <div className="gt-screen__scroll">
        <Card variant="accent">
          <p className="t-eyebrow" style={{ color: 'var(--accent-ink)', opacity: 0.7 }}>
            {GOAL_LABEL[program.goal]}
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{program.name}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            <Metric value={String(program.durationWeeks)} label="semaines" />
            <Metric value={String(summary.trainingDays)} label="jours/sem" />
            <Metric value={String(summary.exerciseCount)} label="exercices" />
            <Metric value={LEVEL_LABEL[program.level]} label="niveau" />
          </div>
        </Card>

        <div>
          <p className="t-eyebrow" style={{ marginBottom: 8 }}>
            Rythme hebdomadaire
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {WEEKDAYS.map((day) => {
              const wtId = program.weekTemplate[day]
              const wt = wtId ? workouts.find((w) => w.id === wtId) : undefined
              return (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 0',
                    borderRadius: 8,
                    background: wt ? 'var(--accent)' : 'var(--surface2)',
                    color: wt ? 'var(--accent-ink)' : 'var(--dim)',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{WEEKDAY_LABEL[day]}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2 }}>
                    {wt ? WORKOUT_TYPE_LABEL[wt.type] : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="t-eyebrow">Séances</p>
        {workouts.map((w) => {
          const names = exerciseNames(w.id)
          return (
            <Card key={w.id}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{w.name}</div>
              <div className="t-caption" style={{ marginTop: 4 }}>
                {names.length ? names.join(' · ') : 'Aucun exercice'}
              </div>
            </Card>
          )
        })}

        {!program.isTemplate && (
          <Button variant="ghost" icon="trash" onClick={del}>
            Supprimer le programme
          </Button>
        )}
      </div>

      <PrimaryBar>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => nav.navigate('programBuilder', { fromProgramId: program.id })}
            >
              Personnaliser
            </Button>
          </div>
          {!program.isActive && (
            <div style={{ flex: 1 }}>
              <Button icon="check" onClick={() => setSheet(true)}>
                Utiliser
              </Button>
            </div>
          )}
        </div>
      </PrimaryBar>

      {sheet && (
        <ActivationSheet
          program={program}
          store={store}
          onClose={() => setSheet(false)}
          onActivated={() => {
            setSheet(false)
            nav.switchTab('today')
          }}
        />
      )}
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, opacity: 0.75 }}>{label}</div>
    </div>
  )
}
