// Composants d'étape du wizard de génération de programme.
// Chaque composant correspond à une étape du wizard et est mémoïsable.

import { memo } from 'react'
import type { Equipment, Exercise, ProgramGoal, ProgramLevel, Weekday } from '../../types'
import { Icon } from '../ui'
import {
  buildPhases,
  PHASE_CONFIG_BY_GOAL,
  type FocusMuscle,
  type SplitPreference,
} from '../../utils/programGenerator'
import {
  STEP_GOAL,
  WEEKDAY_OPTIONS,
  LIEU_OPTIONS,
  EQUIPMENT_OPTIONS,
  CARDIO_OPTIONS,
  FOCUS_OPTIONS,
  STEP_TITLE as _STEP_TITLE,
  programWeeksOptions,
  type Step,
  type Lieu,
  type EquipmentOption,
  type FocusOption,
} from './programGeneratorData'

// ── ChipStep — sélecteur générique en chips ───────────────────────────────────

interface ChipStepProps<T extends string | number> {
  step: Step<T>
  selected: T | null
  advancing: boolean
  onSelect: (v: T) => void
}

export function ChipStep<T extends string | number>({
  step, selected, advancing, onSelect,
}: ChipStepProps<T>) {
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

// ── GoalPickerStep — objectif avec accordéon périodisation ───────────────────

interface GoalPickerStepProps {
  goal: ProgramGoal | null
  advancing: boolean
  showPeriodTable: boolean
  onSelect: (v: ProgramGoal) => void
  onTogglePeriodTable: () => void
}

// Couleurs de phase (mêmes constantes que ProgramDetailScreen)
const PHASE_COLORS = {
  adaptation:      'var(--accent)',
  intensification: '#ff8a3d',
  deload:          'var(--fg-muted)',
} as const

const PHASE_ROWS: { key: keyof typeof PHASE_COLORS; emoji: string; name: string }[] = [
  { key: 'adaptation',      emoji: '🌱', name: 'Adaptation' },
  { key: 'intensification', emoji: '🔥', name: 'Intensification' },
  { key: 'deload',          emoji: '🔄', name: 'Récup.' },
]

function fmtMod(sets: number, reps: number): string {
  const parts: string[] = []
  if (sets !== 0) parts.push(`${sets > 0 ? '+' : ''}${sets} série${Math.abs(sets) > 1 ? 's' : ''}`)
  if (reps !== 0) parts.push(`${reps > 0 ? '+' : ''}${reps} reps`)
  return parts.length ? parts.join(', ') : 'Specs inchangées'
}

type GoalPhaseRow = Record<'adaptation' | 'intensification' | 'deload', string>
const GOAL_PHASES = (Object.keys(PHASE_CONFIG_BY_GOAL) as ProgramGoal[]).reduce<Record<ProgramGoal, GoalPhaseRow>>(
  (acc, g) => {
    const cfg = PHASE_CONFIG_BY_GOAL[g]
    acc[g] = {
      adaptation:      fmtMod(cfg.adaptation.setsModifier,      cfg.adaptation.repsOffset),
      intensification: fmtMod(cfg.intensification.setsModifier, cfg.intensification.repsOffset),
      deload:          fmtMod(cfg.deload.setsModifier,          cfg.deload.repsOffset),
    }
    return acc
  },
  {} as Record<ProgramGoal, GoalPhaseRow>,
)

export const GoalPickerStep = memo(function GoalPickerStep({
  goal, advancing, showPeriodTable, onSelect, onTogglePeriodTable,
}: GoalPickerStepProps) {
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

      {/* Accordéon périodisation */}
      <button
        onClick={onTogglePeriodTable}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{row.emoji}</span>
                <span className="t-caption" style={{ fontWeight: 700, color: PHASE_COLORS[row.key] }}>
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
                      <span className="t-eyebrow" style={{ color: 'var(--fg-muted)', display: 'block' }}>
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
                      <span className="t-eyebrow" style={{ color: 'var(--fg-muted)', display: 'block' }}>
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
})

// ── SplitPickerStep — structure de programme ──────────────────────────────────

interface SplitPickerStepProps {
  splitPreference: SplitPreference
  days: 2 | 3 | 4 | 5 | null
  level: ProgramLevel | null
  goal: ProgramGoal | null
  onSelect: (value: SplitPreference, skipMuscles: boolean) => void
}

function incompatibleReason(
  value: SplitPreference,
  days: 2 | 3 | 4 | 5 | null,
  level: ProgramLevel | null,
  goal: ProgramGoal | null,
): string | null {
  switch (value) {
    case 'brosplit':
      if (days !== null && days < 5) return `Nécessite 5 séances/sem. — tu en as ${days}`
      if (level === 'beginner') return 'Fréquence trop faible par muscle pour un débutant'
      if (goal === 'strength') return 'Force requiert 2-3 stimuli/sem. par muscle — Brosplit n\'en donne qu\'un'
      if (goal === 'endurance') return 'Endurance : fréquence élevée par muscle requise — Brosplit trop peu fréquent'
      // INC-5 fix : fat_loss bénéficie aussi d'une haute fréquence par groupe
      if (goal === 'fat_loss') return 'Remise en forme : fréquence élevée par muscle recommandée — Brosplit stimule chaque muscle 1×/sem.'
      return null
    case 'arnold':
      if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
      if (level === 'beginner') return 'Volume et complexité élevés — déconseillé en débutant'
      if (goal === 'strength') return 'Split bodybuilding — Force préfère Full Body ou Upper/Lower (fréquence 2-3×/sem.)'
      if (goal === 'endurance') return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
      // INC-5 fix
      if (goal === 'fat_loss') return 'Remise en forme : fréquence élevée par muscle recommandée — préfère Full Body ou Upper/Lower'
      return null
    case 'ppl':
      if (days !== null && days < 3) return `Nécessite 3 séances/sem. minimum — tu en as ${days}`
      if (goal === 'strength') return 'Split orienté hypertrophie — Force préfère Full Body ou Upper/Lower (2-3 stimuli/sem.)'
      if (goal === 'endurance') return 'Endurance : fréquence élevée par muscle requise — préfère Full Body ou Upper/Lower'
      return null
    // BUG-D6 / INC-3 fix : glutes-focus passe désormais par incompatibleReason
    case 'glutes-focus':
      if (goal === 'strength') return 'Programme spécialisation bas du corps — Force préfère des splits incluant des composés haut du corps'
      return null
    default:
      return null
  }
}

interface SplitButtonProps {
  value: SplitPreference
  icon: string
  label: string
  sub: string
  active: boolean
  disabled: boolean
  reason: string | null
  onClick: () => void
}

function SplitButton({ value, icon, label, sub, active, disabled, reason, onClick }: SplitButtonProps) {
  return (
    // BUG-D1 fix : ajout de disabled + aria-disabled pour accessibilité
    <button
      key={value}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
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
}

const SPLIT_OPTIONS: { value: SplitPreference; label: string; sub: string; icon: string }[] = [
  { value: 'auto',        icon: '🤖', label: 'Auto',          sub: 'Le coach choisit selon tes critères'             },
  { value: 'fullbody',    icon: '🌐', label: 'Full Body',      sub: 'Corps entier à chaque séance'                    },
  { value: 'upper-lower', icon: '↕️', label: 'Upper / Lower', sub: 'Haut et bas du corps en alternance'               },
  { value: 'ppl',         icon: '🔄', label: 'PPL',           sub: 'Push · Pull · Legs — le classique'               },
  { value: 'arnold',      icon: '🏆', label: 'Arnold Split',  sub: 'Pecs+Dos / Épaules+Bras / Jambes'                },
  { value: 'brosplit',    icon: '💪', label: 'Bro Split',     sub: 'Un groupe musculaire par séance, volume max'      },
]

export const SplitPickerStep = memo(function SplitPickerStep({
  splitPreference, days, level, goal, onSelect,
}: SplitPickerStepProps) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
        Choisis la structure de tes semaines. En mode Auto, le coach adapte selon ton objectif et ta fréquence.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SPLIT_OPTIONS.map(({ value, icon, label, sub }) => {
          const reason = incompatibleReason(value, days, level, goal)
          const disabled = reason !== null
          const active = splitPreference === value
          return (
            <SplitButton
              key={value}
              value={value}
              icon={icon}
              label={label}
              sub={sub}
              active={active}
              disabled={disabled}
              reason={reason}
              onClick={() => {
                if (!disabled) onSelect(value, value !== 'auto')
              }}
            />
          )
        })}
      </div>

      {/* ── Programmes spécialisés ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 10px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span className="t-eyebrow" style={{ color: 'var(--fg-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Programmes spécialisés
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          // BUG-D6 / INC-3 fix : glutes-focus passe maintenant par incompatibleReason
          const gluteReason = incompatibleReason('glutes-focus', days, level, goal)
          return (
            <SplitButton
              value="glutes-focus"
              icon="🍑"
              label="Glutes+Dos"
              sub="Fessiers & dos — séances sans push (pecs, épaules, bras)"
              active={splitPreference === 'glutes-focus'}
              disabled={gluteReason !== null}
              reason={gluteReason}
              onClick={() => {
                if (gluteReason === null) onSelect('glutes-focus', true)
              }}
            />
          )
        })()}
      </div>
    </div>
  )
})

// ── MusclePiclerStep — muscles prioritaires ───────────────────────────────────

interface MusclePickerStepProps {
  focusMuscles: FocusMuscle[]
  level: ProgramLevel | null
  onToggle: (m: FocusMuscle) => void
  onContinue: () => void
}

export const MusclePickerStep = memo(function MusclePickerStep({
  focusMuscles, level, onToggle, onContinue,
}: MusclePickerStepProps) {
  const noBack = focusMuscles.length > 0 && !focusMuscles.includes('back')
  const noLegs = focusMuscles.length > 0 && !focusMuscles.includes('legs')
  const missingText = [noBack && 'dos', noLegs && 'jambes'].filter(Boolean).join(' ni ')

  return (
    <div style={{ padding: '0 16px' }}>
      <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
        Quels muscles veux-tu prioriser ?
      </p>
      <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
        Optionnel — le programme reste équilibré, mais les séances courtes favoriseront ces muscles.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {FOCUS_OPTIONS.map((opt: FocusOption) => {
          const active = focusMuscles.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
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
      {missingText && (
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
              Pas de {missingText} dans ta sélection.
            </div>
            <div className="t-caption" style={{ color: 'var(--fg)', marginTop: 2 }}>
              {level === 'beginner'
                ? `Pour un débutant, négliger le ${missingText} crée un déséquilibre qui ralentit la progression globale.`
                : `Un programme sans ${missingText} peut entraîner des déséquilibres musculaires à terme.`}
            </div>
          </div>
        </div>
      )}

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
        onClick={onContinue}
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
})

// ── DayPickerStep — sélection des jours ──────────────────────────────────────

interface DayPickerStepProps {
  days: number | null
  selectedDays: Weekday[]
  advancing: boolean
  onToggle: (day: Weekday) => void
}

export const DayPickerStep = memo(function DayPickerStep({
  days, selectedDays, advancing, onToggle,
}: DayPickerStepProps) {
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
              onClick={() => onToggle(opt.value)}
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
})

// ── LieuPickerStep — lieu d'entraînement ─────────────────────────────────────

interface LieuPickerStepProps {
  lieu: Lieu | null
  advancing: boolean
  onSelect: (lieu: Lieu, preset: Equipment[]) => void
}

export const LieuPickerStep = memo(function LieuPickerStep({
  lieu, advancing, onSelect,
}: LieuPickerStepProps) {
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
              onClick={() => onSelect(opt.value, opt.preset)}
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
})

// ── EquipmentPickerStep — équipement disponible ───────────────────────────────

interface EquipmentPickerStepProps {
  equipment: Equipment[]
  goal: ProgramGoal | null
  lieu: Lieu | null
  advancing: boolean
  exercises: Exercise[]
  onToggle: (e: Equipment) => void
  onContinue: () => void
}

function EquipmentButton({
  opt, active, onToggle,
}: { opt: EquipmentOption; active: boolean; onToggle: (e: Equipment) => void }) {
  return (
    <button
      onClick={() => onToggle(opt.value)}
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

export const EquipmentPickerStep = memo(function EquipmentPickerStep({
  equipment, goal, lieu, advancing, exercises, onToggle, onContinue,
}: EquipmentPickerStepProps) {
  // Fix EQUIP-5 : exclure les exercices cardio (primaryMuscle:'cardio') — aucun slot de force ne les cible
  const availableCount = equipment.length === 0 ? 0 :
    exercises.filter(
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

  const canContinue = equipment.length > 0 && availableCount > 0

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
        {EQUIPMENT_OPTIONS.map((opt) => (
          <EquipmentButton
            key={opt.value}
            opt={opt}
            active={equipment.includes(opt.value)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Section cardio */}
      <p className="t-caption" style={{ fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Cardio
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {CARDIO_OPTIONS.map((opt) => (
          <EquipmentButton
            key={opt.value}
            opt={opt}
            active={equipment.includes(opt.value)}
            onToggle={onToggle}
          />
        ))}
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
        onClick={() => { if (canContinue) onContinue() }}
        disabled={!canContinue || advancing}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius-card)',
          border: 'none',
          background: canContinue ? 'var(--accent)' : 'var(--border)',
          color: canContinue ? 'var(--accent-ink)' : 'var(--fg-muted)',
          fontSize: 'var(--fs-body)',
          fontWeight: 700,
          cursor: canContinue ? 'pointer' : 'not-allowed',
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
})

// ── ProgramWeeksPickerStep — durée du programme ───────────────────────────────

interface ProgramWeeksPickerStepProps {
  level: ProgramLevel | null
  programWeeks: number | null
  advancing: boolean
  onSelect: (weeks: number | null) => void
}

export const ProgramWeeksPickerStep = memo(function ProgramWeeksPickerStep({
  level, programWeeks, advancing, onSelect,
}: ProgramWeeksPickerStepProps) {
  const options = programWeeksOptions(level)

  // Étiquette des blocs en langage accessible — délègue à buildPhases (source de vérité)
  function phaseLabel(weeks: number): string {
    const phases = buildPhases(weeks)
    if (!phases) return ''
    const plain: Record<string, string> = {
      adaptation:      'rodage',
      progression:     'progression',
      intensification: 'pic d\'effort',
      deload:          'récup.',
    }
    return phases.map((ph) => {
      const dur = ph.weekEnd - ph.weekStart + 1
      return `${dur} sem. ${plain[ph.focus] ?? ph.focus}`
    }).join(' → ')
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <p className="t-title" style={{ fontWeight: 700, marginBottom: 4 }}>
        Sur combien de semaines ?
      </p>
      <p className="t-caption" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
        Le volume et l'intensité évoluent automatiquement semaine après semaine selon des blocs progressifs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {options.map((opt) => {
          const active = programWeeks === opt.value
          const phaseInfo = opt.value !== null ? phaseLabel(opt.value) : null
          return (
            <button
              key={String(opt.value)}
              onClick={() => onSelect(opt.value)}
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
})
