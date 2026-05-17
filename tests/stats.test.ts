import { describe, it, expect } from 'vitest'
import {
  statsForWeek, statsForPreviousWeek, weekDeltas, tonnage, type StatSession,
} from '../src/utils/stats'

// Semaine de référence : 2026-05-17 (dimanche). Semaine lundi 11 → lundi 18.
const REF = new Date(2026, 4, 17)

const session = (date: Date, vol: number, dur: number, ended = true): StatSession => ({
  startedAt: date.getTime(),
  endedAt: ended ? date.getTime() + dur * 1000 : undefined,
  totalVolumeKg: vol,
  durationSec: dur,
})

describe('statsForWeek', () => {
  it('semaine vide → zéros', () => {
    expect(statsForWeek([], REF)).toEqual({ sessions: 0, volumeKg: 0, timeSec: 0 })
  })

  it('agrège les séances terminées de la semaine', () => {
    const sessions = [
      session(new Date(2026, 4, 11), 5000, 3600),
      session(new Date(2026, 4, 14), 4000, 3000),
    ]
    expect(statsForWeek(sessions, REF)).toEqual({
      sessions: 2,
      volumeKg: 9000,
      timeSec: 6600,
    })
  })

  it('exclut les séances non terminées', () => {
    const sessions = [session(new Date(2026, 4, 14), 4000, 3000, false)]
    expect(statsForWeek(sessions, REF).sessions).toBe(0)
  })

  it('exclut les séances hors de la semaine', () => {
    const sessions = [session(new Date(2026, 4, 4), 9999, 9999)]
    expect(statsForWeek(sessions, REF).sessions).toBe(0)
  })
})

describe('statsForPreviousWeek', () => {
  it('cible la semaine précédente', () => {
    const sessions = [session(new Date(2026, 4, 6), 3000, 2000)]
    expect(statsForPreviousWeek(sessions, REF).sessions).toBe(1)
  })
})

describe('weekDeltas', () => {
  it('calcule les variations signées', () => {
    const d = weekDeltas(
      { sessions: 4, volumeKg: 12000, timeSec: 7200 },
      { sessions: 3, volumeKg: 14000, timeSec: 7200 },
    )
    expect(d.sessions).toBe(1)
    expect(d.volumeKg).toBe(-2000)
    expect(d.timeSec).toBe(0)
  })
})

describe('tonnage', () => {
  it('somme poids × reps en excluant l’échauffement', () => {
    const sets = [
      { weightKg: 100, reps: 5, isWarmup: false },
      { weightKg: 100, reps: 5, isWarmup: false },
      { weightKg: 40, reps: 10, isWarmup: true },
    ]
    expect(tonnage(sets)).toBe(1000)
  })
})
