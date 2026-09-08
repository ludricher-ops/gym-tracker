import { useState, useMemo } from 'react'
import { useStore } from '../../hooks/useStore'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import { useNavigation } from '../../nav/useNavigation'
import { logActivitySession } from '../../utils/sessionOps'
import {
  generateFreeWorkout,
  GOAL_PROFILES,
  EQUIPMENT_LABELS,
  type EnergyLevel,
  type SleepQuality,
  type WorkoutGoal,
  type AvailableTime,
  type EquipmentPreset,
  type SuggestedWorkout,
  type FreeWorkoutInput,
} from '../../utils/freeWorkout'
import { Button, Icon } from '../ui'

// ── Constantes d'affichage ────────────────────────────────────────────────────

const ENERGY_OPTIONS: { value: EnergyLevel; emoji: string; label: string }[] = [
  { value: 1, emoji: '😴', label: 'Épuisé'   },
  { value: 2, emoji: '😔', label: 'Fatigué'  },
  { value: 3, emoji: '😐', label: 'Correct'  },
  { value: 4, emoji: '💪', label: 'En forme' },
  { value: 5, emoji: '⚡', label: 'Au top'   },
]

const SLEEP_OPTIONS: { value: SleepQuality; emoji: string; label: string }[] = [
  { value: 'bad',    emoji: '😴', label: 'Mauvais' },
  { value: 'medium', emoji: '😐', label: 'Moyen'   },
  { value: 'good',   emoji: '✨', label: 'Bien'    },
]

const TIME_OPTIONS: { value: AvailableTime; label: string }[] = [
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 h'    },
  { value: 90, label: '1h30'   },
]

const GOAL_OPTIONS: { value: WorkoutGoal; emoji: string; label: string; sub: string }[] = [
  { value: 'force',        emoji: '🏋️', label: 'Force',        sub: '4-6 reps · charges max'  },
  { value: 'hypertrophie', emoji: '📈', label: 'Hypertrophie', sub: '8-12 reps · volume'      },
  { value: 'pump',         emoji: '🔥', label: 'Pump',         sub: '15-20 reps · brûlure'   },
  { value: 'recup',        emoji: '🧘', label: 'Récupération', sub: 'Léger · mobilité'        },
]

const MUSCLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'chest',      label: 'Pectoraux'  },
  { value: 'back',       label: 'Dos'        },
  { value: 'shoulders',  label: 'Épaules'    },
  { value: 'biceps',     label: 'Biceps'     },
  { value: 'triceps',    label: 'Triceps'    },
  { value: 'quads',      label: 'Quadriceps' },
  { value: 'hamstrings', label: 'Ischios'    },
  { value: 'glutes',     label: 'Fessiers'   },
  { value: 'core',       label: 'Abdos'      },
  { value: 'calves',     label: 'Mollets'    },
]

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Légère', 2: 'Modérée', 3: 'Moyenne', 4: 'Intense', 5: 'Maximale',
}

const MUSCLE_LABEL: Record<string, string> = {
  chest:             'Pectoraux',
  chest_upper:       'Pectoraux hauts',
  chest_lower:       'Pectoraux bas',
  back:              'Dos',
  back_width:        'Dos (largeur)',
  back_thickness:    'Dos (épaisseur)',
  shoulders:         'Épaules',
  shoulders_front:   'Épaules avant',
  shoulders_lateral: 'Épaules latérales',
  shoulders_rear:    'Épaules arrière',
  biceps:            'Biceps',
  triceps:           'Triceps',
  forearms:          'Avant-bras',
  quads:             'Quadriceps',
  hamstrings:        'Ischios',
  glutes:            'Fessiers',
  calves:            'Mollets',
  core:              'Abdos',
  cardio:            'Cardio',
}

// ── Types internes ────────────────────────────────────────────────────────────

type Step = 'energy' | 'timegoal' | 'zones' | 'session'

// ── Composant principal ───────────────────────────────────────────────────────

