// Wizard de génération automatique de programme.
// 8 questions en chips → génère un DraftProgram → ouvre le builder à l'étape Revue.

import { useEffect, useState } from 'react'
import type { Equipment, ProgramGoal, ProgramLevel, Weekday } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { Icon } from '../ui'
import {
  generateProgramDraft,
  buildPhases,
  PHASE_CONFIG_BY_GOAL,
  type FocusMuscle,
  type GeneratorParams,
  type SplitPreference,
} from '../../utils/programGenerator'
import { setPendingDraft } from '../../utils/generatorDraft'

// ── Données des étapes ────────────────────────────────────────────────────────

interface Step<T> {
  question: string
  subtitle?: string
  options: { value: T; label: string; sub: string }[]
}

const STEP_GOAL: Step<ProgramGoal> = {
  question: "Quel est ton objectif ?",
  options: [
    { value: 'hypertrophy', label: '📈 Masse',       sub: 'Prise de volume musculaire'        },
    { value: 'strength',    label: '💪 Force',        sub: 'Soulever plus lourd'               },
    { value: 'fat_loss',    label: '🏃 Forme',        sub: 'Perdre du gras, tonifier'          },
    { value: 'endurance',   label: '🔁 Endurance',    sub: 'Séries longues, peu de repos — cardio non inclus' },
  ],
}

const STEP_DAYS: Step<2 | 3 | 4 | 5> = {
  question: "Combien de séances par semaine ?",
  subtitle: "Sois réaliste — mieux vaut 3 séances régulières que 5 irrégulières.",
  options: [
    { value: 2, label: '2 séances', sub: '2 jours d\'entraînement' },
    { value: 3, label: '3 séances', sub: 'Idéal pour débuter'      },
    { value: 4, label: '4 séances', sub: 'Bon équilibre charge / récup' },
    { value: 5, label: '5 séances', sub: 'Pour les confirmés'      },
  ],
}

// Jours de la semaine pour le sélecteur de jours (étape 2b)
const WEEKDAY_OPTIONS: { value: Weekday; label: string; full: string }[] = [
  { value: 'monday',    label: 'Lun', full: 'Lundi'    },
  { value: 'tuesday',   label: 'Mar', full: 'Mardi'    },
  { value: 'wednesday', label: 'Mer', full: 'Mercredi' },
  { value: 'thursday',  label: 'Jeu', full: 'Jeudi'    },
  { value: 'friday',    label: 'Ven', full: 'Vendredi' },
  { value: 'saturday',  label: 'Sam', full: 'Samedi'   },
  { value: 'sunday',    label: 'Dim', full: 'Dimanche' },
]

const STEP_DURATION: Step<20 | 45 | 60 | 90> = {
  question: "Durée d'une séance ?",
  subtitle: "Échauffement non inclus.",
  options: [
    { value: 20, label: '20 min',  sub: 'Séance express'           },
    { value: 45, label: '45 min',  sub: 'Courte et efficace'       },
    { value: 60, label: '1 heure', sub: 'Le format classique'      },
    { value: 90, label: '1h 30',   sub: 'Volume élevé'             },
  ],
}

// ── Étape Lieu ────────────────────────────────────────────────────────────────

type Lieu = 'gym' | 'home' | 'outdoor' | 'custom'

interface LieuOption {
  value: Lieu
  emoji: string
  label: string
  sub: string
  preset: Equipment[]
}

const LIEU_OPTIONS: LieuOption[] = [
  {
    value: 'gym',
    emoji: '🏟️',
    label: 'Salle de sport',
    sub: 'Barre, haltères, câbles, machines',
    preset: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'pullup_bar', 'cardio_machine'],
  },
  {
    value: 'home',
    emoji: '🏠',
    label: 'Home gym',
    sub: 'Haltères, kettlebell, élastiques',
    preset: ['dumbbell', 'kettlebell', 'band', 'bodyweight'],
  },
  {
    value: 'outdoor',
    emoji: '🤸',
    label: 'Extérieur / Calisthenics',
    sub: 'Poids du corps + barre de traction',
    preset: ['bodyweight', 'pullup_bar'],
  },
  {
    value: 'custom',
    emoji: '✏️',
    label: 'Setup sur-mesure',
    sub: 'Je choisis moi-même',
    preset: [],
  },
]

