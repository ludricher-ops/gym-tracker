import { useEffect, useMemo, useRef, useState } from 'react'
import type { SetRecord } from '../../../types'
import { useStore } from '../../../hooks/useStore'
import { useNavigation } from '../../../nav/useNavigation'
import { useSessionTimer } from '../../../hooks/useSessionTimer'
import { useRestTimer } from '../../../hooks/useRestTimer'
import { isAnyPR } from '../../../utils/pr'
import {
  deleteSession, finalizeSession, lastWorkingSet, validateSet,
} from '../../../utils/sessionOps'
import { formatDuration } from '../../../utils/format'
import { formatWeight } from '../../../utils/units'
import { MUSCLE_LABEL } from '../../../utils/labels'
import { playBeep, vibrate } from '../../../utils/feedback'
import { uuid } from '../../../utils/uuid'
import {
  Button, Card, Icon, Modal, Pill, ProgressBar, Sheet, Stepper, Switch,
} from '../../ui'
import { ExercisePicker } from '../../programBuilder/ExercisePicker'
import { SetTable } from './SetTable'
import { RestTimerBar } from './RestTimerBar'
import { SessionOverviewSheet } from './SessionOverviewSheet'
import { SessionCompleteView } from './SessionCompleteView'
import { PRCelebrationOverlay, type PRCelebration } from './PRCelebrationOverlay'

interface SessionModalProps {
  sessionId: string
}

