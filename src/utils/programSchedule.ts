import type { Program, Session, WorkoutTemplate } from '../types'
import { addDays, localDayKey, startOfLocalDay } from './dates'

export interface ScheduledSession {
  date: Date
  label: string
  workoutTemplateId: string
  workoutName: string
}

const WEEKDAY_IDX: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
}

const WEEKDAY_NUM: Record<string, string> = {
  monday: '01', tuesday: '02', wednesday: '03', thursday: '04',
  friday: '05', saturday: '06', sunday: '07',
}

/**
 * Génère le calendrier complet des séances d'un programme actif.
 * La semaine 1 est la semaine calendaire contenant startedAt (lundi→dimanche).
 * Les séances dont la date est antérieure à startedAt sont exclues.
 * Label : S{numSemaine}.{numJourSemaine} — ex. S1.01=lundi sem.1, S1.05=vendredi.
 */
export function generateSchedule(
  program: Program,
  workoutTemplates: WorkoutTemplate[],
): ScheduledSession[] {
  if (!program.startedAt) return []

  const startMs = startOfLocalDay(program.startedAt).getTime()
  const startDate = new Date(startMs)
  const dow = startDate.getDay() // 0=dim, 1=lun … 6=sam
  const toMonday = dow === 0 ? -6 : 1 - dow
  const week1Monday = addDays(startDate, toMonday)

  const sessions: ScheduledSession[] = []

  for (let weekIdx = 0; weekIdx < program.durationWeeks; weekIdx++) {
    for (const [day, wtId] of Object.entries(program.weekTemplate)) {
      if (!wtId) continue
      const wt = workoutTemplates.find((w) => w.id === wtId)
      if (!wt) continue
      const dayOffset = WEEKDAY_IDX[day]
      if (dayOffset === undefined) continue

      const sessionDate = addDays(week1Monday, weekIdx * 7 + dayOffset)
      if (sessionDate.getTime() < startMs) continue

      sessions.push({
        date: sessionDate,
        label: `S${weekIdx + 1}.${WEEKDAY_NUM[day]}`,
        workoutTemplateId: wtId,
        workoutName: wt.name,
      })
    }
  }

  return sessions.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Cherche une séance terminée correspondant au créneau planifié. */
function findCompleted(
  scheduled: ScheduledSession,
  completedSessions: Session[],
): Session | undefined {
  const byLabel = completedSessions.find(
    (s) => s.programSessionLabel === scheduled.label && s.endedAt != null,
  )
  if (byLabel) return byLabel
  // Fallback pour les séances antérieures à l'introduction des labels.
  const dayKey = localDayKey(scheduled.date)
  return completedSessions.find(
    (s) =>
      s.workoutTemplateId === scheduled.workoutTemplateId &&
      localDayKey(s.startedAt) === dayKey &&
      s.endedAt != null,
  )
}

export type ScheduleCardType = 'scheduled' | 'done_today' | 'done_early' | 'missed' | 'early' | 'rest_done'

export interface ScheduleCard {
  type: ScheduleCardType
  /** Séance prévue aujourd'hui (types scheduled et done_today). */
  todaySession?: ScheduledSession
  /** Séance manquée la plus ancienne (types missed, scheduled et done_today avec rattrapage). */
  missedSession?: ScheduledSession
  /** Prochaine séance à venir (type early). */
  nextSession?: ScheduledSession
  /** Record de la séance réalisée aujourd'hui (type done_today). */
  completedSession?: Session
}

/**
 * Calcule l'état de la carte du dashboard à partir du planning et de
 * l'historique des séances terminées.
 */
export function scheduleCard(
  schedule: ScheduledSession[],
  completedSessions: Session[],
  now: number,
): ScheduleCard {
  const todayKey = localDayKey(now)
  const todayStart = startOfLocalDay(now).getTime()

  const todayScheduled = schedule.find((s) => localDayKey(s.date) === todayKey)

  const missed = schedule.filter(
    (s) => s.date.getTime() < todayStart && !findCompleted(s, completedSessions),
  )
  const oldestMissed = missed.length > 0 ? missed[0] : undefined

  if (todayScheduled) {
    const completedSession = findCompleted(todayScheduled, completedSessions)
    if (completedSession) {
      return { type: 'done_today', todaySession: todayScheduled, completedSession, missedSession: oldestMissed }
    }
    return { type: 'scheduled', todaySession: todayScheduled, missedSession: oldestMissed }
  }

  // Jour de repos ou après la fin du programme.
  if (oldestMissed) {
    return { type: 'missed', missedSession: oldestMissed }
  }

  // Parcourt les séances futures dans l'ordre :
  // - faite aujourd'hui (en avance) → récap
  // - faite un autre jour → passer à la suivante
  // - pas faite → proposer de commencer en avance
  for (const s of schedule.filter((s) => s.date.getTime() >= todayStart + 86_400_000)) {
    const completed = findCompleted(s, completedSessions)
    if (completed && localDayKey(completed.startedAt) === todayKey) {
      return { type: 'done_early', todaySession: s, completedSession: completed }
    }
    if (!completed) {
      return { type: 'early', nextSession: s }
    }
    // Faite un jour précédent → passer à la suivante
  }

  return { type: 'rest_done' }
}
