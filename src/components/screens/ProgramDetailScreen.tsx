import { useMemo, useState, useCallback } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import type { ScreenProps } from '../../nav/screenRegistry'
import { GOAL_LABEL, LEVEL_LABEL, WORKOUT_TYPE_LABEL } from '../../utils/labels'
import { programSummary } from '../../utils/programInfo'
import { Button, Card, EmptyState, Icon, Pill, PrimaryBar, Sheet } from '../ui'
import { deleteProgram, deactivateProgram } from '../../utils/programOps'
import { ActivationSheet } from '../programBuilder/ActivationSheet'
import { WEEKDAYS, WEEKDAY_LABEL } from '../programBuilder/programDraft'
import type { WorkoutTemplate } from '../../types'

/** Formate les séries + reps d'un WET pour l'affichage dans le sheet. */
function fmtSets(sets: number, repsMin: number, repsMax?: number, durSec?: number): string {
  if (durSec) return `${sets} × ${durSec} s`
  if (repsMax && repsMax !== repsMin) return `${sets} × ${repsMin}–${repsMax} reps`
  return `${sets} × ${repsMin} reps`
}

export function ProgramDetailScreen({ params }: ScreenProps) {
  const store = useStore()
  const nav = useNavigation()
  const id = typeof params?.id === 'string' ? params.id : undefined
  const program = useMemo(
    () => store.programs.find((p) => p.id === id),
    [store.programs, id],
  )
  const [sheet, setSheet] = useState(false)
  const [previewWorkout, setPreviewWorkout] = useState<WorkoutTemplate | null>(null)
  const [editingIconFor, setEditingIconFor] = useState<string | null>(null)

  const handleSaveIcon = useCallback(async (wt: WorkoutTemplate, emoji: string | null) => {
    await store.workoutTemplate.save({ ...wt, icon: emoji ?? undefined })
    setEditingIconFor(null)
  }, [store])

  if (!program) {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Programme</h1>
        </div>
        <div className="gt-screen__scroll">
          <EmptyState icon="info" title="Programme introuvable" />
        </div>
      </div>
    )
  }

  const summary = programSummary(program, store)
  // Associe chaque workoutTemplate à son jour de semaine pour le tri et l'affichage
  const workoutsWithDay = useMemo(() => {
    const assignedIds = new Set(Object.values(program.weekTemplate).filter(Boolean) as string[])
    const dayOrder = Object.fromEntries(WEEKDAYS.map((d, i) => [d, i]))
    // wtId → premier jour de la semaine où cette séance apparaît
    const wtDay: Record<string, string> = {}
    for (const [day, wtId] of Object.entries(program.weekTemplate)) {
      if (wtId && !(wtId in wtDay)) wtDay[wtId] = day
    }
    return store.workoutTemplates
      .filter((w) => w.programId === program.id && assignedIds.has(w.id))
      .map((w) => ({ wt: w, day: wtDay[w.id] ?? '' }))
      .sort((a, b) => (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99))
  }, [store.workoutTemplates, program.id, program.weekTemplate])

  const workouts = useMemo(() => workoutsWithDay.map((x) => x.wt), [workoutsWithDay])

  const canEdit = !program.isTemplate || store.isAdmin

  const del = async () => {
    const warn = program.isActive ? ' Ce programme est actuellement actif.' : ''
    if (!confirm(`Supprimer le programme « ${program.name} » ?${warn}`)) return
    await deleteProgram(program, store)
    nav.back()
  }

  const stop = async () => {
    if (!confirm(`Arrêter le programme « ${program.name} » ?`)) return
    await deactivateProgram(program, store)
    nav.back()
  }

  /** Retourne les WETs d'un workout avec exercice + média associé, triés par ordre. */
  const wetInfos = (workoutTemplateId: string) =>
    store.workoutExerciseTemplates
      .filter((e) => e.workoutTemplateId === workoutTemplateId && !e.deleted)
      .sort((a, b) => a.order - b.order)
      .map((wet) => {
        const ex = store.exercises.find((x) => x.id === wet.exerciseId)
        return { wet, ex }
      })
      .filter(({ ex }) => ex !== undefined)

  /** WETs du workout actuellement affiché dans le sheet de prévisualisation. */
  const previewInfos = useMemo(
    () => (previewWorkout ? wetInfos(previewWorkout.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewWorkout, store.workoutExerciseTemplates, store.exercises],
  )

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">{program.isTemplate ? 'Template' : 'Programme'}</h1>
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
                  {wt?.icon && (
                    <div style={{ fontSize: 14, lineHeight: 1, marginTop: 2 }}>{wt.icon}</div>
                  )}
                  <div style={{ fontSize: 9, fontWeight: 600, marginTop: wt?.icon ? 1 : 2 }}>
                    {wt ? (wt.type === 'custom' ? wt.name : WORKOUT_TYPE_LABEL[wt.type]) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="t-eyebrow">Séances</p>
        {workoutsWithDay.map(({ wt: w, day }) => {
          const infos = wetInfos(w.id)
          const dayLabel = day ? WEEKDAY_LABEL[day as keyof typeof WEEKDAY_LABEL] : undefined
          return (
            <Card key={w.id} style={{ padding: 0, overflow: 'clip' }}>
              {/* En-tête cliquable → ouvre le sheet de prévisualisation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px 8px',
                }}
              >
                {/* Bouton emoji — ouvre le picker si canEdit */}
                <button
                  type="button"
                  onClick={() => canEdit ? setEditingIconFor(w.id) : undefined}
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--surface2)', border: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: canEdit ? 'pointer' : 'default',
                    fontSize: 22, marginRight: 12,
                  }}
                  aria-label="Changer l'icône"
                >
                  {w.icon ?? '💪'}
                </button>
                {/* Nom + infos — clique pour ouvrir le sheet d'exercices */}
                <button
                  type="button"
                  onClick={() => setPreviewWorkout(w)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0,
                  }}
                  aria-label={`Voir les exercices de ${w.name}`}
                >
                  <div>
                    {dayLabel && (
                      <div className="t-eyebrow" style={{ marginBottom: 2 }}>{dayLabel}</div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{w.name}</div>
                    <div className="t-caption" style={{ marginTop: 2, color: 'var(--dim)' }}>
                      {infos.length} exercice{infos.length > 1 ? 's' : ''} · Voir les images
                    </div>
                  </div>
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>

              {/* Strip de miniatures — tous les exercices */}
              {infos.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    padding: '0 14px 12px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                  }}
                >
                  {infos.map(({ wet, ex }) => (
                    <button
                      key={wet.id}
                      onClick={() => setPreviewWorkout(w)}
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      aria-label={ex?.name}
                    >
                      <ExThumb url={ex?.media?.url} />
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--dim)',
                          maxWidth: 52,
                          textAlign: 'center',
                          lineHeight: 1.2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ex?.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )
        })}

        {canEdit && (
          <Button variant="ghost" icon="trash" onClick={del}>
            Supprimer le programme
          </Button>
        )}
      </div>

      <PrimaryBar>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && (
            <div style={{ flex: 1 }}>
              <Button
                variant="secondary"
                icon="edit"
                onClick={() => nav.navigate('programBuilder', { fromProgramId: program.id })}
              >
                Personnaliser
              </Button>
            </div>
          )}
          {!program.isActive && (
            <div style={{ flex: 1 }}>
              <Button icon="check" onClick={() => setSheet(true)}>
                Utiliser
              </Button>
            </div>
          )}
          {program.isActive && (
            <div style={{ flex: 1 }}>
              <Button variant="ghost" icon="pause" onClick={stop}>
                Arrêter
              </Button>
            </div>
          )}
        </div>
      </PrimaryBar>

      {/* Sheet activation programme */}
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

      {/* Sheet prévisualisation exercices */}
      {previewWorkout && (
        <Sheet
          title={previewWorkout.name}
          onClose={() => setPreviewWorkout(null)}
        >
          <ExercisePreviewList infos={previewInfos} />
        </Sheet>
      )}

      {/* Sheet picker icône séance */}
      {editingIconFor && (() => {
        const targetWt = workouts.find((w) => w.id === editingIconFor)
        if (!targetWt) return null
        return (
          <Sheet title="Icône de la séance" onClose={() => setEditingIconFor(null)}>
            <EmojiPicker
              current={targetWt.icon}
              onSelect={(e) => void handleSaveIcon(targetWt, e)}
            />
          </Sheet>
        )
      })()}
    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

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

/** Vignette 60×60 avec image GIF ou icône de fallback.
 *  object-position: center 70% pour cadrer sous le logo fitnessprogramer.com */
function ExThumb({ url }: { url?: string }) {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 12,
        background: 'var(--surface2)',
        border: '0.5px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 70%' }}
          onError={(e) => {
            const img = e.currentTarget
            img.style.display = 'none'
            const parent = img.parentElement
            if (parent) {
              const icon = document.createElement('span')
              icon.textContent = '💪'
              icon.style.fontSize = '20px'
              parent.appendChild(icon)
            }
          }}
        />
      ) : (
        <Icon name="dumbbell" size={20} />
      )}
    </div>
  )
}

