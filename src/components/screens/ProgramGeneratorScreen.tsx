// Wizard de génération automatique de programme.
// 8 questions en chips → génère un DraftProgram → ouvre le builder à l'étape Revue.

import { useEffect, useState } from 'react'
import type { Equipment, ProgramGoal, ProgramLevel, Weekday } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { Icon } from '../ui'
import {
  generateProgramDraft,
  type FocusMuscle,
  type GeneratorParams,
  type SplitPreference,
} from '../../utils/programGenerator'
import { setPendingDraft } from '../../utils/generatorDraft'
import {
  STEP_DAYS,
  STEP_DURATION,
  STEP_LEVEL,
  STEP_TITLE,
  TOTAL,
  WEEKDAY_OPTIONS,
  type Lieu,
} from './programGeneratorData'
import {
  ChipStep,
  DayPickerStep,
  EquipmentPickerStep,
  GoalPickerStep,
  LieuPickerStep,
  MusclePickerStep,
  ProgramWeeksPickerStep,
  SplitPickerStep,
} from './ProgramGeneratorSteps'

export function ProgramGeneratorScreen() {
  const store = useStore()
  const nav = useNavigation()

  const [stepIndex, setStepIndex]               = useState(0)
  const [goal, setGoal]                         = useState<ProgramGoal | null>(null)
  const [days, setDays]                         = useState<2 | 3 | 4 | 5 | null>(null)
  const [selectedDays, setSelectedDays]         = useState<Weekday[]>([])
  const [duration, setDuration]                 = useState<20 | 45 | 60 | 90 | null>(null)
  const [lieu, setLieu]                         = useState<Lieu | null>(null)
  const [equipment, setEquipment]               = useState<Equipment[]>([])
  const [level, setLevel]                       = useState<ProgramLevel | null>(null)
  const [splitPreference, setSplitPreference]   = useState<SplitPreference>('auto')
  const [focusMuscles, setFocusMuscles]         = useState<FocusMuscle[]>([])
  const [programWeeks, setProgramWeeks]         = useState<number | null>(null)
  const [advancing, setAdvancing]               = useState(false)
  const [showPeriodTable, setShowPeriodTable]   = useState(false)

  function advance() {
    if (stepIndex < TOTAL - 1) {
      setAdvancing(true)
      setTimeout(() => {
        setStepIndex((s) => s + 1)
        setAdvancing(false)
      }, 160)
    }
  }

  function handleBack() {
    if (stepIndex === 0) nav.back()
    // Si on est à Jours (6) avec un split explicite, sauter Muscles (5) au retour
    else if (stepIndex === 6 && splitPreference !== 'auto') setStepIndex(4)
    else setStepIndex((s) => s - 1)
  }

  function handleGenerate(weeksOverride?: number | null) {
    if (!goal || !days || !duration || equipment.length === 0 || !level) return

    const orderedDays = WEEKDAY_OPTIONS
      .filter((d) => selectedDays.includes(d.value))
      .map((d) => d.value)

    // weeksOverride permet d'utiliser la valeur juste sélectionnée avant que
    // le state programWeeks ne soit mis à jour (closure sur l'ancienne valeur)
    const totalWeeks = weeksOverride !== undefined ? weeksOverride ?? undefined : programWeeks ?? undefined

    const params: GeneratorParams = {
      goal, daysPerWeek: days, sessionDuration: duration,
      equipment, level, selectedDays: orderedDays,
      splitPreference: splitPreference !== 'auto' ? splitPreference : undefined,
      focusMuscles: focusMuscles.length > 0 ? focusMuscles : undefined,
      totalWeeks,
    }
    const draft = generateProgramDraft(params, store.exercises)
    setPendingDraft(draft)
    nav.navigate('programBuilder')
  }

  function toggleFocus(m: FocusMuscle) {
    setFocusMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )
  }

  // ── Sélection des jours — avance automatiquement quand le quota est atteint ──

  useEffect(() => {
    if (days !== null && selectedDays.length === days) {
      setAdvancing(true)
      const t = setTimeout(() => {
        setStepIndex((s) => s + 1)
        setAdvancing(false)
      }, 200)
      return () => clearTimeout(t)
    }
  }, [selectedDays.length, days])

  function toggleDay(day: Weekday) {
    if (days === null) return
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day)
      if (prev.length >= days) return prev
      return [...prev, day]
    })
  }

  // ── Rendu des étapes ──────────────────────────────────────────────────────────

  function renderStep() {
    if (stepIndex === 0) {
      return (
        <GoalPickerStep
          goal={goal}
          advancing={advancing}
          showPeriodTable={showPeriodTable}
          onSelect={(v) => { setGoal(v); advance() }}
          onTogglePeriodTable={() => setShowPeriodTable((s) => !s)}
        />
      )
    }
    if (stepIndex === 1) {
      return (
        <ChipStep
          step={STEP_LEVEL}
          selected={level}
          advancing={advancing}
          onSelect={(v: ProgramLevel) => { setLevel(v); advance() }}
        />
      )
    }
    if (stepIndex === 2) {
      return (
        <ChipStep
          step={STEP_DAYS}
          selected={days}
          advancing={advancing}
          onSelect={(v: 2 | 3 | 4 | 5) => {
            setDays(v)
            setSelectedDays([])
            advance()
          }}
        />
      )
    }
    if (stepIndex === 3) {
      // UX-4 : Force + durée courte — repos 3 min réduit drastiquement le volume
      const durationNote = goal === 'strength' ? (
        <div style={{
          margin: '0 16px 12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 'var(--radius-card)',
          background: 'color-mix(in oklch, var(--accent) 8%, var(--surface))',
          border: '1.5px solid color-mix(in oklch, var(--accent) 30%, transparent)',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
          <span className="t-caption" style={{ color: 'var(--fg)' }}>
            Force : les repos de 3 min entre séries limitent le volume.
            {/* BUG-E1 fix : 20 min = 3 exercices (plancher de 2 jamais atteint en pratique) */}
            20 min = 3 exercices · 45 min = 3 exercices · 60 min = 4 exercices · 90 min = 5 exercices.
          </span>
        </div>
      ) : null
      return (
        <div>
          {durationNote}
          <ChipStep
            step={STEP_DURATION}
            selected={duration}
            advancing={advancing}
            onSelect={(v: 20 | 45 | 60 | 90) => { setDuration(v); advance() }}
          />
        </div>
      )
    }
    // Étape 4 : Structure — si 'auto', on affiche ensuite les muscles (étape 5)
    //           si preset explicite, on saute directement aux jours (étape 6)
    if (stepIndex === 4) {
      return (
        <SplitPickerStep
          splitPreference={splitPreference}
          days={days}
          level={level}
          goal={goal}
          onSelect={(value, skipMuscles) => {
            setSplitPreference(value)
            if (skipMuscles) {
              setStepIndex((s) => s + 2)   // → étape 6 (Jours)
              setFocusMuscles([])           // reset au cas où
            } else {
              advance()                     // → étape 5 (Muscles)
            }
          }}
        />
      )
    }
    // Étape 5 : Muscles — uniquement si 'auto' (sinon on ne passe jamais ici)
    if (stepIndex === 5) {
      return (
        <MusclePickerStep
          focusMuscles={focusMuscles}
          level={level}
          onToggle={toggleFocus}
          onContinue={advance}
        />
      )
    }
    if (stepIndex === 6) {
      return (
        <DayPickerStep
          days={days}
          selectedDays={selectedDays}
          advancing={advancing}
          onToggle={toggleDay}
        />
      )
    }
    if (stepIndex === 7) {
      return (
        <LieuPickerStep
          lieu={lieu}
          advancing={advancing}
          onSelect={(selectedLieu, preset) => {
            setLieu(selectedLieu)
            setEquipment(preset)
            setAdvancing(true)
            setTimeout(() => {
              setStepIndex((s) => s + 1)
              setAdvancing(false)
            }, 160)
          }}
        />
      )
    }
    if (stepIndex === 8) {
      return (
        <EquipmentPickerStep
          equipment={equipment}
          goal={goal}
          lieu={lieu}
          advancing={advancing}
          exercises={store.exercises}
          onToggle={(e) =>
            setEquipment((prev) =>
              prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
            )
          }
          onContinue={advance}
        />
      )
    }
    // Étape 9 : Programme (durée)
    return (
      <ProgramWeeksPickerStep
        level={level}
        programWeeks={programWeeks}
        advancing={advancing}
        onSelect={(weeks) => {
          setProgramWeeks(weeks)
          handleGenerate(weeks)
        }}
      />
    )
  }

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={handleBack} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">{STEP_TITLE[stepIndex]}</h1>
        <span className="t-caption" style={{ fontWeight: 700, opacity: 0.5 }}>
          {/* Si preset explicite (non-auto), l'étape 3 (muscles) est sautée :
              step 0→1, 1→2, 2→3, 4→4, 5→5… (réajuste le numéro affiché) */}
          {splitPreference !== 'auto' && stepIndex >= 4 ? stepIndex : stepIndex + 1}
          /{splitPreference === 'auto' ? TOTAL : TOTAL - 1}
        </span>
      </div>

      {/* Barre de progression — masque l'étape Muscles si preset non-auto */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 16px 20px' }}>
        {Array.from({ length: splitPreference === 'auto' ? TOTAL : TOTAL - 1 }).map((_, i) => {
          // Index réel dans le wizard (quand non-auto, i>=3 correspond à step i+1)
          const realStep = splitPreference !== 'auto' && i >= 3 ? i + 1 : i
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: realStep <= stepIndex ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.2s',
              }}
            />
          )
        })}
      </div>

      <div className="gt-screen__scroll" style={{ paddingTop: 0 }}>
        {renderStep()}
      </div>
    </div>
  )
}
