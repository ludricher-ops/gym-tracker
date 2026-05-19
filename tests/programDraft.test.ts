import { describe, it, expect } from 'vitest'
import { defaultWE, draftStats } from '../src/components/programBuilder/programDraft'
import type { DraftProgram } from '../src/components/programBuilder/programDraft'

describe('defaultWE — exercice principal', () => {
  it('poids+reps : 3 séries, fourchette 8-12, repos 90s, progression activée', () => {
    const we = defaultWE('ex-1', 'weight_reps')
    expect(we.targetSets).toBe(3)
    expect(we.repsMode).toBe('range')
    expect(we.targetRepsMin).toBe(8)
    expect(we.targetRepsMax).toBe(12)
    expect(we.restSec).toBe(90)
    expect(we.autoProgress).toBe(true)
    expect(we.progressStepKg).toBe(2.5)
    expect(we.isWarmup).toBeUndefined()
    expect(we.isAb).toBeUndefined()
  })

  it('reps seules : mêmes valeurs par défaut', () => {
    const we = defaultWE('ex-1', 'reps_only')
    expect(we.targetSets).toBe(3)
    expect(we.repsMode).toBe('range')
    expect(we.restSec).toBe(90)
  })

  it('temps : 3 séries, 30s, repos 60s, pas de progression', () => {
    const we = defaultWE('ex-1', 'time')
    expect(we.targetSets).toBe(3)
    expect(we.targetDurationSec).toBe(30)
    expect(we.restSec).toBe(60)
    expect(we.autoProgress).toBe(false)
  })
})

describe('defaultWE — échauffement (isWarmup)', () => {
  it('poids+reps : 1 série, 10 reps, fixe, repos 15s, pas de progression', () => {
    const we = defaultWE('ex-1', 'weight_reps', false, true)
    expect(we.targetSets).toBe(1)
    expect(we.repsMode).toBe('fixed')
    expect(we.targetRepsMin).toBe(10)
    expect(we.restSec).toBe(15)
    expect(we.autoProgress).toBe(false)
  })

  it('temps : 1 série, 20s, repos 15s', () => {
    const we = defaultWE('ex-1', 'time', false, true)
    expect(we.targetSets).toBe(1)
    expect(we.targetDurationSec).toBe(20)
    expect(we.restSec).toBe(15)
  })

  it('reps_only : 1 série, 10 reps, repos 15s', () => {
    const we = defaultWE('ex-1', 'reps_only', false, true)
    expect(we.targetSets).toBe(1)
    expect(we.targetRepsMin).toBe(10)
    expect(we.restSec).toBe(15)
  })
})

// isAb reste dans le modèle de données pour la compatibilité avec les programmes
// existants chargés via draftFromProgram. L'UI builder ne crée plus de nouveaux
// exercices ab (le bouton a été supprimé), mais les anciens programmes les lisent.
describe('defaultWE — compat données abdominaux (isAb)', () => {
  it('reps : 1 série, 40 reps, fixe, repos 15s, pas de progression', () => {
    const we = defaultWE('ex-1', 'weight_reps', true)
    expect(we.targetSets).toBe(1)
    expect(we.repsMode).toBe('fixed')
    expect(we.targetRepsMin).toBe(40)
    expect(we.restSec).toBe(15)
    expect(we.autoProgress).toBe(false)
  })

  it('reps_only : 1 série, 40 reps, repos 15s', () => {
    const we = defaultWE('ex-1', 'reps_only', true)
    expect(we.targetSets).toBe(1)
    expect(we.targetRepsMin).toBe(40)
    expect(we.restSec).toBe(15)
  })

  it('temps : 1 série, 45s, repos 15s', () => {
    const we = defaultWE('ex-1', 'time', true)
    expect(we.targetSets).toBe(1)
    expect(we.targetDurationSec).toBe(45)
    expect(we.restSec).toBe(15)
  })
})

describe('defaultWE — propriétés communes', () => {
  it('attribue toujours un localId non vide', () => {
    const a = defaultWE('ex-1', 'weight_reps')
    const b = defaultWE('ex-1', 'weight_reps')
    expect(a.localId).toBeTruthy()
    expect(b.localId).toBeTruthy()
    expect(a.localId).not.toBe(b.localId)
  })

  it('isWarmup a priorité sur isAb quand les deux sont vrais', () => {
    const we = defaultWE('ex-1', 'reps_only', true, true)
    expect(we.targetRepsMin).toBe(10)
    expect(we.restSec).toBe(15)
  })
})

// ── helpers ──────────────────────────────────────────────────────────────────

function makeWorkout(exCount: number, localId: string) {
  return {
    localId,
    name: 'Séance',
    type: 'upper' as const,
    muscleGroups: [],
    exercises: Array.from({ length: exCount }, (_, i) => defaultWE(`ex-${i}`, 'weight_reps')),
  }
}

function makeDraft(overrides: Partial<DraftProgram> = {}): DraftProgram {
  return {
    name: 'Test',
    goal: 'hypertrophy',
    level: 'intermediate',
    durationWeeks: 12,
    sessionsPerWeek: 3,
    color: '#000',
    workouts: [],
    week: {},
    ...overrides,
  }
}

describe('draftStats', () => {
  it('programme vide : 0 jours entraînement, 7 repos, 0 exercices', () => {
    expect(draftStats(makeDraft())).toEqual({ trainingDays: 0, restDays: 7, totalExercises: 0 })
  })

  it('compte les jours assignés dans week', () => {
    const w = makeWorkout(3, 'w1')
    const stats = draftStats(makeDraft({
      workouts: [w],
      week: { monday: 'w1', wednesday: 'w1', friday: 'w1' },
    }))
    expect(stats.trainingDays).toBe(3)
    expect(stats.restDays).toBe(4)
  })

  it('totalExercises = somme de tous les workouts (assignés ou non)', () => {
    const stats = draftStats(makeDraft({
      workouts: [makeWorkout(5, 'w1'), makeWorkout(4, 'w2')],
      week: { monday: 'w1' },
    }))
    expect(stats.totalExercises).toBe(9)
  })

  it('semaine pleine : 7 jours entraînement, 0 repos', () => {
    const w = makeWorkout(2, 'w1')
    const stats = draftStats(makeDraft({
      workouts: [w],
      week: {
        monday: 'w1', tuesday: 'w1', wednesday: 'w1',
        thursday: 'w1', friday: 'w1', saturday: 'w1', sunday: 'w1',
      },
    }))
    expect(stats.trainingDays).toBe(7)
    expect(stats.restDays).toBe(0)
  })
})
