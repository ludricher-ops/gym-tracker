// Logique métier du tableau de bord — fonctions pures extraites de DashboardScreen.
// Testables indépendamment, sans dépendance React.

import type { Session, WorkoutTemplate, Program } from '../types'
import type { ScheduledSession } from './programSchedule'
import { localDayKey } from './dates'

/** Minutes estimées par série (échauffement inclus, pauses comprises). */
export const EST_MIN_PER_SET = 3.5

// ── Cellules de progression ───────────────────────────────────────────────────

export interface ProgressCell {
  label: string
  workoutName: string
  date: Date
  workoutTemplateId: string
  done: boolean
  ignored: boolean
}

/**
 * Pour chaque séance planifiée, détermine si elle a été faite ou ignorée.
 *
 * Une séance est considérée "faite" si :
 * - une Session porte le même programSessionLabel, ou
 * - une Session a le même workoutTemplateId ET a été commencée le même jour calendaire.
 *
 * Une séance est "ignorée" si elle est passée (avant aujourd'hui) et antérieure
 * au seuil `catchupIgnoredBefore` du programme actif.
 */
export function computeProgressCells(
  schedule: ScheduledSession[],
  programSessions: Session[],
  startOfToday: number,
  ignoredBefore: number,
): ProgressCell[] {
  return schedule.map((s) => {
    const done =
      programSessions.some((cs) => cs.programSessionLabel === s.label) ||
      programSessions.some(
        (cs) =>
          cs.workoutTemplateId === s.workoutTemplateId &&
          localDayKey(cs.startedAt) === localDayKey(s.date),
      )
    const ignored =
      !done &&
      s.date.getTime() < startOfToday &&
      ignoredBefore > 0 &&
      s.date.getTime() < ignoredBefore
    return {
      label: s.label,
      workoutName: s.workoutName,
      date: s.date,
      workoutTemplateId: s.workoutTemplateId,
      done,
      ignored,
    }
  })
}

/**
 * Groupe les cellules par semaine (clé = préfixe avant le '.', ex. "S1" pour "S1.01").
 */
export function groupProgressByWeek(
  cells: ProgressCell[],
): [string, ProgressCell[]][] {
  const map = new Map<string, ProgressCell[]>()
  for (const cell of cells) {
    const week = cell.label.split('.')[0] ?? cell.label
    const arr = map.get(week) ?? []
    arr.push(cell)
    map.set(week, arr)
  }
  return [...map.entries()]
}

// ── Groupes de séances ────────────────────────────────────────────────────────

export interface SeanceGroup {
  programId: string
  label: string
  isTemplate: boolean
  isActive: boolean
  isLibre: boolean
  workouts: WorkoutTemplate[]
}

/**
 * Groupe les séances (WorkoutTemplate) par programme et les trie :
 * Libre → actif → templates → autres (alphabétique dans chaque catégorie).
 */
export function computeSeanceGroups(
  workouts: WorkoutTemplate[],
  programs: Program[],
  typeFilter: string,
): SeanceGroup[] {
  const visible =
    typeFilter === 'all'
      ? workouts
      : workouts.filter((w) => w.type === typeFilter)

  const byProg = new Map<string, WorkoutTemplate[]>()
  for (const wt of visible) {
    const arr = byProg.get(wt.programId) ?? []
    arr.push(wt)
    byProg.set(wt.programId, arr)
  }

  const groups: SeanceGroup[] = []
  for (const [progId, wts] of byProg) {
    const prog = programs.find((p) => p.id === progId)
    if (!prog) continue
    const isLibre = prog.name === '__libre__'
    groups.push({
      programId: progId,
      label: isLibre ? 'Mes séances' : prog.name,
      isTemplate: prog.isTemplate,
      isActive: prog.isActive,
      isLibre,
      workouts: wts,
    })
  }

  groups.sort((a, b) => {
    if (a.isLibre !== b.isLibre) return a.isLibre ? -1 : 1
    if (a.isTemplate !== b.isTemplate) return a.isTemplate ? 1 : -1
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
    return a.label.localeCompare(b.label, 'fr')
  })

  return groups
}
