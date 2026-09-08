import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useNavigation } from '../../nav/useNavigation'
import { logActivitySession } from '../../utils/sessionOps'
import {
  CARDIO_SPORTS,
  TEAM_SPORTS,
  type ActivityParams,
  type CardioParams,
  type TeamSportParams,
  type StrengthFreeParams,
  type OtherParams,
} from '../../utils/quickLog'
import { Button, Icon } from '../ui'

// ── Types internes ───────────────────────────────────────────────────────────

type Step = 'kind' | 'details'

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Légère',
  2: 'Modérée',
  3: 'Moyenne',
  4: 'Intense',
  5: 'Maximale',
}

const MUSCLE_GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: 'chest',      label: 'Pectoraux' },
  { value: 'back',       label: 'Dos' },
  { value: 'shoulders',  label: 'Épaules' },
  { value: 'biceps',     label: 'Biceps' },
  { value: 'triceps',    label: 'Triceps' },
  { value: 'quads',      label: 'Quadriceps' },
  { value: 'hamstrings', label: 'Ischios' },
  { value: 'glutes',     label: 'Fessiers' },
  { value: 'core',       label: 'Abdos' },
  { value: 'calves',     label: 'Mollets' },
]

type KindOption = {
  value: ActivityParams['kind']
  emoji: string
  label: string
  sub: string
}

const KIND_OPTIONS: KindOption[] = [
  { value: 'cardio',        emoji: '🏃', label: 'Cardio',          sub: 'Course, vélo, natation…' },
  { value: 'strength_free', emoji: '🏋️', label: 'Musculation',     sub: 'Full body, haut du corps…' },
  { value: 'team_sport',    emoji: '⚽', label: 'Sport collectif', sub: 'Football, basket, tennis…' },
  { value: 'other',         emoji: '🧘', label: 'Autre',           sub: 'Yoga, escalade, danse…' },
]

// ── Composant principal ───────────────────────────────────────────────────────

