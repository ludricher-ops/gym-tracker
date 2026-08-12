// Opérations sur les programmes : clonage et activation. Partagées entre le
// créateur de programme (étape 4) et l'Activation Sheet.

import type { Program, WorkoutExerciseTemplate, WorkoutTemplate } from '../types'
import type { StoreApi } from '../hooks/useStore'
import { uuid } from './uuid'

/**
 * Clone un programme (et ses séances + exercices) en nouveaux enregistrements
 * appartenant à l'utilisateur (`isTemplate: false`). Renvoie le clone.
 */
export async function cloneProgram(source: Program, store: StoreApi): Promise<Program> {
  const now = Date.now()
  const newProgramId = uuid()
  const sourceWTs = store.workoutTemplates.filter((w) => w.programId === source.id)

  // Ancien id de séance → nouvel id (pour recâbler le planning hebdo).
  const wtIdMap = new Map<string, string>()

  for (const wt of sourceWTs) {
    const newWtId = uuid()
    wtIdMap.set(wt.id, newWtId)
    const clonedWt: Omit<WorkoutTemplate, 'updatedAt' | 'deleted' | 'dirty'> = {
      id: newWtId,
      programId: newProgramId,
      name: wt.name,
      type: wt.type,
      muscleGroups: wt.muscleGroups,
    }
    await store.workoutTemplate.save(clonedWt)

    const wets = store.workoutExerciseTemplates.filter((e) => e.workoutTemplateId === wt.id)
    for (const wet of wets) {
      const clonedWet: Omit<WorkoutExerciseTemplate, 'updatedAt' | 'deleted' | 'dirty'> = {
        ...wet,
        id: uuid(),
        workoutTemplateId: newWtId,
      }
      await store.workoutExerciseTemplate.save(clonedWet)
    }
  }

  const weekTemplate: Program['weekTemplate'] = {}
  for (const [day, wtId] of Object.entries(source.weekTemplate)) {
    const mapped = wtId ? wtIdMap.get(wtId) : undefined
    if (mapped) weekTemplate[day as keyof Program['weekTemplate']] = mapped
  }

  return store.program.save({
    id: newProgramId,
    name: source.name,
    goal: source.goal,
    level: source.level,
    durationWeeks: source.durationWeeks,
    sessionsPerWeek: source.sessionsPerWeek,
    color: source.color,
    isTemplate: false,
    isActive: false,
    weekTemplate,
    createdAt: now,
  })
}

/**
 * Supprime un programme et, en cascade, ses séances et exercices de séance.
 * Les séances déjà réalisées (historique) ne sont pas touchées.
 */
export async function deleteProgram(program: Program, store: StoreApi): Promise<void> {
  const workoutTemplates = store.workoutTemplates.filter((w) => w.programId === program.id)
  for (const wt of workoutTemplates) {
    const wets = store.workoutExerciseTemplates.filter((e) => e.workoutTemplateId === wt.id)
    for (const wet of wets) await store.workoutExerciseTemplate.remove(wet.id)
    await store.workoutTemplate.remove(wt.id)
  }
  await store.program.remove(program.id)
}

/**
 * Désactive le programme actif sans en activer un autre.
 */
export async function deactivateProgram(program: Program, store: StoreApi): Promise<void> {
  await store.program.save({ ...program, isActive: false, archivedAt: Date.now() })
}

/**
 * Active un programme : archive le programme actif précédent, clone la cible
 * si c'est un template, puis marque le programme comme actif à la date donnée.
 * Renvoie le programme désormais actif.
 */
export async function activateProgram(
  target: Program,
  startedAt: number,
  store: StoreApi,
): Promise<Program> {
  for (const p of store.programs) {
    if (p.isActive && p.id !== target.id) {
      await store.program.save({ ...p, isActive: false, archivedAt: Date.now() })
    }
  }

  const program = target.isTemplate ? await cloneProgram(target, store) : target

  return store.program.save({
    ...program,
    isActive: true,
    startedAt,
    archivedAt: undefined,
  })
}
