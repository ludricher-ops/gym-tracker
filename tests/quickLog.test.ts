import { describe, it, expect, vi } from 'vitest'
import {
  sessionNameFromParams,
  emojiFromParams,
  type CardioParams,
  type TeamSportParams,
  type StrengthFreeParams,
  type OtherParams,
} from '../src/utils/quickLog'
import { logActivitySession } from '../src/utils/sessionOps'
import type { Session, SessionExercise, SetRecord, Exercise } from '../src/types'
import type { StoreApi } from '../src/hooks/useStore'

function makeStore(): StoreApi & { saved: unknown[] } {
  const saved: unknown[] = []
  const makeMutator = <T extends { id: string }>() => ({
    save: vi.fn(async (item: T) => { saved.push(item); return item }),
    remove: vi.fn(async (_id: string) => {}),
  })
  return {
    sessions: [], sessionExercises: [], sets: [], exercises: [],
    workoutTemplates: [], workoutExerciseTemplates: [], programs: [],
    personalRecords: [], goals: [], bodyMeasurements: [],
    settings: {
      id: 'singleton', updatedAt: 0, deleted: false, dirty: false,
      firstName: '', lastName: '', createdAt: 0,
      preferences: {
        weightUnit: 'kg', distanceUnit: 'km', measurementUnit: 'cm',
        defaultRestSec: 90, weightStep: 2.5,
        restSoundEnabled: true, hapticsEnabled: true,
        autoBarbellWeight: false, autoWarmup: false,
        theme: 'auto', accentColor: '#5b9dff', language: 'fr',
        weekStart: 'monday', rpeScale: '6-10', oneRMFormula: 'epley',
        notificationsEnabled: false, skipDayPreview: false,
        skipBriefing: false, prCelebrationEnabled: true,
      },
    },
    session: makeMutator<Session>(),
    sessionExercise: makeMutator<SessionExercise>(),
    set: makeMutator<SetRecord>(),
    exercise: makeMutator<Exercise>(),
    workoutTemplate: { save: vi.fn(), remove: vi.fn() },
    workoutExerciseTemplate: { save: vi.fn(), remove: vi.fn() },
    program: { save: vi.fn(), remove: vi.fn() },
    personalRecord: { save: vi.fn(), remove: vi.fn() },
    goal: { save: vi.fn(), remove: vi.fn() },
    bodyMeasurement: { save: vi.fn(), remove: vi.fn() },
    reload: vi.fn(),
    saved,
  } as unknown as StoreApi & { saved: unknown[] }
}

describe('sessionNameFromParams', () => {
  it('cardio running → "Course à pied"', () => {
    const p: CardioParams = { kind: 'cardio', sport: 'running', durationMin: 40, intensityRating: 3 }
    expect(sessionNameFromParams(p)).toBe('Course à pied')
  })
  it('cardio other → "Autre cardio"', () => {
    const p: CardioParams = { kind: 'cardio', sport: 'other', durationMin: 30, intensityRating: 2 }
    expect(sessionNameFromParams(p)).toBe('Autre cardio')
  })
  it('team_sport football → "Football"', () => {
    const p: TeamSportParams = { kind: 'team_sport', sport: 'Football', durationMin: 90, intensityRating: 4 }
    expect(sessionNameFromParams(p)).toBe('Football')
  })
  it('team_sport vide → "Sport collectif"', () => {
    const p: TeamSportParams = { kind: 'team_sport', sport: '', durationMin: 60, intensityRating: 3 }
    expect(sessionNameFromParams(p)).toBe('Sport collectif')
  })
  it('strength_free → "Musculation libre"', () => {
    const p: StrengthFreeParams = { kind: 'strength_free', durationMin: 45, muscleGroups: ['chest'], intensityRating: 3 }
    expect(sessionNameFromParams(p)).toBe('Musculation libre')
  })
  it('other avec label → label', () => {
    const p: OtherParams = { kind: 'other', label: 'Yoga', durationMin: 30, intensityRating: 2 }
    expect(sessionNameFromParams(p)).toBe('Yoga')
  })
  it('other sans label → "Activité"', () => {
    const p: OtherParams = { kind: 'other', label: '', durationMin: 20, intensityRating: 1 }
    expect(sessionNameFromParams(p)).toBe('Activité')
  })
})

describe('emojiFromParams', () => {
  it('cycling → 🚴', () => {
    const p: CardioParams = { kind: 'cardio', sport: 'cycling', durationMin: 60, intensityRating: 3 }
    expect(emojiFromParams(p)).toBe('🚴')
  })
  it('team_sport → ⚽', () => {
    const p: TeamSportParams = { kind: 'team_sport', sport: 'Tennis', durationMin: 60, intensityRating: 3 }
    expect(emojiFromParams(p)).toBe('⚽')
  })
  it('strength_free → 🏋️', () => {
    const p: StrengthFreeParams = { kind: 'strength_free', durationMin: 45, muscleGroups: [], intensityRating: 3 }
    expect(emojiFromParams(p)).toBe('🏋️')
  })
})

describe('logActivitySession', () => {
  it('crée une session cardio avec durationSec + sessionKind', async () => {
    const store = makeStore()
    const params: CardioParams = {
      kind: 'cardio', sport: 'running', durationMin: 40, intensityRating: 3,
    }
    await logActivitySession(params, store)
    const saved = store.saved[0] as Record<string, unknown>
    expect(saved['name']).toBe('Course à pied')
    expect(saved['sessionKind']).toBe('cardio')
    expect(saved['sport']).toBe('running')
    expect(saved['durationSec']).toBe(2400)
    expect(saved['intensityRating']).toBe(3)
    expect(saved['endedAt']).toBeTypeOf('number')
    expect(saved['totalSets']).toBe(0)
  })

  it('crée une session strength_free avec muscleGroups', async () => {
    const store = makeStore()
    const params: StrengthFreeParams = {
      kind: 'strength_free', durationMin: 45,
      muscleGroups: ['chest', 'triceps'], intensityRating: 4,
    }
    await logActivitySession(params, store)
    const saved = store.saved[0] as Record<string, unknown>
    expect(saved['sessionKind']).toBe('strength_free')
    expect(saved['quickLogMuscleGroups']).toEqual(['chest', 'triceps'])
    expect(saved['durationSec']).toBe(2700)
  })

  it('crée une session team_sport sans distanceKm', async () => {
    const store = makeStore()
    const params: TeamSportParams = {
      kind: 'team_sport', sport: 'Football', durationMin: 90, intensityRating: 5,
    }
    await logActivitySession(params, store)
    const saved = store.saved[0] as Record<string, unknown>
    expect(saved['sessionKind']).toBe('team_sport')
    expect(saved['distanceKm']).toBeUndefined()
  })

  it('inclut distanceKm si fourni', async () => {
    const store = makeStore()
    const params: CardioParams = {
      kind: 'cardio', sport: 'cycling', durationMin: 60,
      distanceKm: 25, intensityRating: 3,
    }
    await logActivitySession(params, store)
    const saved = store.saved[0] as Record<string, unknown>
    expect(saved['distanceKm']).toBe(25)
  })
})
