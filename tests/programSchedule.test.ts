import { describe, it, expect } from 'vitest'
import { generateSchedule, scheduleCard } from '../src/utils/programSchedule'
import type { Program, Session, WorkoutTemplate } from '../src/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Timestamp en heure locale à minuit. */
function d(yyyy: number, mm: number, dd: number): number {
  return new Date(yyyy, mm - 1, dd).getTime()
}

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'p1', updatedAt: 0, deleted: false, dirty: false,
    name: 'Test', goal: 'strength', level: 'intermediate',
    durationWeeks: 2, sessionsPerWeek: 3, color: '#000',
    isTemplate: false, isActive: true,
    startedAt: d(2025, 1, 6), // lundi 6 janvier 2025
    weekTemplate: { monday: 'wt1', wednesday: 'wt2' },
    createdAt: 0,
    ...overrides,
  }
}

function makeWT(id: string, name: string): WorkoutTemplate {
  return { id, updatedAt: 0, deleted: false, dirty: false, programId: 'p1', name, type: 'upper', muscleGroups: [] }
}

function makeSession(overrides: Partial<Session>): Session {
  return {
    id: 's1', updatedAt: 0, deleted: false, dirty: false,
    name: 'Séance', startedAt: 0, totalSets: 0, completedSets: 0,
    ...overrides,
  }
}

const WTS = [makeWT('wt1', 'Upper 1'), makeWT('wt2', 'Upper 2')]

// ── generateSchedule ─────────────────────────────────────────────────────────

describe('generateSchedule', () => {
  it('retourne [] si startedAt absent', () => {
    const p = makeProgram({ startedAt: undefined })
    expect(generateSchedule(p, WTS)).toEqual([])
  })

  it('génère les bonnes dates pour lundi + mercredi sur 2 semaines', () => {
    const schedule = generateSchedule(makeProgram(), WTS)
    expect(schedule).toHaveLength(4) // 2 jours × 2 semaines
    const labels = schedule.map((s) => s.label)
    expect(labels).toContain('S1.01') // lundi sem 1
    expect(labels).toContain('S1.03') // mercredi sem 1
    expect(labels).toContain('S2.01') // lundi sem 2
    expect(labels).toContain('S2.03') // mercredi sem 2
  })

  it('trie les séances par date croissante', () => {
    const schedule = generateSchedule(makeProgram(), WTS)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]!.date.getTime()).toBeGreaterThanOrEqual(
        schedule[i - 1]!.date.getTime(),
      )
    }
  })

  it('exclut les séances antérieures à startedAt', () => {
    // Programme démarrant un mercredi : le lundi précédent ne doit pas apparaître
    const p = makeProgram({ startedAt: d(2025, 1, 8) }) // mercredi
    const schedule = generateSchedule(p, WTS)
    const labels = schedule.map((s) => s.label)
    // S1.01 (lundi 6 janv) est avant le startedAt du mercredi 8 — exclu
    expect(labels).not.toContain('S1.01')
    expect(labels).toContain('S1.03')
  })

  it('retourne [] si aucun workoutTemplate ne correspond', () => {
    const p = makeProgram({ weekTemplate: { friday: 'wt-inexistant' } })
    expect(generateSchedule(p, WTS)).toEqual([])
  })

  it('ignore les jours sans workoutTemplateId (undefined)', () => {
    const p = makeProgram({ weekTemplate: { monday: 'wt1', tuesday: undefined } })
    const schedule = generateSchedule(p, WTS)
    const days = schedule.map((s) => s.label)
    // Seuls les lundis (S?.01) sont présents
    days.forEach((l) => expect(l).toMatch(/S\d+\.01/))
  })
})

// ── scheduleCard ──────────────────────────────────────────────────────────────

