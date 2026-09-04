// Wizard de génération automatique de programme.
// 6 questions en chips → génère un DraftProgram → ouvre le builder à l'étape Revue.

import { useEffect, useState } from 'react'
import type { Equipment, ProgramGoal, ProgramLevel, Weekday } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { Icon } from '../ui'
import {
  generateProgramDraft,
  type FocusMuscle,
  type GeneratorParams,
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
    { value: 'endurance',   label: '🧘 Bien-être',    sub: 'Condition physique générale'       },
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

// ── Options équipement (multi-select) ────────────────────────────────────────

interface EquipmentOption {
  value: Equipment
  emoji: string
  label: string
}

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'barbell',    emoji: '🏋️', label: 'Barre olympique'  },
  { value: 'dumbbell',   emoji: '🔩',  label: 'Haltères'         },
  { value: 'cable',      emoji: '🔗',  label: 'Câbles / poulie'  },
  { value: 'machine',    emoji: '⚙️',  label: 'Machines'         },
  { value: 'bodyweight', emoji: '🤸',  label: 'Poids du corps'   },
  { value: 'kettlebell', emoji: '🫙',  label: 'Kettlebell'       },
  { value: 'band',       emoji: '🪢',  label: 'Élastiques'       },
]

interface EquipmentPreset { label: string; items: Equipment[] }

const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  { label: '🏟️ Salle',   items: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band'] },
  { label: '🏠 Maison',  items: ['dumbbell', 'bodyweight', 'kettlebell', 'band'] },
  { label: '🤸 Cardio',  items: ['bodyweight', 'band'] },
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

// ── Ordre des étapes ──────────────────────────────────────────────────────────
// 0: Objectif  1: Fréquence  2: Jours  3: Durée  4: Équipement  5: Niveau  6: Muscles
const STEP_TITLE = ['Objectif', 'Fréquence', 'Jours', 'Durée', 'Équipement', 'Niveau', 'Muscles']
const TOTAL = 7

// ── Composant ─────────────────────────────────────────────────────────────────

export function ProgramGeneratorScreen() {
  const store = useStore()
  const nav = useNavigation()

  const [stepIndex, setStepIndex] = useState(0)
  const [goal, setGoal]           = useState<ProgramGoal | null>(null)
  const [days, setDays]           = useState<2 | 3 | 4 | 5 | null>(null)
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([])
  const [duration, setDuration]   = useState<20 | 45 | 60 | 90 | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [level, setLevel]         = useState<ProgramLevel | null>(null)
  const [focusMuscles, setFocusMuscles] = useState<FocusMuscle[]>([])
  const [advancing, setAdvancing] = useState(false)

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
    else setStepIndex((s) => s - 1)
  }

  function handleGenerate() {
    if (!goal || !days || !duration || equipment.length === 0 || !level) return

    // Trier les jours dans l'ordre de la semaine
    const orderedDays = WEEKDAY_OPTIONS
      .filter((d) => selectedDays.includes(d.value))
      .map((d) => d.value)

    const params: GeneratorParams = {
      goal, daysPerWeek: days, sessionDuration: duration,
      equipment, level, selectedDays: orderedDays,
      focusMuscles: focusMuscles.length > 0 ? focusMuscles : undefined,
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

  // ── Sélection des jours (étape 2) ──────────────────────────────────────────

  // Auto-avance quand exactement N jours sont sélectionnés.
  // Effet hors de l'updater pour éviter les doubles timers en React Strict Mode.
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
      if (prev.length >= days) return prev  // déjà au max
      return [...prev, day]
    })
  }

  // ── Rendu des étapes ────────────────────────────────────────────────────────

  function renderStep() {
    if (stepIndex === 0) {
      return renderChips(STEP_GOAL, goal, (v: ProgramGoal) => {
        setGoal(v); advance()
      })
    }
    if (stepIndex === 1) {
      return renderChips(STEP_DAYS, days, (v: 2 | 3 | 4 | 5) => {
        setDays(v)
        // Reset la sélection de jours quand on change le compte
        setSelectedDays([])
        advance()
      })
    }
    if (stepIndex === 2) {
      return renderDayPicker()
    }
    if (stepIndex === 3) {
      return renderChips(STEP_DURATION, duration, (v: 20 | 45 | 60 | 90) => {
        setDuration(v); advance()
      })
    }
    if (stepIndex === 4) {
      return renderEquipmentPicker()
    }
    if (stepIndex === 5) {
      return renderChips(STEP_LEVEL, level, (v: ProgramLevel) => {
        setLevel(v); advance()
      })
    }
    // Étape 7 — Muscles prioritaires : multi-select + bouton Générer
    return renderMusclePicker()
  }

  // Sélecteur d'équipement — raccourcis + multi-select + bouton Continuer
  function renderEquipmentPicker() {
    function toggleEquipment(e: Equipment) {
      setEquipment((prev) =>
        prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
      )
    }

    // Nombre d'exercices disponibles pour l'équipement sélectionné (non-warmup, actifs)
    const availableCount = equipment.length === 0 ? 0 :
      store.exercises.filter(
        (ex) => !ex.deleted && !ex.isWarmupExercise && equipment.includes(ex.equipment),
      ).length

    return (
      <div style={{ padding: '0 16px' }}>
        <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
          Quel équipement as-tu ?
        </p>
        <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
          Sélectionne tout ce qui est disponible.
        </p>

        {/* Raccourcis */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {EQUIPMENT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setEquipment(preset.items)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.12s',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Multi-select équipements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {EQUIPMENT_OPTIONS.map((opt) => {
            const active = equipment.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => toggleEquipment(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
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
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Warning si peu d'exercices disponibles */}
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
                ? 'Aucun exercice disponible pour cet équipement — le programme sera vide.'
                : `Seulement ${availableCount} exercice${availableCount > 1 ? 's' : ''} disponibles — certains slots de séance seront vides.`}
            </span>
          </div>
        )}

        {/* Bouton Continuer */}
        <button
          onClick={() => { if (equipment.length > 0) advance() }}
          disabled={equipment.length === 0}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-card)',
            border: 'none',
            background: equipment.length > 0 ? 'var(--accent)' : 'var(--border)',
            color: equipment.length > 0 ? 'var(--accent-ink)' : 'var(--fg-muted)',
            fontSize: 'var(--fs-body)',
            fontWeight: 700,
            cursor: equipment.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {equipment.length > 0
            ? `Continuer avec ${equipment.length} équipement${equipment.length > 1 ? 's' : ''}`
            : 'Sélectionne au moins un équipement'}
        </button>
      </div>
    )
  }

  // Sélecteur de muscles prioritaires — multi-select + bouton Générer
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

        <button
          onClick={handleGenerate}
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
            ? `⚡ Générer avec focus ${focusMuscles.length > 1 ? `${focusMuscles.length} muscles` : FOCUS_OPTIONS.find(o => o.value === focusMuscles[0])?.label ?? ''}`
            : '⚡ Générer mon programme'}
        </button>
      </div>
    )
  }

  // Sélecteur de jours — grille 7 boutons + compteur
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

        {/* Grille des jours */}
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

        {/* Résumé des jours sélectionnés */}
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
          {stepIndex + 1}/{TOTAL}
        </span>
      </div>

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 16px 20px' }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= stepIndex ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      <div className="gt-screen__scroll" style={{ paddingTop: 0 }}>
        {renderStep()}
      </div>
    </div>
  )
}
