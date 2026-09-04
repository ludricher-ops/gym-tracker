// Wizard de génération automatique de programme.
// 5 questions en chips → génère un DraftProgram → ouvre le builder à l'étape Revue.

import { useState } from 'react'
import type { ProgramGoal, ProgramLevel } from '../../types'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { Icon } from '../ui'
import { generateProgramDraft, type GeneratorEquipment, type GeneratorParams } from '../../utils/programGenerator'
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

const STEP_DURATION: Step<45 | 60 | 90> = {
  question: "Durée d'une séance ?",
  subtitle: "Échauffement non inclus.",
  options: [
    { value: 45, label: '45 min',  sub: 'Séance courte et efficace' },
    { value: 60, label: '1 heure', sub: 'Le format classique'       },
    { value: 90, label: '1h 30',   sub: 'Volume élevé'              },
  ],
}

const STEP_EQUIPMENT: Step<GeneratorEquipment> = {
  question: "Quel équipement as-tu ?",
  options: [
    { value: 'full_gym',         label: '🏋️ Salle complète',   sub: 'Barres, haltères, câbles, machines' },
    { value: 'dumbbell_barbell', label: '🏠 Haltères & barre', sub: 'Barres et haltères libres'          },
    { value: 'bodyweight',       label: '🤸 Poids du corps',   sub: 'Aucun matériel nécessaire'          },
  ],
}

const STEP_LEVEL: Step<ProgramLevel> = {
  question: "Quel est ton niveau ?",
  options: [
    { value: 'beginner',     label: '🌱 Débutant',     sub: 'Moins d\'un an de pratique'  },
    { value: 'intermediate', label: '💡 Intermédiaire', sub: 'Entre 1 et 3 ans'           },
    { value: 'advanced',     label: '🔥 Confirmé',     sub: 'Plus de 3 ans d\'expérience' },
  ],
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ProgramGeneratorScreen() {
  const store = useStore()
  const nav = useNavigation()

  const [stepIndex, setStepIndex] = useState(0)
  const [goal, setGoal]           = useState<ProgramGoal | null>(null)
  const [days, setDays]           = useState<2 | 3 | 4 | 5 | null>(null)
  const [duration, setDuration]   = useState<45 | 60 | 90 | null>(null)
  const [equipment, setEquipment] = useState<GeneratorEquipment | null>(null)
  const [level, setLevel]         = useState<ProgramLevel | null>(null)
  const [advancing, setAdvancing] = useState(false)

  // Auto-avance vers la prochaine étape après un clic (sauf la dernière)
  function advance() {
    if (stepIndex < 4) {
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
    if (!goal || !days || !duration || !equipment || !level) return

    const params: GeneratorParams = {
      goal, daysPerWeek: days, sessionDuration: duration, equipment, level,
    }
    const draft = generateProgramDraft(params, store.exercises)
    setPendingDraft(draft)
    nav.navigate('programBuilder')
  }

  // Indicateur de progression (5 points)
  const TOTAL = 5

  // ── Rendu des étapes ────────────────────────────────────────────────────────

  function renderStep() {
    if (stepIndex === 0) {
      return renderChips(STEP_GOAL, goal, (v: ProgramGoal) => {
        setGoal(v); advance()
      })
    }
    if (stepIndex === 1) {
      return renderChips(STEP_DAYS, days, (v: 2 | 3 | 4 | 5) => {
        setDays(v); advance()
      })
    }
    if (stepIndex === 2) {
      return renderChips(STEP_DURATION, duration, (v: 45 | 60 | 90) => {
        setDuration(v); advance()
      })
    }
    if (stepIndex === 3) {
      return renderChips(STEP_EQUIPMENT, equipment, (v: GeneratorEquipment) => {
        setEquipment(v); advance()
      })
    }
    // Étape 5 — Niveau : sélection + bouton Générer
    return (
      <>
        {renderChips(STEP_LEVEL, level, (v: ProgramLevel) => setLevel(v))}
        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={handleGenerate}
            disabled={!level}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--radius-card)',
              border: 'none',
              background: level ? 'var(--accent)' : 'var(--fg-muted)',
              color: 'var(--accent-ink)',
              fontSize: 'var(--fs-body)',
              fontWeight: 700,
              cursor: level ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            ⚡ Générer mon programme
          </button>
        </div>
      </>
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

  // Titre de l'étape courante
  const STEP_TITLE = ['Objectif', 'Fréquence', 'Durée', 'Équipement', 'Niveau']

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
