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
  Button, Card, Icon, MiniBars, Modal, Pill, Sheet, Stepper,
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
  const [imageZoom, setImageZoom] = useState(false)
  // Overlay de célébration : une fois par exercice et par séance.
  const celebrated = useRef<Set<string>>(new Set())
  const notifAsked = useRef(false)
  // Verrou anti double-tap : empêche deux validations concurrentes.
  const isValidating = useRef(false)

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
  // Number() requis : les données IDB legacy peuvent stocker weightKg/reps comme strings.
  useEffect(() => {
    if (activeSet) {
      setInputW(Number(activeSet.weightKg))
      setInputR(
        Number(activeSet.reps) !== 0
          ? Number(activeSet.reps)
          : trackingType === 'time'
            ? targetDurationSec
            : 0,
      )
      setInputRpe(activeSet.rpe != null ? Number(activeSet.rpe) : null)
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
      <Modal ariaLabel="Séance introuvable" onRequestClose={nav.closeModal}>
        <div className="gt-screen__scroll">
          <p className="t-caption">Séance introuvable.</p>
          <Button onClick={nav.closeModal}>Fermer</Button>
        </div>
      </Modal>
    )
  }

  if (finished) {
    return (
      <Modal ariaLabel="Séance terminée">
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
  const isCardio = currentExercise?.primaryMuscle === 'cardio'
  const weightUnit = prefs.weightUnit
  const nextExercise = act.exercises[act.exIndex + 1]
  const supersetGroup = currentSE?.supersetGroup ?? null
  const supersetPeers = supersetGroup
    ? act.exercises.filter((e) => e.se.supersetGroup === supersetGroup)
    : []
  const isInSuperset = supersetPeers.length > 1
  const isNextInSameGroup = !!(nextExercise?.se.supersetGroup && nextExercise.se.supersetGroup === supersetGroup)

  // Section : échauffement → exercices → abdominaux
  const SECTION_LABEL = { warmup: 'Échauffement', main: 'Exercices', ab: 'Abdominaux' } as const
  type Section = keyof typeof SECTION_LABEL
  const getSection = (se: { isWarmup?: boolean; isAb?: boolean } | undefined): Section =>
    se?.isWarmup ? 'warmup' : se?.isAb ? 'ab' : 'main'
  const currentSection = getSection(currentSE)
  const nextSection = nextExercise ? getSection(nextExercise.se) : null
  const isNewSection = nextSection !== null && nextSection !== currentSection
  // Compteur Ex N/M limité à la section courante
  const sectionExs = act.exercises.filter((e) => getSection(e.se) === currentSection)
  const sectionIdx = sectionExs.findIndex((e) => e.se.id === currentSE?.id)
  const sectionCount = sectionExs.length

  const prev = currentSE ? lastWorkingSet(currentSE.exerciseId, store) : null
  const exercisePR = currentSE
    ? store.personalRecords
        .filter((p) => p.exerciseId === currentSE.exerciseId && p.type === '1rm')
        .sort((a, b) => Number(b.estimated1RM) - Number(a.estimated1RM))[0]
    : undefined

  const canValidate = isValidSet(showWeight ? inputW : 0, inputR)

  const validateImpl = async (repsOverride?: number) => {
    if (isValidating.current || !activeSet || !currentSE) return
    const reps = repsOverride ?? inputR
    if (!isValidSet(showWeight ? inputW : 0, reps)) return
    isValidating.current = true
    exerciseTimer.skip()
    try {
      const updated: SetRecord = {
        ...activeSet,
        weightKg: showWeight ? inputW : 0,
        reps,
        rpe: inputRpe ?? undefined,
      }
      const { pr, restSec, sessionDone, supersetRotated } = await act.validateSet(updated)
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
      // En superset ou repos à 0 s : pas de timer de repos.
      if (!supersetRotated && restSec > 0) restTimer.start(restSec)
      if (prefs.notificationsEnabled && !notifAsked.current) {
        notifAsked.current = true
        requestNotificationPermission()
      }
      setEditingSetId(null)
    } finally {
      isValidating.current = false
    }
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
    setExitSheet(true)
  }

  const abandon = async () => {
    await act.cancel()
    nav.closeModal()
  }

  return (
    <Modal onRequestClose={close} ariaLabel={session.name ?? 'Séance en cours'}>
      {/* Barre du haut — 3 zones : Fermer · En cours + chrono · Compteur séries */}
      <div className="gt-topbar">
        {/* Zone 1 : fermer */}
        <button className="gt-iconbtn" onClick={close} aria-label="Fermer la séance">
          <Icon name="close" size={22} />
        </button>

        {/* Zone 2 : label "En cours" + chrono */}
        <div style={{ flex: 1, textAlign: 'center' }} aria-live="polite">
          <div className="t-eyebrow">En cours</div>
          <div
            className="t-num"
            style={{ fontSize: 'var(--fs-title)' }}
            role="timer"
            aria-label={`Durée de la séance : ${formatDuration(elapsed)}`}
          >
            {formatDuration(elapsed)}
          </div>
        </div>

        {/* Zone 3 : compteur X/Y — ouvre la vue d'ensemble */}
        <button
          className="gt-iconbtn"
          onClick={() => setOverview(true)}
          aria-label={`${doneCount}/${totalCount} séries – Vue d'ensemble`}
          style={{ flexDirection: 'column', gap: 1 }}
        >
          <span className="t-num" style={{ fontSize: 'var(--fs-body)', lineHeight: 1.2 }}>
            {doneCount}/{totalCount}
          </span>
          <span className="t-eyebrow">séries</span>
        </button>
      </div>

      {/* Barre de progression segmentée (une micro-barre par série) */}
      <div style={{ padding: '0 var(--pad-screen) 4px', display: 'flex' }}>
        <MiniBars total={totalCount} done={doneCount} grow />
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
            {/* Hero compact : image 72×72 + infos */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {currentExercise.media && (
                <button
                  type="button"
                  onClick={() => setImageZoom(true)}
                  aria-label="Agrandir l'image"
                  style={{
                    width: 72, height: 72, borderRadius: 14, overflow: 'hidden',
                    flexShrink: 0, background: 'var(--surface2)',
                    border: '0.5px solid var(--border)',
                    padding: 0, cursor: 'zoom-in',
                  }}
                >
                  <MediaImage
                    blobId={currentExercise.media.blobId}
                    url={currentExercise.media.url}
                    alt=""
                    aspectRatio={1}
                  />
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  {/* Pill accent — sujet de l'écran */}
                  <Pill variant="accent">{MUSCLE_LABEL[currentExercise.primaryMuscle]}</Pill>
                  <span className="t-eyebrow t-num">
                    {supersetGroup
                      ? `Superset ${supersetGroup}`
                      : currentSection !== 'main'
                        ? SECTION_LABEL[currentSection]
                        : `EX ${sectionIdx + 1}/${sectionCount}`}
                  </span>
                </div>
                {/* Nom à display (30 px — maquette demande 26 px, token le plus proche = --fs-display) */}
                <p
                  className="t-display"
                  style={{
                    margin: '0 0 6px',
                    // En superset : hauteur fixe ≈ 2 lignes display (30 px × 1.1 lh × 2 ≈ 66 px)
                    minHeight: isInSuperset ? '66px' : undefined,
                  }}
                >
                  {currentExercise.name}
                </p>
                {isInSuperset && (
                  <div className="gt-chips" style={{ marginTop: 8 }}>
                    {supersetPeers.map((peer) => {
                      const peerIdx = act.exercises.findIndex((e) => e.se.id === peer.se.id)
                      const isActive = peerIdx === act.exIndex
                      const allDone =
                        peer.sets.length > 0 && peer.sets.every((s) => s.completedAt != null)
                      return (
                        <button
                          key={peer.se.id}
                          type="button"
                          className={`gt-chip ${isActive ? 'gt-chip--active' : ''}`}
                          style={allDone && !isActive ? { opacity: 0.55 } : undefined}
                          onClick={() => act.goToExercise(peerIdx)}
                        >
                          {allDone && !isActive ? '✓ ' : ''}{peer.exercise?.name ?? 'Exercice'}
                        </button>
                      )
                    })}
                  </div>
                )}
                {/* Préc. + PR sur une seule ligne mono */}
                <p className="t-caption t-num" style={{ margin: 0 }}>
                  Préc.&nbsp;
                  {prev ? `${formatWeight(prev.weightKg, weightUnit)} × ${prev.reps}` : '—'}
                  {exercisePR != null
                    ? ` · PR ${formatWeight(exercisePR.weightKg, weightUnit)}×${exercisePR.reps}`
                    : ''}
                </p>
              </div>
            </div>

            <SetTable
              sets={currentSets}
              activeSetId={activeSet?.id ?? null}
              trackingType={trackingType}
              weightUnit={weightUnit}
              onSelect={onSelectSet}
              onValidate={validate}
            />

            {nextExercise && (
              <Card onClick={goNext}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {nextExercise.exercise?.media && (
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                        flexShrink: 0, background: 'var(--surface2)',
                        border: '0.5px solid var(--border)',
                      }}
                    >
                      <MediaImage
                        blobId={nextExercise.exercise.media.blobId}
                        url={nextExercise.exercise.media.url}
                        alt=""
                        aspectRatio={1}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="t-eyebrow">
                      {isNewSection
                        ? `→ ${SECTION_LABEL[nextSection!]}`
                        : isNextInSameGroup
                          ? `Superset ${supersetGroup}`
                          : 'Suivant'}
                    </div>
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
            <Card variant="flat">
              {trackingType === 'time' ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                    {isCardio ? 'Durée (min)' : 'Durée (s)'}
                  </div>
                  <Stepper
                    value={inputR}
                    onChange={setInputR}
                    step={isCardio ? 300 : 5}
                    min={isCardio ? 300 : 5}
                    format={isCardio ? (v) => `${Math.round(v / 60)} min` : undefined}
                    ariaLabel="Durée"
                  />
                </div>
              ) : (
                <>
                  {/* Steppers côte à côte, séparés par un filet vertical */}
                  <div style={{ display: 'flex' }}>
                    {showWeight && (
                      <>
                        <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
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
                        {/* Filet séparateur */}
                        <div
                          style={{
                            width: 1,
                            background: 'var(--border)',
                            margin: 'var(--gap-tile)',
                            alignSelf: 'stretch',
                          }}
                        />
                      </>
                    )}
                    <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
                      <div className="t-eyebrow" style={{ marginBottom: 4 }}>Reps</div>
                      <Stepper
                        value={inputR}
                        onChange={setInputR}
                        min={0}
                        ariaLabel="Répétitions"
                      />
                    </div>
                  </div>

                  {/* RPE stepper (affiché si activé via l'action secondaire) */}
                  {inputRpe != null && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                        marginTop: 'var(--gap-tile)',
                        paddingTop: 'var(--gap-tile)',
                        textAlign: 'center',
                      }}
                    >
                      <div className="t-eyebrow" style={{ marginBottom: 4 }}>RPE</div>
                      <Stepper
                        value={inputRpe}
                        onChange={setInputRpe}
                        step={0.5}
                        min={6}
                        max={10}
                        decimals={1}
                        ariaLabel="RPE"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Bouton de validation pleine largeur */}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--gap-tile)', paddingTop: 'var(--gap-tile)' }}>
                {trackingType === 'time' ? (
                  <Button
                    icon="play"
                    onClick={() => {
                      setInputR(targetDurationSec)
                      exerciseTimer.start(targetDurationSec)
                    }}
                  >
                    Démarrer · {formatClock(targetDurationSec)}
                  </Button>
                ) : (
                  <Button onClick={validate} disabled={!canValidate} icon="check">
                    Valider la série
                  </Button>
                )}
              </div>

              {/* Actions secondaires : RPE · +Série · Menu */}
              <div className="gt-session-actions" style={{ marginTop: 'var(--gap-tile)' }}>
                {trackingType !== 'time' && (
                  <button
                    type="button"
                    className="gt-session-action"
                    onClick={() => setInputRpe(inputRpe != null ? null : 8)}
                  >
                    {inputRpe != null ? '− RPE' : '+ RPE'}
                  </button>
                )}
                {repsLookSuspicious(inputR) && (
                  <span className="t-caption" style={{ color: 'var(--danger)' }}>
                    {inputR} reps ?
                  </span>
                )}
                <button
                  type="button"
                  className="gt-session-action"
                  onClick={() => act.addSet()}
                >
                  + Série
                </button>
                <button
                  type="button"
                  className="gt-session-action"
                  onClick={() => setMenu(true)}
                  aria-label="Actions"
                >
                  <Icon name="grip" size={14} />
                </button>
              </div>
            </Card>
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
          isCardio={isCardio}
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

      {/* Zoom image exercice */}
      {imageZoom && currentExercise?.media && (
        <div
          role="dialog"
          aria-label={`Image : ${currentExercise.name}`}
          onClick={() => setImageZoom(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-dark)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 200,
          }}
        >
          <div
            style={{
              maxWidth: '92vw',
              maxHeight: '72vh',
              borderRadius: 20,
              overflow: 'hidden',
              background: 'var(--surface2)',
            }}
          >
            <MediaImage
              blobId={currentExercise.media.blobId}
              url={currentExercise.media.url}
              alt={currentExercise.name}
              aspectRatio={currentExercise.media.aspectRatio}
            />
          </div>
          <p className="t-caption" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Appuie pour fermer
          </p>
        </div>
      )}
    </Modal>
  )
}