export function QuickLogScreen() {
  const store = useStore()
  const nav = useNavigation()

  const [step, setStep] = useState<Step>('kind')
  const [kind, setKind] = useState<ActivityParams['kind']>('cardio')
  const [durationMin, setDurationMin] = useState(45)
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [cardioSport, setCardioSport] = useState<CardioParams['sport']>('running')
  const [distanceKm, setDistanceKm] = useState('')
  const [teamSport, setTeamSport] = useState('football')
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])
  const [otherLabel, setOtherLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleMuscle = (val: string) =>
    setSelectedMuscles((prev) =>
      prev.includes(val) ? prev.filter((m) => m !== val) : [...prev, val],
    )

  const buildParams = (): ActivityParams => {
    switch (kind) {
      case 'cardio':
        return {
          kind: 'cardio',
          sport: cardioSport,
          durationMin,
          distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
          intensityRating: intensity,
          notes: notes || undefined,
        } satisfies CardioParams
      case 'team_sport':
        return {
          kind: 'team_sport',
          sport: teamSport,
          durationMin,
          intensityRating: intensity,
          notes: notes || undefined,
        } satisfies TeamSportParams
      case 'strength_free':
        return {
          kind: 'strength_free',
          durationMin,
          muscleGroups: selectedMuscles,
          intensityRating: intensity,
          notes: notes || undefined,
        } satisfies StrengthFreeParams
      case 'other':
        return {
          kind: 'other',
          label: otherLabel,
          durationMin,
          intensityRating: intensity,
          notes: notes || undefined,
        } satisfies OtherParams
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await logActivitySession(buildParams(), store)
      nav.back()
    } finally {
      setSaving(false)
    }
  }

  // ── Écran 1 : choix du type ──────────────────────────────────────────────

  if (step === 'kind') {
    return (
      <div className="gt-screen">
        <div className="gt-topbar">
          <button className="gt-iconbtn" onClick={nav.back} aria-label="Retour">
            <Icon name="arrow" size={22} strokeWidth={1.8} />
          </button>
          <h1 className="gt-topbar__title">Enregistrer une séance</h1>
        </div>
        <div className="gt-screen__scroll" style={{ padding: 'var(--pad-screen)' }}>
          <p className="t-body" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
            Quel type d'activité ?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-tile)' }}>
            {KIND_OPTIONS.map((k) => (
              <button
                key={k.value}
                onClick={() => { setKind(k.value); setStep('details') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-card)', padding: '16px var(--pad-card)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 32 }}>{k.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div className="t-body" style={{ fontWeight: 600 }}>{k.label}</div>
                  <div className="t-caption" style={{ color: 'var(--fg-muted)' }}>{k.sub}</div>
                </div>
                <span style={{ color: 'var(--fg-muted)', display: 'flex' }}>
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Écran 2 : détails (adapté au type) ───────────────────────────────────

  return (
    <div className="gt-screen">
      <div className="gt-topbar">
        <button className="gt-iconbtn" onClick={() => setStep('kind')} aria-label="Retour">
          <Icon name="arrow" size={22} strokeWidth={1.8} />
        </button>
        <h1 className="gt-topbar__title">Détails</h1>
      </div>
      <div
        className="gt-screen__scroll"
        style={{ padding: 'var(--pad-screen)', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {/* ── Activité cardio ── */}
        {kind === 'cardio' && (
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Activité</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-tile)' }}>
              {CARDIO_SPORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setCardioSport(s.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: cardioSport === s.value ? 'var(--accent)' : 'var(--surface)',
                    color: cardioSport === s.value ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '10px 12px', cursor: 'pointer',
                    fontSize: 'var(--fs-caption)', fontWeight: cardioSport === s.value ? 600 : 400,
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Sport collectif ── */}
        {kind === 'team_sport' && (
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Sport</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-tile)' }}>
              {TEAM_SPORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setTeamSport(s.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: teamSport === s.value ? 'var(--accent)' : 'var(--surface)',
                    color: teamSport === s.value ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 'var(--radius-card)',
                    padding: '10px 12px', cursor: 'pointer',
                    fontSize: 'var(--fs-caption)', fontWeight: teamSport === s.value ? 600 : 400,
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Autre ── */}
        {kind === 'other' && (
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Activité</div>
            <input
              className="gt-input"
              value={otherLabel}
              onChange={(e) => setOtherLabel(e.target.value)}
              placeholder="Yoga, Escalade, Danse…"
            />
          </section>
        )}

        {/* ── Groupes musculaires (strength_free) ── */}
        {kind === 'strength_free' && (
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Zones travaillées (optionnel)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-tile)' }}>
              {MUSCLE_GROUP_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => toggleMuscle(m.value)}
                  style={{
                    background: selectedMuscles.includes(m.value) ? 'var(--accent)' : 'var(--surface)',
                    color: selectedMuscles.includes(m.value) ? '#fff' : 'var(--fg)',
                    border: 'none', borderRadius: 100, padding: '6px 14px',
                    cursor: 'pointer', fontSize: 'var(--fs-caption)',
                    fontWeight: selectedMuscles.includes(m.value) ? 600 : 400,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Durée ── */}
        <section>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>
            Durée — <span className="t-num">{durationMin}</span> min
          </div>
          <input
            type="range" min={5} max={180} step={5}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>5 min</span>
            <span className="t-caption" style={{ color: 'var(--fg-muted)' }}>3 h</span>
          </div>
        </section>

        {/* ── Distance (cardio uniquement) ── */}
        {kind === 'cardio' && (
          <section>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>Distance (optionnel)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="gt-input"
                type="number" inputMode="decimal" min={0} step={0.1}
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="0.0"
                style={{ flex: 1 }}
              />
              <span className="t-body">{store.settings.preferences.distanceUnit}</span>
            </div>
          </section>
        )}

        {/* ── Intensité ressentie ── */}
        <section>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>
            Intensité — <span style={{ color: 'var(--accent)' }}>{INTENSITY_LABELS[intensity]}</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--gap-tile)' }}>
            {([1, 2, 3, 4, 5] as const).map((v) => (
              <button
                key={v}
                onClick={() => setIntensity(v)}
                style={{
                  flex: 1, padding: '10px 0',
                  background: intensity === v ? 'var(--accent)' : 'var(--surface)',
                  color: intensity === v ? '#fff' : 'var(--fg)',
                  border: 'none', borderRadius: 'var(--radius-card)',
                  fontWeight: 700, cursor: 'pointer',
                  fontSize: 'var(--fs-body)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        {/* ── Note libre ── */}
        <section>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Note (optionnel)</div>
          <textarea
            className="gt-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comment s'est passée la séance ?"
            rows={2}
            style={{ resize: 'none', width: '100%' }}
          />
        </section>

        <Button
          variant="primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer la séance'}
        </Button>
      </div>
    </div>
  )
}
