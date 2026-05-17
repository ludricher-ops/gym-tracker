import { useEffect, useMemo, useRef, useState } from 'react'
import type { SetRecord } from '../../../types'
import { useStore } from '../../../hooks/useStore'
import { useNavigation } from '../../../nav/useNavigation'
import { useSessionTimer } from '../../../hooks/useSessionTimer'
import { useRestTimer } from '../../../hooks/useRestTimer'
import { useActiveSession } from '../../../hooks/useActiveSession'
import { isAnyPR } from '../../../utils/pr'
import { isValidSet, repsLookSuspicious } from '../../../utils/setValidation'
import { lastWorkingSet } from '../../../utils/sessionOps'
import { formatClock, formatDuration } from '../../../utils/format'
import { formatWeight } from '../../../utils/units'
import { MUSCLE_LABEL } from '../../../utils/labels'
import {
  playBeep, vibrate, notify, requestNotificationPermission,
} from '../../../utils/feedback'
import {
  Button, Card, Icon, Modal, Pill, ProgressBar, Sheet, Stepper, Switch,
} from '../../ui'
import { ExercisePicker } from '../../programBuilder/ExercisePicker'
import { MediaImage } from '../../exercises/MediaImage'
import { SetTable } from './SetTable'
import { RestTimerBar } from './RestTimerBar'
import { ExerciseTimerBar } from './ExerciseTimerBar'
import { SessionOverviewSheet } from './SessionOverviewSheet'
import { SessionCompleteView } from './SessionCompleteView'
import { SetEditSheet } from '../SetEditSheet'
import { PRCelebrationOverlay, type PRCelebration } from './PRCelebrationOverlay'

interface SessionModalProps {
  sessionId: string
}