type WetInfo = {
  wet: import('../../types').WorkoutExerciseTemplate
  ex: import('../../types').Exercise | undefined
}

/** Liste complète des exercices dans le bottom sheet, groupée par type. */
function ExercisePreviewList({ infos }: { infos: WetInfo[] }) {
  const warmup = infos.filter(({ wet }) => wet.isWarmup)
  const abs = infos.filter(({ wet }) => wet.isAb)
  const main = infos.filter(({ wet }) => !wet.isWarmup && !wet.isAb)

  return (
    <div>
      {warmup.length > 0 && (
        <>
          <SectionLabel>Échauffement</SectionLabel>
          {warmup.map((info) => <ExRow key={info.wet.id} info={info} />)}
        </>
      )}
      {main.length > 0 && (
        <>
          <SectionLabel>Principal</SectionLabel>
          {main.map((info) => <ExRow key={info.wet.id} info={info} />)}
        </>
      )}
      {abs.length > 0 && (
        <>
          <SectionLabel>Abdominaux</SectionLabel>
          {abs.map((info) => <ExRow key={info.wet.id} info={info} />)}
        </>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="t-eyebrow"
      style={{ padding: '10px 20px 4px', color: 'var(--dim)' }}
    >
      {children}
    </div>
  )
}

// ─── Picker d'icône emoji ─────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '💪', '🏋️', '🏃', '🚴', '🤸', '🏊', '🧘',
  '⚽', '🏀', '🎾', '🥊', '🏈', '🏐', '🎿',
  '🔥', '⚡', '🎯', '🦵', '🤼', '🧗', '🏇',
  '🎽', '🥅', '🏋️‍♀️',
]

function EmojiPicker({
  current,
  onSelect,
}: {
  current?: string
  onSelect: (emoji: string | null) => void
}) {
  return (
    <div style={{ padding: '8px 16px 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
        }}
      >
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onSelect(e)}
            style={{
              fontSize: 26,
              lineHeight: 1,
              padding: '10px 0',
              borderRadius: 12,
              background: e === current ? 'var(--accent)' : 'var(--surface2)',
              border: '0.5px solid var(--border)',
              cursor: 'pointer',
            }}
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>
      {current && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '10px 0',
            borderRadius: 10,
            background: 'none',
            border: '0.5px solid var(--border)',
            color: 'var(--dim)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Supprimer l'icône
        </button>
      )}
    </div>
  )
}

function ExRow({ info: { wet, ex } }: { info: WetInfo }) {
  const setsLabel = fmtSets(
    wet.targetSets,
    wet.targetRepsMin,
    wet.targetRepsMax,
    wet.targetDurationSec,
  )
  const hasSupersetBadge = wet.supersetGroup != null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 20px',
        borderBottom: '0.5px solid var(--border)',
      }}
    >
      <ExThumb url={ex?.media?.url} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ex?.name ?? '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 1 }}>
          {setsLabel}
          {hasSupersetBadge && (
            <span
              style={{
                marginLeft: 6,
                padding: '1px 5px',
                borderRadius: 4,
                background: 'var(--surface2)',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--accent)',
                textTransform: 'uppercase',
              }}
            >
              SS
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