export function SessionModal({ sessionId }: SessionModalProps) {
  const store = useStore()
  const nav = useNavigation()

  const [exIndex, setExIndex] = useState(0)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [inputW, setInputW] = useState(0)
  const [inputR, setInputR] = useState(0)
  const [inputRpe, setInputRpe] = useState<number | null>(null)
  const [overview, setOverview] = useState(false)
  const [menu, setMenu] = useState(false)
  const [picker, setPicker] = useState<'add' | 'swap' | null>(null)
  const [prFlash, setPrFlash] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<PRCelebration | null>(null)
  const [finished, setFinished] = useState(false)
  // Exercices ayant déjà eu un overlay de célébration (1 max par exercice).
  const celebrated = useRef<Set<string>>(new Set())

  const session = store.sessions.find((s) => s.id === sessionId)
  const elapsed = useSessionTimer(session?.startedAt ?? Date.now())

  const restTimer = useRestTimer(() => {
    if (store.settings.preferences.restSoundEnabled) playBeep()
    if (store.settings.preferences.hapticsEnabled) vibrate()
  })

  const sessionExercises = useMemo(
    () =>
      store.sessionExercises
        .filter((se) => se.sessionId === sessionId)
        .sort((a, b) => a.order - b.order),
    [store.sessionExercises, sessionId],
  )

  const currentSE = sessionExercises[exIndex]
  const currentExercise = store.exercises.find((e) => e.id === currentSE?.exerciseId)
  const currentSets = useMemo(
    () =>
      store.sets
        .filter((s) => s.sessionExerciseId === currentSE?.id)
        .sort((a, b) => a.index - b.index),
    [store.sets, currentSE?.id],
  )

  const activeSet: SetRecord | null = editingSetId
    ? currentSets.find((s) => s.id === editingSetId) ?? null
    : currentSets.find((s) => s.completedAt == null) ?? null

  // Synchronise les champs de saisie avec la série active.
  useEffect(() => {
    if (activeSet) {
      setInputW(activeSet.weightKg)
      setInputR(activeSet.reps)
      setInputRpe(activeSet.rpe ?? null)
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

  const allSets = store.sets.filter((s) =>
    sessionExercises.some((se) => se.id === s.sessionExerciseId),
  )
  const doneCount = allSets.filter((s) => s.completedAt != null).length
  const totalCount = allSets.length
  const trackingType = currentExercise?.trackingType ?? 'weight_reps'
  const showWeight = trackingType === 'weight_reps'
  const weightUnit = store.settings.preferences.weightUnit

  const restSec =
    store.workoutExerciseTemplates.find(
      (w) =>
        w.workoutTemplateId === session.workoutTemplateId &&
        w.exerciseId === currentSE?.exerciseId,
    )?.restSec ?? store.settings.preferences.defaultRestSec

  const prev = currentSE ? lastWorkingSet(currentSE.exerciseId, store) : null
  const exercisePR = currentSE
    ? store.personalRecords
        .filter((p) => p.exerciseId === currentSE.exerciseId && p.type === '1rm')
        .sort((a, b) => b.estimated1RM - a.estimated1RM)[0]
    : undefined

  const canValidate = inputR > 0 && (!showWeight || inputW > 0)

  const validate = async () => {
    if (!activeSet || !currentSE || !canValidate) return
    const updated: SetRecord = {
      ...activeSet,
      weightKg: showWeight ? inputW : 0,
      reps: inputR,
      rpe: inputRpe ?? undefined,
    }
    const wasPlanned = activeSet.completedAt == null
    if (wasPlanned) {
      const pr = await validateSet(updated, currentSE.exerciseId, store)
      if (isAnyPR(pr)) {
        const exId = currentSE.exerciseId
        const name = currentExercise?.name ?? 'Exercice'
        // Overlay festif : une fois par exercice et par séance ; sinon
        // simple bandeau discret.
        if (store.settings.preferences.prCelebrationEnabled && !celebrated.current.has(exId)) {
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
      restTimer.start(restSec)
      const remaining = currentSets.filter(
        (s) => s.completedAt == null && s.id !== activeSet.id,
      ).length
      if (remaining === 0 && exIndex < sessionExercises.length - 1) {
        setExIndex(exIndex + 1)
      }
    } else {
      await store.set.save(updated)
    }
    setEditingSetId(null)
  }

  const addSet = async () => {
    if (!currentSE) return
    const last = currentSets[currentSets.length - 1]
    await store.set.save({
      id: uuid(),
      sessionExerciseId: currentSE.id,
      index: currentSets.length,
      weightKg: last?.weightKg ?? inputW,
      reps: last?.reps ?? inputR,
      isWarmup: false,
      isFailure: false,
      isPersonalRecord: false,
    })
  }

  const toggleFlag = async (flag: 'isWarmup' | 'isFailure') => {
    if (!activeSet) return
    await store.set.save({ ...activeSet, [flag]: !activeSet[flag] })
  }

  const onPicker = async (ids: string[]) => {
    if (picker === 'swap' && currentSE && ids[0]) {
      await store.sessionExercise.save({ ...currentSE, exerciseId: ids[0] })
    } else if (picker === 'add') {
      let order = sessionExercises.length
      for (const id of ids) {
        const seId = uuid()
        await store.sessionExercise.save({ id: seId, sessionId, exerciseId: id, order: order++ })
        // Une seule série par défaut — l'utilisateur en ajoute via le menu.
        await store.set.save({
          id: uuid(),
          sessionExerciseId: seId,
          index: 0,
          weightKg: 0,
          reps: 8,
          isWarmup: false,
          isFailure: false,
          isPersonalRecord: false,
        })
      }
    }
  }

  const finish = async () => {
    if (doneCount === 0 && !confirm('Terminer une séance sans série validée ?')) return
    await finalizeSession(session, store)
    setFinished(true)
  }

  const close = () => {
    if (doneCount > 0 && !confirm('Quitter la séance ? Tu pourras la reprendre plus tard.'))
      return
    nav.closeModal()
  }

  const cancelSession = async () => {
    if (!confirm('Annuler la séance ? Elle ne sera pas enregistrée et sera supprimée.'))
      return
    await deleteSession(session, store)
    nav.closeModal()
  }

  return (
    <Modal onRequestClose={close}>
      {/* Barre du haut */}
      <div className="gt-topbar" style={{ paddingBottom: 8 }}>
        <button className="gt-iconbtn" onClick={close} aria-label="Fermer la séance">
          <Icon name="close" size={22} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="t-num" style={{ fontSize: 20 }}>
            {formatDuration(elapsed)}
          </div>
          <div className="t-caption" style={{ fontSize: 11 }}>
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
                  Ex {exIndex + 1}/{sessionExercises.length}
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
              onSelect={(id) => setEditingSetId(id === editingSetId ? null : id)}
            />

            {exIndex < sessionExercises.length - 1 && (
              <p className="t-caption">
                Suivant :{' '}
                {store.exercises.find(
                  (e) => e.id === sessionExercises[exIndex + 1].exerciseId,
                )?.name ?? '—'}
              </p>
            )}
          </>
        )}
      </div>

      {/* Bas : timer de repos OU saisie */}
      <div className="gt-primarybar">
        {restTimer.active ? (
          <RestTimerBar timer={restTimer} />
        ) : (
          currentSE && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around' }}>
                {showWeight && (
                  <div style={{ textAlign: 'center' }}>
                    <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                      Poids ({weightUnit})
                    </div>
                    <Stepper
                      value={inputW}
                      onChange={setInputW}
                      step={2.5}
                      min={0}
                      decimals={inputW % 1 === 0 ? 0 : 1}
                      ariaLabel="Poids"
                    />
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                    {trackingType === 'time' ? 'Secondes' : 'Reps'}
                  </div>
                  <Stepper value={inputR} onChange={setInputR} min={0} ariaLabel="Répétitions" />
                </div>
              </div>

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
                {inputR > 30 && (
                  <span className="t-caption" style={{ color: 'var(--danger)' }}>
                    {inputR} reps ?
                  </span>
                )}
              </div>

              <Button onClick={validate} disabled={!canValidate} icon="check">
                {activeSet?.completedAt != null ? 'Mettre à jour' : 'Valider la série'}
              </Button>
            </div>
          )
        )}
      </div>

      {overview && (
        <SessionOverviewSheet
          session={session}
          store={store}
          currentExIndex={exIndex}
          onJump={setExIndex}
          onAddExercise={() => setPicker('add')}
          onFinish={finish}
          onClose={() => setOverview(false)}
        />
      )}

      {menu && (
        <Sheet title="Actions" onClose={() => setMenu(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="secondary" icon="plus" onClick={() => { addSet(); setMenu(false) }}>
              Ajouter une série
            </Button>
            <Button
              variant="secondary"
              icon="flame"
              onClick={() => { toggleFlag('isWarmup'); setMenu(false) }}
            >
              {activeSet?.isWarmup ? 'Retirer l’échauffement' : 'Marquer échauffement'}
            </Button>
            <Button
              variant="secondary"
              icon="bolt"
              onClick={() => { toggleFlag('isFailure'); setMenu(false) }}
            >
              {activeSet?.isFailure ? 'Retirer l’échec' : 'Marquer comme échec'}
            </Button>
            <Button
              variant="secondary"
              icon="skip"
              onClick={() => {
                if (exIndex < sessionExercises.length - 1) setExIndex(exIndex + 1)
                setMenu(false)
              }}
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
            <Button
              variant="danger"
              icon="trash"
              onClick={() => { setMenu(false); cancelSession() }}
            >
              Annuler la séance
            </Button>
          </div>
        </Sheet>
      )}

      {picker && (
        <ExercisePicker
          onConfirm={onPicker}
          onClose={() => setPicker(null)}
          alreadyAdded={picker === 'add' ? sessionExercises.map((se) => se.exerciseId) : []}
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