export function FreeWorkoutScreen() {
  const store  = useStore()
  const nav    = useNavigation()

  const [step,          setStep]          = useState<Step>('energy')
  const [energyLevel,   setEnergyLevel]   = useState<EnergyLevel>(3)
  const [sleepQuality,  setSleepQuality]  = useState<SleepQuality>('medium')
  const [availableTime, setAvailableTime] = useState<AvailableTime>(45)
  const [goal,          setGoal]          = useState<WorkoutGoal>('hypertrophie')
  const [equipment,     setEquipment]     = useState<EquipmentPreset>('full')
  const [targetZones,   setTargetZones]   = useState<string[]>(['full_body'])
  const [workout,       setWorkout]       = useState<SuggestedWorkout | null>(null)
  const [showFinish,    setShowFinish]    = useState(false)
  const [finalDuration, setFinalDuration] = useState(45)
  const [finalIntensity,setFinalIntensity]= useState<1 | 2 | 3 | 4 | 5>(3)
  const [expandedTip,   setExpandedTip]   = useState<number | null>(null)
  const [saving,        setSaving]        = useState(false)

  // Index nom → exercice pour afficher les GIFs dans "Ta séance"
  const exerciseByName = useMemo(
    () => new Map(store.exercises.map(e => [e.name, e])),
    [store.exercises]
  )

  const toggleTargetZone = (val: string) => {
    if (val === 'full_body') { setTargetZones(['full_body']); return }
    setTargetZones(prev => {
      const without = prev.filter(z => z !== 'full_body')
      const next    = without.includes(val) ? without.filter(z => z !== val) : [...without, val]
      return next.length > 0 ? next : ['full_body']
    })
  }

  const goToSession = () => {
    const input: FreeWorkoutInput = { energyLevel, sleepQuality, availableTime, goal, equipment, targetZones }
    const generated = generateFreeWorkout(input)
    setWorkout(generated)
    setFinalDuration(generated.estimatedMin)
    setStep('session')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const muscleGroups = targetZones.includes('full_body')
        ? ['chest', 'back', 'shoulders', 'quads', 'glutes', 'core']
        : targetZones
      await logActivitySession({
        kind: 'strength_free',
        durationMin: finalDuration,
        muscleGroups,
        intensityRating: finalIntensity,
      }, store)
      nav.back()
    } finally {
      setSaving(false)
    }
  }

  // ── Étape 1 : Comment tu te sens ? ──────────────────────────────────────

  if (step === 'energy') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Séance libre</h1>
          <StepDots current={0} total={3} />
        </div>
        <div className="gt-screen__scroll" style={{ padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Énergie */}
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Niveau d'énergie aujourd'hui</div>
            <div style={{ display: 'flex', gap: 'var(--gap-tile)' }}>
              {ENERGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEnergyLevel(opt.value)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    background: energyLevel === opt.value ? 'var(--accent)' : 'var(--surface)',
                    color: energyLevel === opt.value ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '10px 0', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: energyLevel === opt.value ? 700 : 400, lineHeight: 1.1 }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Sommeil */}
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Qualité du sommeil</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-tile)' }}>
              {SLEEP_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSleepQuality(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: sleepQuality === opt.value ? 'var(--accent)' : 'var(--surface)',
                    color: sleepQuality === opt.value ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '10px 6px', cursor: 'pointer',
                    fontSize: 'var(--fs-caption)', fontWeight: sleepQuality === opt.value ? 600 : 400,
                  }}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Button variant="primary" onClick={() => setStep('timegoal')}>
            Continuer →
          </Button>
        </div>
      </div>
    )
  }

  // ── Étape 2 : Temps + Objectif ───────────────────────────────────────────

  if (step === 'timegoal') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={() => setStep('energy')} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Séance libre</h1>
          <StepDots current={1} total={3} />
        </div>
        <div className="gt-screen__scroll" style={{ padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Matériel */}
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Matériel disponible</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
              {(Object.entries(EQUIPMENT_LABELS) as [EquipmentPreset, typeof EQUIPMENT_LABELS[EquipmentPreset]][]).map(([preset, info]) => (
                <button
                  key={preset}
                  onClick={() => setEquipment(preset)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: equipment === preset ? 'var(--accent)' : 'var(--surface)',
                    color: equipment === preset ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '11px var(--pad-card)', cursor: 'pointer', textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{info.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{info.label}</div>
                    <div style={{
                      fontSize: 'var(--fs-caption)',
                      color: equipment === preset ? undefined : 'var(--fg-muted)',
                      opacity: equipment === preset ? 0.85 : 1,
                    }}>{info.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Temps */}
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Temps disponible</div>
            <div style={{ display: 'flex', gap: 'var(--gap-tile)' }}>
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAvailableTime(opt.value)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: availableTime === opt.value ? 'var(--accent)' : 'var(--surface)',
                    color: availableTime === opt.value ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '10px 0', cursor: 'pointer',
                    fontSize: 'var(--fs-caption)', fontWeight: availableTime === opt.value ? 700 : 400,
                    textAlign: 'center', lineHeight: 1.2,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Objectif */}
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Objectif du jour</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: goal === opt.value ? 'var(--accent)' : 'var(--surface)',
                    color: goal === opt.value ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '12px var(--pad-card)', cursor: 'pointer', textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{opt.label}</div>
                    <div style={{
                      fontSize: 'var(--fs-caption)',
                      color: goal === opt.value ? undefined : 'var(--fg-muted)',
                      opacity: goal === opt.value ? 0.85 : 1,
                    }}>
                      {opt.sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <Button variant="primary" onClick={() => setStep('zones')}>
            Continuer →
          </Button>
        </div>
      </div>
    )
  }

  // ── Étape 3 : Zones musculaires ──────────────────────────────────────────

  if (step === 'zones') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={() => setStep('timegoal')} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Séance libre</h1>
          <StepDots current={2} total={3} />
        </div>
        <div className="gt-screen__scroll" style={{ padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p className="t-body" style={{ color: 'var(--fg-muted)' }}>Quelles zones veux-tu travailler ?</p>

          {/* Full body */}
          <button
            onClick={() => toggleTargetZone('full_body')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              background: targetZones.includes('full_body') ? 'var(--accent)' : 'var(--surface)',
              color: targetZones.includes('full_body') ? '#fff' : 'var(--fg)',
              border: 'none', borderRadius: 'var(--radius-card)',
              padding: '14px var(--pad-card)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 28 }}>🌐</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)' }}>Full body</div>
              <div style={{ fontSize: 'var(--fs-caption)', opacity: 0.75 }}>
                Programme équilibré sur tout le corps
              </div>
            </div>
          </button>

          {/* Zones spécifiques */}
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Ou des zones spécifiques</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-tile)' }}>
              {MUSCLE_OPTIONS.map(m => {
                const isSelected = !targetZones.includes('full_body') && targetZones.includes(m.value)
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleTargetZone(m.value)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: isSelected ? 'var(--accent)' : 'var(--surface)',
                      color: isSelected ? '#fff' : 'var(--fg)',
                      border: 'none',
                      borderRadius: 'var(--radius-card)',
                      padding: '10px 12px', cursor: 'pointer',
                      fontSize: 'var(--fs-caption)', fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </section>

          <Button variant="primary" onClick={goToSession}>
            Générer ma séance ✨
          </Button>
        </div>
      </div>
    )
  }

  // ── Étape 4 : Programme suggéré ──────────────────────────────────────────

  if (!workout) return null

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button
          className="gt-iconbtn"
          onClick={() => { setStep('zones'); setShowFinish(false) }}
          aria-label="Retour"
        >
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Ta séance</h1>
      </div>
      <div className="gt-screen__scroll" style={{ padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Chips de résumé */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip label={workout.goalLabel} accent />
          <Chip label={workout.intensityLabel} />
          <Chip label={`~${workout.estimatedMin} min`} />
          <Chip label={`${workout.exercises.length} exercices`} />
        </div>

        {/* Note si objectif adapté */}
        {workout.adjustedGoal !== goal && (
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-card)',
            padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span>💡</span>
            <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>
              Objectif adapté à ton état du jour&nbsp;→&nbsp;
              <strong>{GOAL_PROFILES[workout.adjustedGoal].label}</strong>
            </span>
          </div>
        )}

        {/* Liste d'exercices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
          {workout.exercises.map((ex, i) => {
            const dbEx    = exerciseByName.get(ex.name)
            const hasMedia = !!dbEx?.media
            const muscleLabel = dbEx ? (MUSCLE_LABEL[dbEx.primaryMuscle] ?? dbEx.primaryMuscle) : null
            const THUMB = 72
            return (
              <div
                key={i}
                style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                }}
              >
                {/* Ligne principale : miniature + infos */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>

                  {/* Miniature carrée */}
                  <ExThumb
                    size={THUMB}
                    emoji={ex.emoji}
                    blobId={dbEx?.media?.blobId}
                    url={dbEx?.media?.url}
                  />

                  {/* Infos à droite */}
                  <div style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    padding: '10px 12px',
                  }}>
                    {/* Ligne haute : zone + compteur */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      {muscleLabel ? (
                        <span style={{
                          background: 'var(--accent)', color: '#fff',
                          borderRadius: 100, padding: '2px 10px',
                          fontSize: 'var(--fs-eyebrow)', fontWeight: 700,
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {muscleLabel}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="t-eyebrow" style={{ color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
                        EX {i + 1}/{workout.exercises.length}
                      </span>
                    </div>

                    {/* Nom de l'exercice */}
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-body)', marginTop: 4, lineHeight: 1.2 }}>
                      {ex.name}
                    </div>

                    {/* Séries × reps */}
                    <div className="t-caption" style={{ color: 'var(--fg-muted)', marginTop: 4 }}>
                      {ex.sets} × {ex.reps} reps
                      {' · '}
                      {ex.restSec >= 60
                        ? `${Math.round(ex.restSec / 60)} min`
                        : `${ex.restSec} s`} repos
                    </div>
                  </div>

                  {/* Bouton conseil */}
                  <button
                    onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--fg-muted)',
                      cursor: 'pointer', padding: '0 12px', flexShrink: 0,
                      display: 'flex', alignItems: 'center',
                    }}
                    aria-label="Conseil"
                  >
                    <Icon name={expandedTip === i ? 'chevron-up' : 'chevron-down'} size={14} />
                  </button>
                </div>

                {/* Conseil expansible */}
                {expandedTip === i && (
                  <div className="t-caption" style={{
                    padding: '10px 14px', borderTop: '1px solid var(--border)',
                    color: 'var(--fg-muted)',
                  }}>
                    💡 {ex.tip}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Enregistrement */}
        {!showFinish ? (
          <Button variant="primary" onClick={() => setShowFinish(true)}>
            Enregistrer la séance
          </Button>
        ) : (
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-card)',
            padding: 'var(--pad-card)', display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {/* Durée */}
            <section>
              <div className="t-eyebrow" style={{ marginBottom: 10 }}>
                Durée réelle — <span className="t-num">{finalDuration}</span> min
              </div>
              <input
                type="range" min={10} max={180} step={5}
                value={finalDuration}
                onChange={e => setFinalDuration(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>10 min</span>
                <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>3 h</span>
              </div>
            </section>

            {/* Intensité */}
            <section>
              <div className="t-eyebrow" style={{ marginBottom: 10 }}>
                Intensité ressentie — <span style={{ color: 'var(--accent)' }}>{INTENSITY_LABELS[finalIntensity]}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--gap-tile)' }}>
                {([1, 2, 3, 4, 5] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setFinalIntensity(v)}
                    style={{
                      flex: 1, padding: '10px 0',
                      background: finalIntensity === v ? 'var(--accent)' : 'var(--surface2)',
                      color: finalIntensity === v ? '#fff' : 'var(--fg)',
                      border: 'none', borderRadius: 'var(--radius-card)',
                      fontWeight: 700, cursor: 'pointer', fontSize: 'var(--fs-body)',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </section>

            <Button variant="primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Enregistrement…' : 'Confirmer la séance ✓'}
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Sous-composants ───────────────────────────────────────────────────────────

/** Miniature carrée d'exercice — gère blob local (blobId) et URL distante. */
function ExThumb({ size, emoji, blobId, url }: {
  size: number
  emoji: string
  blobId?: string | null
  url?: string | null
}) {
  const blobSrc = useObjectUrl(blobId ?? null)
  const src = url || blobSrc
  const [errored, setErrored] = useState(false)

  return (
    <div style={{
      width: size, minWidth: size, height: size,
      background: 'var(--surface2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {src && !errored ? (
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setErrored(true)}
        />
      ) : (
        <span style={{ fontSize: 28 }}>{emoji}</span>
      )}
    </div>
  )
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 16 : 6,
            height: 6,
            borderRadius: 100,
            background: i === current ? 'var(--accent)' : 'var(--border)',
            transition: 'width 0.2s',
          }}
        />
      ))}
    </div>
  )
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span style={{
      background: accent ? 'var(--accent)' : 'var(--surface)',
      color: accent ? '#fff' : 'var(--fg-muted)',
      borderRadius: 100, padding: '4px 12px',
      fontSize: 'var(--fs-caption)', fontWeight: 600,
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}