export function SessionModal({ sessionId }: SessionModalProps) {
  const store = useStore()
  const nav = useNavigation()
  const act = useActiveSession(sessionId)
  const prefs = store.settings.preferences

  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editSetSheet, setEditSetSheet] = useState<SetRecord | null>(null)
  const [inputW, setInputW] = useState(0)
  const [inputR, setInputR] = useState(0)
  const [inputRpe, setInputRpe] = useState<number | null>(null)
  const [overview, setOverview] = useState(false)
  const [menu, setMenu] = useState(false)
  const [picker, setPicker] = useState<'add' | 'swap' | null>(null)
  const [prFlash, setPrFlash] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<PRCelebration | null>(null)
  const [finished, setFinished] = useState(false)
  const [exitSheet, setExitSheet] = useState(false)
  // Overlay de célébration : une fois par exercice et par séance.
  const celebrated = useRef<Set<string>>(new Set())
  const notifAsked = useRef(false)

  const { session, currentSE, currentExercise, currentSets, doneCount, totalCount } = act
  const elapsed = useSessionTimer(session?.startedAt ?? Date.now())

  const restTimer = useRestTimer(() => {
    if (prefs.restSoundEnabled) playBeep()
    if (prefs.hapticsEnabled) vibrate()
    if (prefs.notificationsEnabled) notify('Repos terminé', 'Place à la prochaine série.')
  })

  const exerciseTimer = useRestTimer(() => {
    if (prefs.restSoundEnabled) playBeep()
    if (prefs.hapticsEnabled) vibrate()
  })

  const currentWET = useMemo(
    () =>
      session && currentSE
        ? store.workoutExerciseTemplates.find(
            (w) =>
              w.workoutTemplateId === session.workoutTemplateId &&
              w.exerciseId === currentSE.exerciseId,
          )
        : undefined,
    [store.workoutExerciseTemplates, session?.workoutTemplateId, currentSE?.exerciseId], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const targetDurationSec = currentWET?.targetDurationSec ?? 30

  const editingSet = editingSetId
    ? currentSets.find((s) => s.id === editingSetId)
    : undefined
  const activeSet: SetRecord | null =
    editingSet && editingSet.completedAt == null
      ? editingSet
      : currentSets.find((s) => s.completedAt == null) ?? null

  // Synchronise la saisie avec la série active.
  useEffect(() => {
    if (activeSet) {
      setInputW(activeSet.weightKg)
      setInputR(
        activeSet.reps !== 0 ? activeSet.reps : trackingType === 'time' ? targetDurationSec : 0,
      )
      setInputRpe(activeSet.rpe ?? null)
      exerciseTimer.skip()
    }
  }, [activeSet?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!prFlash) return
    const id = setTimeout(() => setPrFlash(null), 4000)
    return () => clearTimeout(id)
  }, [prFlash])

  if (!session) {
    return (
      <Modal>
        <div className="gt-screen__scroll">
          <p className="t-caption">Séance introuvable.</p>
          <Button onClick={nav.closeModal}>Fermer</Button>
        </div>
      </Modal>
    )
  }

  if (finished) {
    return (
      <Modal>
        <SessionCompleteView
          sessionId={sessionId}
          onHome={() => nav.closeModal()}
          onRecap={() => {
            nav.navigate('sessionRecap', { sessionId })
            nav.closeModal()
          }}
        />
      </Modal>
    )
  }

  const trackingType = currentExercise?.trackingType ?? 'weight_reps'
  const showWeight = trackingType === 'weight_reps'
  const weightUnit = prefs.weightUnit
  const exerciseCount = act.exercises.length
  const nextExercise = act.exercises[act.exIndex + 1]

  const prev = currentSE ? lastWorkingSet(currentSE.exerciseId, store) : null
  const exercisePR = currentSE
    ? store.personalRecords
        .filter((p) => p.exerciseId === currentSE.exerciseId && p.type === '1rm')
        .sort((a, b) => b.estimated1RM - a.estimated1RM)[0]
    : undefined

  const canValidate = isValidSet(showWeight ? inputW : 0, inputR)

  const validateImpl = async (repsOverride?: number) => {
    if (!activeSet || !currentSE) return
    const reps = repsOverride ?? inputR
    if (!isValidSet(showWeight ? inputW : 0, reps)) return
    exerciseTimer.skip()
    const updated: SetRecord = {
      ...activeSet,
      weightKg: showWeight ? inputW : 0,
      reps,
      rpe: inputRpe ?? undefined,
    }
    const { pr, restSec, sessionDone } = await act.validateSet(updated)
    if (isAnyPR(pr)) {
      const exId = currentSE.exerciseId
      const name = currentExercise?.name ?? 'Exercice'
      if (prefs.prCelebrationEnabled && !celebrated.current.has(exId)) {
        celebrated.current.add(exId)
        setCelebration({
          exerciseName: name,
          weightKg: updated.weightKg,
          reps: updated.reps,
          estimated1RM: pr.estimated1RM,
          previousBest1RM: pr.previousBest1RM,
        })
      } else {
        setPrFlash(name)
      }
    }
    if (sessionDone) {
      await act.finish()
      setFinished(true)
      return
    }
    restTimer.start(restSec)
    if (prefs.notificationsEnabled && !notifAsked.current) {
      notifAsked.current = true
      requestNotificationPermission()
    }
    setEditingSetId(null)
  }
  const validate = () => void validateImpl()

  const onSelectSet = (id: string) => {
    const set = currentSets.find((s) => s.id === id)
    if (!set) return
    if (set.completedAt != null) {
      setEditSetSheet(set) // série faite → sheet d'édition
    } else {
      setEditingSetId(id === editingSetId ? null : id)
    }
  }

  const onPicker = async (ids: string[]) => {
    if (picker === 'swap' && ids[0]) await act.swapExercise(ids[0])
    else if (picker === 'add') await act.addExercises(ids)
  }

  const goNext = () => {
    if (!nextExercise) return
    const unfinished = currentSets.some((s) => s.completedAt == null)
    if (unfinished && !confirm("L'exercice courant n'est pas terminé. Passer au suivant ?"))
      return
    act.goToExercise(act.exIndex + 1)
  }

  const finish = async () => {
    if (doneCount === 0 && !confirm('Terminer une séance sans série validée ?')) return
    await act.finish()
    setFinished(true)
  }

  const close = () => {
    if (doneCount > 0) setExitSheet(true)
    else nav.closeModal()
  }

  const abandon = async () => {
    await act.cancel()
    nav.closeModal()
  }

  return (
    <Modal onRequestClose={close}>
      {/* Barre du haut */}
      <div className="gt-topbar" style={{ paddingBottom: 8 }}>
        <button className="gt-iconbtn" onClick={close} aria-label="Fermer la séance">
          <Icon name="close" size={22} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }} aria-live="polite">
          <div
            className="t-num"
            style={{ fontSize: 20 }}
            role="timer"
            aria-label={`Durée de la séance : ${formatDuration(elapsed)}`}
          >
            {formatDuration(elapsed)}
          </div>
          <div
            className="t-caption"
            style={{ fontSize: 11 }}
            aria-label={`${doneCount} séries validées sur ${totalCount}`}
          >
            {doneCount}/{totalCount} séries
          </div>
        </div>
        <button className="gt-iconbtn" onClick={() => setOverview(true)} aria-label="Vue d'ensemble">
          <Icon name="list" size={22} />
        </button>
        <button className="gt-iconbtn" onClick={() => setMenu(true)} aria-label="Actions">
          <Icon name="grip" size={22} />
        </button>
      </div>
      <div style={{ padding: '0 var(--pad-screen)' }}>
        <ProgressBar value={totalCount ? doneCount / totalCount : 0} />
      </div>

      {/* Corps */}
      <div className="gt-screen__scroll">
        {prFlash && (
          <Card variant="accent">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="bolt" size={22} />
              <div>
                <div style={{ fontWeight: 700 }}>Nouveau record&nbsp;!</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{prFlash}</div>
              </div>
            </div>
          </Card>
        )}

        {!currentSE || !currentExercise ? (
          <Card>
            <p className="t-caption">
              Aucun exercice. Ajoute-en un via le menu pour démarrer.
            </p>
            <div style={{ marginTop: 10 }}>
              <Button icon="plus" onClick={() => setPicker('add')}>
                Ajouter un exercice
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <Pill variant="surface2">{MUSCLE_LABEL[currentExercise.primaryMuscle]}</Pill>
                <span className="t-eyebrow">
                  Ex {act.exIndex + 1}/{exerciseCount}
                </span>
              </div>
              <p className="t-title">{currentExercise.name}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <span className="t-caption">
                  Précédent :{' '}
                  {prev ? `${formatWeight(prev.weightKg, weightUnit)} × ${prev.reps}` : '—'}
                </span>
                <span className="t-caption">
                  PR : {exercisePR ? `${exercisePR.estimated1RM.toFixed(1)} kg` : '—'}
                </span>
              </div>
            </div>

            <SetTable
              sets={currentSets}
              activeSetId={activeSet?.id ?? null}
              trackingType={trackingType}
              weightUnit={weightUnit}
              onSelect={onSelectSet}
            />

            {currentExercise.media && (
              <MediaImage
                blobId={currentExercise.media.blobId}
                url={currentExercise.media.url}
                alt={`Démo : ${currentExercise.name}`}
                aspectRatio={currentExercise.media.aspectRatio}
              />
            )}

            {nextExercise && (
              <Card onClick={goNext}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="t-num" style={{ fontSize: 18, color: 'var(--muted)' }}>
                    {act.exIndex + 2}
                  </span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="t-eyebrow">Suivant</div>
                    <div style={{ fontWeight: 700 }}>
                      {nextExercise.exercise?.name ?? 'Exercice'}
                    </div>
                    <div className="t-caption">
                      {nextExercise.sets.length} série
                      {nextExercise.sets.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <Icon name="chevron-right" size={18} />
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Bas : timer exercice OU timer de repos OU saisie */}
      <div className="gt-primarybar">
        {exerciseTimer.active ? (
          <ExerciseTimerBar
            timer={exerciseTimer}
            onValidate={() => void validateImpl(exerciseTimer.targetSec)}
          />
        ) : restTimer.active ? (
          <RestTimerBar timer={restTimer} />
        ) : (
          currentSE && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trackingType === 'time' ? (
                <>
                  <Button
                    icon="play"
                    onClick={() => {
                      setInputR(targetDurationSec)
                      exerciseTimer.start(targetDurationSec)
                    }}
                  >
                    Démarrer · {formatClock(targetDurationSec)}
                  </Button>
                  <div style={{ textAlign: 'center' }}>
                    <div className="t-eyebrow" style={{ marginBottom: 4 }}>Durée (s)</div>
                    <Stepper
                      value={inputR}
                      onChange={setInputR}
                      step={5}
                      min={5}
                      ariaLabel="Durée en secondes"
                    />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around' }}>
                  {showWeight && (
                    <div style={{ textAlign: 'center' }}>
                      <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                        Poids ({weightUnit})
                      </div>
                      <Stepper
                        value={inputW}
                        onChange={setInputW}
                        step={prefs.weightStep}
                        min={0}
                        decimals={inputW % 1 === 0 ? 0 : 1}
                        ariaLabel="Poids"
                      />
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div className="t-eyebrow" style={{ marginBottom: 4 }}>Reps</div>
                    <Stepper value={inputR} onChange={setInputR} min={0} ariaLabel="Répétitions" />
                  </div>
                </div>
              )}

              {trackingType !== 'time' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Switch
                    checked={inputRpe != null}
                    onChange={(on) => setInputRpe(on ? 8 : null)}
                    label="RPE"
                  />
                  <span className="t-caption">RPE</span>
                  {inputRpe != null && (
                    <Stepper
                      value={inputRpe}
                      onChange={setInputRpe}
                      step={0.5}
                      min={6}
                      max={10}
                      decimals={1}
                      ariaLabel="RPE"
                    />
                  )}
                  {repsLookSuspicious(inputR) && (
                    <span className="t-caption" style={{ color: 'var(--danger)' }}>
                      {inputR} reps ?
                    </span>
                  )}
                </div>
              )}

              <Button onClick={validate} disabled={!canValidate} icon="check">
                Valider la série
              </Button>
            </div>
          )
        )}
      </div>

      {overview && (
        <SessionOverviewSheet
          session={session}
          store={store}
          currentExIndex={act.exIndex}
          onJump={act.goToExercise}
          onReorder={act.reorderExercise}
          onAddExercise={() => setPicker('add')}
          onFinish={finish}
          onClose={() => setOverview(false)}
        />
      )}

      {menu && (
        <Sheet title="Actions" onClose={() => setMenu(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="secondary" icon="plus" onClick={() => { act.addSet(); setMenu(false) }}>
              Ajouter une série
            </Button>
            <Button
              variant="secondary"
              icon="flame"
              onClick={() => {
                if (activeSet) act.toggleSetFlag(activeSet, 'isWarmup')
                setMenu(false)
              }}
            >
              {activeSet?.isWarmup ? 'Retirer l’échauffement' : 'Marquer échauffement'}
            </Button>
            <Button
              variant="secondary"
              icon="bolt"
              onClick={() => {
                if (activeSet) act.toggleSetFlag(activeSet, 'isFailure')
                setMenu(false)
              }}
            >
              {activeSet?.isFailure ? 'Retirer l’échec' : 'Marquer comme échec'}
            </Button>
            <Button
              variant="secondary"
              icon="skip"
              onClick={() => { act.skipExercise(); setMenu(false) }}
            >
              Passer l&apos;exercice
            </Button>
            <Button
              variant="secondary"
              icon="copy"
              onClick={() => { setPicker('swap'); setMenu(false) }}
            >
              Échanger l&apos;exercice
            </Button>
          </div>
        </Sheet>
      )}

      {exitSheet && (
        <Sheet title="Quitter la séance ?" onClose={() => setExitSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button icon="arrow" onClick={() => setExitSheet(false)}>
              Reprendre la séance
            </Button>
            <Button variant="secondary" icon="clock" onClick={() => nav.closeModal()}>
              Sauver le brouillon
            </Button>
            <p className="t-caption">
              Le brouillon reste accessible depuis l&apos;accueil pendant 12 h.
            </p>
            <Button variant="danger" icon="trash" onClick={abandon}>
              Abandonner la séance
            </Button>
          </div>
        </Sheet>
      )}

      {picker && (
        <ExercisePicker
          onConfirm={onPicker}
          onClose={() => setPicker(null)}
          alreadyAdded={
            picker === 'add' ? act.exercises.map((e) => e.se.exerciseId) : []
          }
        />
      )}

      {editSetSheet && (
        <SetEditSheet
          set={editSetSheet}
          trackingType={trackingType}
          weightUnit={weightUnit}
          weightStep={prefs.weightStep}
          onSave={(updated) => {
            act.updateSet(updated)
            setEditSetSheet(null)
          }}
          onDelete={(s) => {
            act.removeSet(s.id)
            setEditSetSheet(null)
          }}
          onClose={() => setEditSetSheet(null)}
        />
      )}

      {celebration && (
        <PRCelebrationOverlay
          pr={celebration}
          weightUnit={weightUnit}
          onContinue={() => setCelebration(null)}
        />
      )}
    </Modal>
  )
}