// ── Options équipement (multi-select, étape 5b) ──────────────────────────────

interface EquipmentOption {
  value: Equipment
  emoji: string
  label: string
  sub: string
}

/** Musculation — force et hypertrophie */
const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'barbell',    emoji: '🏋️', label: 'Barre + rack',              sub: 'Squat, développé couché, SDT…'          },
  { value: 'dumbbell',   emoji: '🔩',  label: 'Haltères',                  sub: 'Unilatéral, rowing, press…'             },
  { value: 'cable',      emoji: '🔗',  label: 'Station câbles',            sub: 'Tirage, face pull, cable cross…'        },
  { value: 'machine',    emoji: '⚙️',  label: 'Appareils guidés',          sub: 'Leg press, pec deck, hack squat…'       },
  { value: 'bodyweight', emoji: '🤸',  label: 'Poids du corps (au sol)',   sub: 'Pompes, squats, abdos, fentes…'         },
  { value: 'pullup_bar', emoji: '🏗️',  label: 'Barre de traction / dips', sub: 'Tractions, dips, rowing inversé…'       },
  { value: 'kettlebell', emoji: '🫙',  label: 'Kettlebell',                sub: 'Swing, goblet squat, press…'            },
  { value: 'band',       emoji: '🪢',  label: 'Élastiques',                sub: 'Résistance, activation, mobilité'       },
]

/** Cardio — équipements distinctement cardio */
const CARDIO_OPTIONS: EquipmentOption[] = [
  { value: 'cardio_machine', emoji: '🚴', label: 'Cardio machine', sub: 'Vélo, tapis de course, rameur, elliptique…' },
]

const STEP_LEVEL: Step<ProgramLevel> = {
  question: "Quel est ton niveau ?",
  options: [
    { value: 'beginner',     label: '🌱 Débutant',     sub: 'Moins d\'un an de pratique'  },
    { value: 'intermediate', label: '💡 Intermédiaire', sub: 'Entre 1 et 3 ans'           },
    { value: 'advanced',     label: '🔥 Confirmé',     sub: 'Plus de 3 ans d\'expérience' },
  ],
}

// ── Options muscles prioritaires ─────────────────────────────────────────────

interface FocusOption {
  value: FocusMuscle
  emoji: string
  label: string
  sub: string
}

const FOCUS_OPTIONS: FocusOption[] = [
  { value: 'chest',     emoji: '🏋️', label: 'Pectoraux',  sub: 'Poitrine, grand pectoral'          },
  { value: 'back',      emoji: '🔗',  label: 'Dos',         sub: 'Largeur et épaisseur de dos'        },
  { value: 'shoulders', emoji: '🎯',  label: 'Épaules',     sub: 'Deltoïdes antérieurs, médians…'    },
  { value: 'arms',      emoji: '💪',  label: 'Bras',         sub: 'Biceps, triceps, avant-bras'       },
  { value: 'legs',      emoji: '🦵',  label: 'Jambes',       sub: 'Quadris, ischios, fessiers, mollets' },
  { value: 'core',      emoji: '⭕',  label: 'Core',         sub: 'Abdominaux, gainage'               },
]

// ── Durée du programme (périodisation) ────────────────────────────────────────

interface ProgramWeeksOption {
  value: number | null
  label: string
  sub: string
}

function programWeeksOptions(level: ProgramLevel | null): ProgramWeeksOption[] {
  const defaultWeeks = level === 'beginner' ? 8 : level === 'intermediate' ? 12 : 16
  return [
    { value: null,  label: '📅 Standard',    sub: `${defaultWeeks} sem. selon ton niveau` },
    { value: 8,     label: '8 semaines',      sub: 'Bloc court — idéal pour tester' },
    { value: 10,    label: '10 semaines',     sub: 'Adaptation + Progression + Intensification' },
    { value: 12,    label: '12 semaines',     sub: 'Le classique 3 mois — équilibré' },
    { value: 16,    label: '16 semaines',     sub: 'Programme long — gains durables' },
  ]
}