describe('scheduleCard', () => {
  const schedule = generateSchedule(makeProgram(), WTS)
  // schedule : S1.01 (lundi 6/1), S1.03 (mercredi 8/1), S2.01 (lundi 13/1), S2.03 (mercredi 15/1)

  // Lundi 6/1/2025 09:00
  const mondayAm = d(2025, 1, 6) + 9 * 3600_000

  it('type scheduled quand séance prévue non faite', () => {
    const card = scheduleCard(schedule, [], mondayAm)
    expect(card.type).toBe('scheduled')
    expect(card.todaySession?.label).toBe('S1.01')
    expect(card.missedSessions).toHaveLength(0) // aucune séance manquée
  })

  it('type done_today quand séance du jour déjà faite', () => {
    const sess = makeSession({
      id: 's1', programSessionLabel: 'S1.01', endedAt: mondayAm + 3600_000,
      startedAt: mondayAm,
    })
    const card = scheduleCard(schedule, [sess], mondayAm)
    expect(card.type).toBe('done_today')
    expect(card.todaySession?.label).toBe('S1.01')
  })

  it('done_today expose missedSessions si séances manquées', () => {
    // Lundi semaine 2 : S1.01 et S1.03 sont manquées, S2.01 prévu aujourd'hui
    const now = d(2025, 1, 13) + 9 * 3600_000 // lundi 13/1
    const sess = makeSession({
      id: 's1', programSessionLabel: 'S2.01', endedAt: now + 3600_000, startedAt: now,
    })
    const card = scheduleCard(schedule, [sess], now)
    expect(card.type).toBe('done_today')
    // La plus ancienne manquée = S1.01
    expect(card.missedSessions[0]?.label).toBe('S1.01')
    expect(card.missedSessions).toHaveLength(2)
  })

  it('type missed quand jour de repos avec séances manquées — expose toutes', () => {
    // Jeudi 9/1 : S1.01 (lundi) et S1.03 (mercredi) sont manquées
    const now = d(2025, 1, 9) + 9 * 3600_000
    const card = scheduleCard(schedule, [], now)
    expect(card.type).toBe('missed')
    expect(card.missedSessions[0]?.label).toBe('S1.01') // la plus ancienne, pas S1.03
    expect(card.missedSessions).toHaveLength(2)
  })

  it('ne compte plus une séance comme manquée après rattrapage (label)', () => {
    const now = d(2025, 1, 9) + 9 * 3600_000 // jeudi
    const catchup = makeSession({
      id: 's1', programSessionLabel: 'S1.01',
      endedAt: now - 3600_000, startedAt: now - 3600_000,
    })
    const card = scheduleCard(schedule, [catchup], now)
    // S1.01 rattrapée, S1.03 reste manquée
    expect(card.type).toBe('missed')
    expect(card.missedSessions[0]?.label).toBe('S1.03')
    expect(card.missedSessions).toHaveLength(1)
  })

  it('type early quand repos et aucune séance manquée', () => {
    // Mardi 7/1 après avoir fait S1.01
    const now = d(2025, 1, 7) + 9 * 3600_000
    const sess = makeSession({
      id: 's1', programSessionLabel: 'S1.01',
      startedAt: d(2025, 1, 6) + 9 * 3600_000,
      endedAt: d(2025, 1, 6) + 10 * 3600_000,
    })
    const card = scheduleCard(schedule, [sess], now)
    expect(card.type).toBe('early')
    expect(card.nextSession?.label).toBe('S1.03')
  })

  it('type done_early quand séance future faite le même jour', () => {
    // Mardi 7/1 : aucun planning, mais on a fait S1.03 (mercredi) aujourd'hui en avance
    const now = d(2025, 1, 7) + 9 * 3600_000
    const s101 = makeSession({
      id: 's1', programSessionLabel: 'S1.01',
      startedAt: d(2025, 1, 6) + 9 * 3600_000,
      endedAt: d(2025, 1, 6) + 10 * 3600_000,
    })
    const s103early = makeSession({
      id: 's2', programSessionLabel: 'S1.03',
      startedAt: now, endedAt: now + 3600_000,
    })
    const card = scheduleCard(schedule, [s101, s103early], now)
    expect(card.type).toBe('done_early')
    expect(card.todaySession?.label).toBe('S1.03')
  })

  it('type rest_done quand toutes les séances sont faites', () => {
    const completedSessions: Session[] = [
      makeSession({ id: 's1', programSessionLabel: 'S1.01', startedAt: d(2025, 1, 6), endedAt: d(2025, 1, 6) + 1 }),
      makeSession({ id: 's2', programSessionLabel: 'S1.03', startedAt: d(2025, 1, 8), endedAt: d(2025, 1, 8) + 1 }),
      makeSession({ id: 's3', programSessionLabel: 'S2.01', startedAt: d(2025, 1, 13), endedAt: d(2025, 1, 13) + 1 }),
      makeSession({ id: 's4', programSessionLabel: 'S2.03', startedAt: d(2025, 1, 15), endedAt: d(2025, 1, 15) + 1 }),
    ]
    // Après la fin du programme
    const now = d(2025, 1, 20) + 9 * 3600_000
    const card = scheduleCard(schedule, completedSessions, now)
    expect(card.type).toBe('rest_done')
  })

  it('scheduled expose missedSessions si des séances précédentes sont manquées', () => {
    // Lundi 13/1 : S1.01 et S1.03 manquées, S2.01 prévu aujourd'hui
    const now = d(2025, 1, 13) + 9 * 3600_000
    const card = scheduleCard(schedule, [], now)
    expect(card.type).toBe('scheduled')
    expect(card.todaySession?.label).toBe('S2.01')
    expect(card.missedSessions[0]?.label).toBe('S1.01') // plus ancienne manquée
    expect(card.missedSessions).toHaveLength(2)
  })
})