// ── Ordre des étapes ──────────────────────────────────────────────────────────
// 0: Objectif  1: Niveau  2: Fréquence  3: Structure  4: Muscles(si auto)  5: Jours  6: Durée  7: Lieu  8: Équipement  9: Programme
// Si splitPreference !== 'auto', l'étape 4 (Muscles) est sautée → 9 étapes effectives
const STEP_TITLE = ['Objectif', 'Niveau', 'Fréquence', 'Structure', 'Muscles', 'Jours', 'Durée', 'Lieu', 'Équipement', 'Programme']
const TOTAL = 10

// ── Composant ─────────────────────────────────────────────────────────────────

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
    // Si on est à Jours (5) avec un split explicite, sauter Muscles (4) au retour
    else if (stepIndex === 5 && splitPreference !== 'auto') setStepIndex(3)
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

  // ── Sélection des jours (étape 4 dans le nouvel ordre) ───────────────────────

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

  // ── Rendu des étapes ────────────────────────────────────────────────────────

  function renderStep() {
    if (stepIndex === 0) {
      return renderGoalPicker()
    }
    if (stepIndex === 1) {
      return renderChips(STEP_LEVEL, level, (v: ProgramLevel) => { setLevel(v); advance() })
    }
    if (stepIndex === 2) {
      return renderChips(STEP_DAYS, days, (v: 2 | 3 | 4 | 5) => {
        setDays(v)
        setSelectedDays([])
        advance()
      })
    }
    // Étape 3 : Structure — si 'auto', on affiche ensuite les muscles (étape 4)
    //           si preset explicite, on saute directement aux jours (étape 5)
    if (stepIndex === 3) return renderSplitPicker()
    // Étape 4 : Muscles — uniquement si 'auto' (sinon on ne passe jamais ici)
    if (stepIndex === 4) return renderMusclePicker()
    if (stepIndex === 5) return renderDayPicker()
    if (stepIndex === 6) {
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
            20 min = 2 exercices · 45 min = 3 exercices · 60 min = 4 exercices · 90 min = 5 exercices.
          </span>
        </div>
      ) : null
      return (
        <div>
          {durationNote}
          {renderChips(STEP_DURATION, duration, (v: 20 | 45 | 60 | 90) => { setDuration(v); advance() })}
        </div>
      )
    }
    if (stepIndex === 7) return renderLieuPicker()
    if (stepIndex === 8) return renderEquipmentPicker()
    return renderProgramWeeksPicker()
  }

  // ── Sélecteur de lieu ─────────────────────────────────────────────────────

  function renderLieuPicker() {
    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
          Où t'entraînes-tu ?
        </p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
          On pré-sélectionne l'équipement, tu pourras ajuster ensuite.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LIEU_OPTIONS.map((opt) => {
            const active = lieu === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setLieu(opt.value)
                  // Pour custom : go directement à l'étape équipement, équipement vide
                  // Pour les autres : pré-rempli + avance
                  setEquipment(opt.preset)
                  setAdvancing(true)
                  setTimeout(() => {
                    setStepIndex((s) => s + 1)
                    setAdvancing(false)
                  }, 160)
                }}
                disabled={advancing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active
                    ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
                    : 'var(--surface)',
                  color: 'var(--fg)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>{opt.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
                    {opt.sub}
                  </div>
                </div>
                {active && (
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
                    <Icon name="check" size={20} strokeWidth={2.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Sélecteur d'équipement ────────────────────────────────────────────────

  function renderEquipmentPicker() {
    function toggleEquipment(e: Equipment) {
      setEquipment((prev) =>
        prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
      )
    }

    function renderEquipmentButton(opt: EquipmentOption) {
      const active = equipment.includes(opt.value)
      return (
        <button
          key={opt.value}
          onClick={() => toggleEquipment(opt.value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 'var(--radius-card)',
            border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
            background: active
              ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
              : 'var(--surface)',
            color: 'var(--fg)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color 0.12s, background 0.12s',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{opt.label}</div>
            <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 1 }}>
              {opt.sub}
            </div>
          </div>
          {active && (
            <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
              <Icon name="check" size={18} strokeWidth={2.5} />
            </div>
          )}
        </button>
      )
    }

    // Fix EQUIP-5 : exclure les exercices cardio (primaryMuscle:'cardio') — aucun slot de force ne les cible
    const availableCount = equipment.length === 0 ? 0 :
      store.exercises.filter(
        (ex) => !ex.deleted && !ex.isWarmupExercise && equipment.includes(ex.equipment) &&
        ex.primaryMuscle !== 'cardio',
      ).length

    // ── Détection des configurations problématiques ─────────────────────────
    const weightedEquip: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell']
    const hasWeightedEquip = equipment.some(e => weightedEquip.includes(e))

    // EQUIP-5 : cardio_machine sélectionné — n'apparaîtra pas dans le programme
    const cardioPresent = equipment.includes('cardio_machine')

    // P59 : bodyweight seul sans pullup_bar ni équipement lesté → dos vide
    const bwAloneWithoutBar =
      equipment.includes('bodyweight') &&
      !equipment.includes('pullup_bar') &&
      !hasWeightedEquip

    // P67 : objectif Force sans équipement lesté → progression externe impossible
    const strengthCalOnly =
      goal === 'strength' &&
      !hasWeightedEquip &&
      equipment.some(e => e === 'bodyweight' || e === 'pullup_bar')

    // Label selon le lieu choisi
    const lieuLabel = lieu === 'gym' ? 'Salle de sport'
      : lieu === 'home' ? 'Home gym'
      : lieu === 'outdoor' ? 'Extérieur'
      : null

    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
          {lieuLabel ? `Équipement — ${lieuLabel}` : 'Quel équipement as-tu ?'}
        </p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
          {lieu && lieu !== 'custom'
            ? 'Pré-rempli selon ton lieu. Ajuste si besoin.'
            : 'Sélectionne tout ce qui est disponible.'}
        </p>

        {/* Grille équipements musculation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {EQUIPMENT_OPTIONS.map((opt) => renderEquipmentButton(opt))}
        </div>

        {/* Section cardio */}
        <p className="t-caption" style={{ fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cardio
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {CARDIO_OPTIONS.map((opt) => renderEquipmentButton(opt))}
        </div>

        {/* Warning si peu d'exercices disponibles (hors cardio) */}
        {equipment.length > 0 && availableCount < 12 && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-card)',
            background: 'color-mix(in oklch, var(--warn, #f59e0b) 12%, var(--surface))',
            border: '1.5px solid color-mix(in oklch, var(--warn, #f59e0b) 40%, transparent)',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span className="t-caption" style={{ color: 'var(--fg)' }}>
              {availableCount === 0
                ? 'Aucun exercice disponible — le programme sera vide.'
                : `Seulement ${availableCount} exercice${availableCount > 1 ? 's' : ''} disponibles — certains slots seront vides.`}
            </span>
          </div>
        )}

        {/* EQUIP-5 : cardio machine → aucun effet sur le programme de force */}
        {cardioPresent && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-card)',
            background: 'color-mix(in oklch, var(--accent) 8%, var(--surface))',
            border: '1.5px solid color-mix(in oklch, var(--accent) 30%, transparent)',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <span className="t-caption" style={{ color: 'var(--fg)' }}>
              Les machines cardio (vélo, tapis…) ne sont pas intégrées dans les séances de musculation générées.
              Ajoute-les en complément de tes séances, selon ton objectif.
            </span>
          </div>
        )}

        {/* P59 : poids du corps seul sans barre → dos vide */}
        {bwAloneWithoutBar && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-card)',
            background: 'color-mix(in oklch, var(--warn, #f59e0b) 12%, var(--surface))',
            border: '1.5px solid color-mix(in oklch, var(--warn, #f59e0b) 40%, transparent)',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span className="t-caption" style={{ color: 'var(--fg)' }}>
              Sans barre de traction, les exercices de dos (tractions, rowing inversé) ne seront pas disponibles.
              Les séances de tirage seront partiellement vides.{' '}
              <strong>Ajoute "Barre de traction / dips" si tu en as une.</strong>
            </span>
          </div>
        )}

        {/* P67 : Force + poids du corps uniquement → progression externe impossible */}
        {strengthCalOnly && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-card)',
            background: 'color-mix(in oklch, var(--danger, #ef4444) 10%, var(--surface))',
            border: '1.5px solid color-mix(in oklch, var(--danger, #ef4444) 35%, transparent)',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔴</span>
            <span className="t-caption" style={{ color: 'var(--fg)' }}>
              L'objectif <strong>Force</strong> est conçu pour progresser en charge externe (barres, haltères…).
              Sans équipement lesté, la progression de force ne peut pas être mesurée.
              Envisage l'objectif <strong>Masse</strong> ou <strong>Bien-être</strong> pour le calisthenics.
            </span>
          </div>
        )}

        <button
          onClick={() => { if (equipment.length > 0 && availableCount > 0) advance() }}
          disabled={equipment.length === 0 || availableCount === 0}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-card)',
            border: 'none',
            background: equipment.length > 0 && availableCount > 0 ? 'var(--accent)' : 'var(--border)',
            color: equipment.length > 0 && availableCount > 0 ? 'var(--accent-ink)' : 'var(--fg-muted)',
            fontSize: 'var(--fs-body)',
            fontWeight: 700,
            cursor: equipment.length > 0 && availableCount > 0 ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {equipment.length === 0
            ? 'Sélectionne au moins un équipement'
            : availableCount === 0
            ? 'Aucun exercice de musculation disponible'
            : `Continuer avec ${equipment.length} équipement${equipment.length > 1 ? 's' : ''}`}
        </button>
      </div>
    )
  }

  // ── Sélecteur de structure (split) ───────────────────────────────────────

  function renderSplitPicker() {
    const OPTIONS: { value: SplitPreference; label: string; sub: string; icon: string }[] = [
      { value: 'auto',        icon: '🤖', label: 'Auto',          sub: 'Le coach choisit selon tes critères'             },
      { value: 'fullbody',    icon: '🌐', label: 'Full Body',      sub: 'Corps entier à chaque séance'                    },
      { value: 'upper-lower', icon: '↕️', label: 'Upper / Lower', sub: 'Haut et bas du corps en alternance'               },
      { value: 'ppl',         icon: '🔄', label: 'PPL',           sub: 'Push · Pull · Legs — le classique'               },
      { value: 'arnold',      icon: '🏆', label: 'Arnold Split',  sub: 'Pecs+Dos / Épaules+Bras / Jambes'                },
      { value: 'brosplit',    icon: '💪', label: 'Bro Split',     sub: 'Un groupe musculaire par séance, volume max'      },
      { value: 'glutes-focus', icon: '🍑', label: 'Glutes Focus', sub: 'Fessiers & dos — programme féminin sans push'    },
    ]

    // Retourne la raison d'incompatibilité, ou null si le split est compatible.
    function incompatibleReason(value: SplitPreference): string | null {
      switch (value) {
        case 'brosplit':
          if (days !== null && days < 5) return `Nécessite 5 séances/sem. — tu en as ${days}`
          if (level === 'beginner') return 'Fréquence trop faible par muscle pour un débutant'
          if (goal === 'strength') return 'Force requiert 2-3 stimuli/sem. par muscle — Brosplit n\'en donne qu\'un'
          if (goal === 'endurance') return 'Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent'
          return null
        case 'arnold':
          if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
          if (level === 'beginner') return 'Volume et complexité élevés — déconseillé en débutant'
          if (goal === 'strength') return 'Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)'
          if (goal === 'endurance') return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
          return null
        case 'ppl':
          if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
          if (goal === 'strength') return 'Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)'
          if (goal === 'endurance') return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
          return null
        default:
          return null
      }
    }

    return (
      <div style={{ padding: '0 16px 16px' }}>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
          Choisis la structure de tes semaines. En mode Auto, le coach adapte selon ton objectif et ta fréquence.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(({ value, icon, label, sub }) => {
            const active = splitPreference === value
            const reason = incompatibleReason(value)
            const disabled = reason !== null
            return (
              <button
                key={value}
                onClick={() => {
                  if (disabled) return
                  setSplitPreference(value)
                  if (value === 'auto') {
                    advance()                      // → étape 4 (Muscles)
                  } else {
                    // Sauter Muscles : inutile si la structure est explicite
                    setStepIndex((s) => s + 2)    // → étape 5 (Jours)
                    setFocusMuscles([])            // reset au cas où
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'color-mix(in oklch, var(--accent) 10%, var(--surface))' : 'var(--surface)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  opacity: disabled ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="t-body" style={{ fontWeight: 600, color: active ? 'var(--accent)' : 'var(--fg)' }}>
                    {label}
                  </div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
                    {sub}
                  </div>
                  {reason && (
                    <div className="t-caption" style={{ color: 'var(--warn, #f59e0b)', marginTop: 4, fontWeight: 600 }}>
                      ⚠ {reason}
                    </div>
                  )}
                </div>
                {active && !disabled && (
                  <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Sélecteur de durée de programme ──────────────────────────────────────

  function renderProgramWeeksPicker() {
    const options = programWeeksOptions(level)

    // Étiquette de la phase de périodisation — délègue à buildPhases (source de vérité)
    function phaseLabel(weeks: number): string {
      const phases = buildPhases(weeks)
      if (!phases) return ''
      return phases.map((ph) => {
        const dur = ph.weekEnd - ph.weekStart + 1
        const names: Record<string, string> = {
          adaptation: 'adaptation', progression: 'progression',
          intensification: 'intensification', deload: 'décharge',
        }
        return `${dur} sem. ${names[ph.focus] ?? ph.focus}`
      }).join(' · ')
    }

    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
          Sur combien de semaines ?
        </p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
          Un programme plus long permet une périodisation par blocs — chaque phase adapte le volume et l'intensité.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {options.map((opt) => {
            const active = programWeeks === opt.value
            const phaseInfo = opt.value !== null ? phaseLabel(opt.value) : null
            return (
              <button
                key={String(opt.value)}
                onClick={() => { setProgramWeeks(opt.value); handleGenerate(opt.value) }}
                disabled={advancing}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active
                    ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
                    : 'var(--surface)',
                  color: 'var(--fg)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>{opt.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
                    {opt.sub}
                  </div>
                  {phaseInfo && (
                    <div className="t-caption" style={{ color: 'var(--accent)', marginTop: 4, opacity: 0.85 }}>
                      {phaseInfo}
                    </div>
                  )}
                </div>
                {active && (
                  <div style={{ color: 'var(--accent)', flexShrink: 0, paddingTop: 2 }}>
                    <Icon name="check" size={20} strokeWidth={2.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Sélecteur de muscles prioritaires ────────────────────────────────────

  function renderMusclePicker() {
    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
          Quels muscles veux-tu prioriser ?
        </p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
          Optionnel — le programme reste équilibré, mais les séances courtes favoriseront ces muscles.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {FOCUS_OPTIONS.map((opt) => {
            const active = focusMuscles.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => toggleFocus(opt.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active
                    ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
                    : 'var(--surface)',
                  color: 'var(--fg)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{opt.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 'var(--fs-body)', marginTop: 4 }}>
                  {opt.label}
                </span>
                <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>
                  {opt.sub}
                </span>
              </button>
            )
          })}
        </div>

        {/* Warning déséquilibre musculaire */}
        {focusMuscles.length > 0 && (() => {
          const noBack = !focusMuscles.includes('back')
          const noLegs = !focusMuscles.includes('legs')
          if (!noBack && !noLegs) return null
          const missing = [noBack && 'dos', noLegs && 'jambes'].filter(Boolean).join(' ni ')
          return (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-card)',
              background: 'color-mix(in oklch, var(--warn, #f59e0b) 12%, var(--surface))',
              border: '1.5px solid color-mix(in oklch, var(--warn, #f59e0b) 40%, transparent)',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <div>
                <div className="t-caption" style={{ color: 'var(--fg)', fontWeight: 700 }}>
                  Pas de {missing} dans ta sélection.
                </div>
                <div className="t-caption" style={{ color: 'var(--fg)', marginTop: 2 }}>
                  {level === 'beginner'
                    ? `Pour un débutant, négliger le ${missing} crée un déséquilibre qui ralentit la progression globale.`
                    : `Un programme sans ${missing} peut entraîner des déséquilibres musculaires à terme.`}
                </div>
              </div>
            </div>
          )
        })()}

        {/* UX-2 : Focus bras sans pectoraux → triceps absents des séances de tirage */}
        {focusMuscles.includes('arms') && !focusMuscles.includes('chest') && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-card)',
            background: 'color-mix(in oklch, var(--warn, #f59e0b) 12%, var(--surface))',
            border: '1.5px solid color-mix(in oklch, var(--warn, #f59e0b) 40%, transparent)',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <div className="t-caption" style={{ color: 'var(--fg)', fontWeight: 700 }}>
                Triceps peu couverts sans focus Pectoraux.
              </div>
              <div className="t-caption" style={{ color: 'var(--fg)', marginTop: 2 }}>
                Les triceps ne sont entraînés que sur les séances <strong>Push</strong> — ils n'ont aucun slot
                dans les séances de tirage (dos, biceps). Pour maximiser la couverture des bras,
                ajoute le focus <strong>Pectoraux</strong>.
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => { advance() }}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-card)',
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            fontSize: 'var(--fs-body)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {focusMuscles.length > 0
            ? `Continuer avec focus ${focusMuscles.length > 1 ? `${focusMuscles.length} muscles` : FOCUS_OPTIONS.find(o => o.value === focusMuscles[0])?.label ?? ''}`
            : 'Continuer →'}
        </button>
      </div>
    )
  }

  // ── Sélecteur de jours ────────────────────────────────────────────────────

  function renderDayPicker() {
    const needed = days ?? 0
    const remaining = needed - selectedDays.length

    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
          Quels jours t'entraînes-tu ?
        </p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
          {remaining > 0
            ? `Encore ${remaining} jour${remaining > 1 ? 's' : ''} à choisir`
            : 'Parfait !'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {WEEKDAY_OPTIONS.map((opt) => {
            const active = selectedDays.includes(opt.value)
            const disabled = advancing || (!active && selectedDays.length >= needed)
            return (
              <button
                key={opt.value}
                onClick={() => toggleDay(opt.value)}
                disabled={disabled}
                style={{
                  padding: '12px 6px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active
                    ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
                    : 'var(--surface)',
                  color: disabled && !active ? 'var(--fg-muted)' : 'var(--fg)',
                  fontWeight: active ? 700 : 400,
                  fontSize: 'var(--fs-body)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                  textAlign: 'center',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {selectedDays.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {WEEKDAY_OPTIONS
              .filter((d) => selectedDays.includes(d.value))
              .map((d) => (
                <span
                  key={d.value}
                  className="t-caption"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 100,
                    background: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    fontWeight: 600,
                  }}
                >
                  {d.full}
                </span>
              ))}
          </div>
        )}
      </div>
    )
  }

  // ── Sélecteur d'objectif avec accordéon périodisation ────────────────────

  function renderGoalPicker() {
    // Couleurs de phase (mêmes constantes que ProgramDetailScreen)
    const PHASE_COLORS = {
      adaptation:      'var(--accent)',
      intensification: '#ff8a3d',
      deload:          'var(--fg-muted)',
    }

    // Modificateurs par objectif — dérivés de PHASE_CONFIG_BY_GOAL (source de vérité)
    function fmtMod(sets: number, reps: number): string {
      const parts: string[] = []
      if (sets !== 0) parts.push(`${sets > 0 ? '+' : ''}${sets} série${Math.abs(sets) > 1 ? 's' : ''}`)
      if (reps !== 0) parts.push(`${reps > 0 ? '+' : ''}${reps} reps`)
      return parts.length ? parts.join(', ') : 'Specs inchangées'
    }
    type GoalPhaseRow = Record<'adaptation' | 'intensification' | 'deload', string>
    const GOAL_PHASES = (Object.keys(PHASE_CONFIG_BY_GOAL) as ProgramGoal[]).reduce<Record<ProgramGoal, GoalPhaseRow>>((acc, g) => {
      const cfg = PHASE_CONFIG_BY_GOAL[g]
      acc[g] = {
        adaptation:      fmtMod(cfg.adaptation.setsModifier,      cfg.adaptation.repsOffset),
        intensification: fmtMod(cfg.intensification.setsModifier, cfg.intensification.repsOffset),
        deload:          fmtMod(cfg.deload.setsModifier,          cfg.deload.repsOffset),
      }
      return acc
    }, {} as Record<ProgramGoal, GoalPhaseRow>)

    const PHASE_ROWS: { key: keyof typeof PHASE_COLORS; emoji: string; name: string }[] = [
      { key: 'adaptation',      emoji: '🌱', name: 'Adaptation' },
      { key: 'intensification', emoji: '🔥', name: 'Intensification' },
      { key: 'deload',          emoji: '🔄', name: 'Décharge' },
    ]

    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 20 }}>
          Quel est ton objectif ?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {STEP_GOAL.options.map((opt) => {
            const active = goal === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { setGoal(opt.value); advance() }}
                disabled={advancing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active
                    ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
                    : 'var(--surface)',
                  color: 'var(--fg)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>{opt.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
                    {opt.sub}
                  </div>
                </div>
                {active && (
                  <div style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }}>
                    <Icon name="check" size={20} strokeWidth={2.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Accordéon périodisation */}
        <button
          onClick={() => setShowPeriodTable((s) => !s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
            fontSize: 'var(--fs-caption)',
            fontWeight: 600,
            letterSpacing: '0.01em',
            width: '100%',
          }}
        >
          <span>📊</span>
          <span>Comment la périodisation s'adapte à l'objectif</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>
            {showPeriodTable ? '▲' : '▼'}
          </span>
        </button>

        {showPeriodTable && (
          <div style={{
            marginTop: 4,
            borderRadius: 'var(--radius-card)',
            border: '1.5px solid var(--border)',
            overflow: 'hidden',
          }}>
            {/* En-tête */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr',
              gap: 0,
              background: 'var(--surface)',
              borderBottom: '1.5px solid var(--border)',
              padding: '6px 10px',
            }}>
              <span className="t-eyebrow" style={{ color: 'var(--fg-muted)' }}>Phase</span>
              <span className="t-eyebrow" style={{ color: 'var(--fg-muted)' }}>Force / Masse</span>
              <span className="t-eyebrow" style={{ color: 'var(--fg-muted)' }}>Forme / Bien-être</span>
            </div>

            {PHASE_ROWS.map((row, i) => (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1fr',
                  gap: 0,
                  padding: '8px 10px',
                  background: i % 2 === 1
                    ? 'color-mix(in oklch, var(--border) 30%, var(--surface))'
                    : 'var(--surface)',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  alignItems: 'start',
                }}
              >
                {/* Nom phase */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 12 }}>{row.emoji}</span>
                  <span
                    className="t-caption"
                    style={{ fontWeight: 700, color: PHASE_COLORS[row.key] }}
                  >
                    {row.name}
                  </span>
                </div>

                {/* Force | Hypertrophy */}
                <div style={{ paddingRight: 8 }}>
                  {(['strength', 'hypertrophy'] as const).map((g) => {
                    const opt = STEP_GOAL.options.find((o) => o.value === g)!
                    const val = GOAL_PHASES[g][row.key]
                    return (
                      <div key={g} style={{ marginBottom: 3 }}>
                        <span
                          className="t-eyebrow"
                          style={{ color: 'var(--fg-muted)', display: 'block' }}
                        >
                          {opt.label}
                        </span>
                        <span className="t-caption" style={{ color: 'var(--fg)' }}>{val}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Fat loss | Endurance */}
                <div>
                  {(['fat_loss', 'endurance'] as const).map((g) => {
                    const opt = STEP_GOAL.options.find((o) => o.value === g)!
                    const val = GOAL_PHASES[g][row.key]
                    return (
                      <div key={g} style={{ marginBottom: 3 }}>
                        <span
                          className="t-eyebrow"
                          style={{ color: 'var(--fg-muted)', display: 'block' }}
                        >
                          {opt.label}
                        </span>
                        <span className="t-caption" style={{ color: 'var(--fg)' }}>{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Progression = toujours base */}
            <div style={{
              padding: '6px 10px',
              background: 'color-mix(in oklch, var(--accent) 6%, var(--surface))',
              borderTop: '1px solid var(--border)',
            }}>
              <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>
                📈 <strong>Progression</strong> — specs du template telles quelles (base commune à tous les objectifs)
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderChips<T extends string | number>(
    step: Step<T>,
    selected: T | null,
    onSelect: (v: T) => void,
  ) {
    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: step.subtitle ? 4 : 20 }}>
          {step.question}
        </p>
        {step.subtitle && (
          <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
            {step.subtitle}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {step.options.map((opt) => {
            const active = selected === opt.value
            return (
              <button
                key={String(opt.value)}
                onClick={() => onSelect(opt.value)}
                disabled={advancing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-card)',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active
                    ? 'color-mix(in oklch, var(--accent) 15%, var(--surface))'
                    : 'var(--surface)',
                  color: 'var(--fg)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>{opt.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 2 }}>
                    {opt.sub}
                  </div>
                </div>
                {active && (
                  <div style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }}>
                    <Icon name="check" size={20} strokeWidth={2.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
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
