// Store global : charge tous les object stores IndexedDB en mémoire au
// démarrage et expose des mutateurs optimistes (IDB d'abord, état React mis
// à jour dans la foulée). Source de vérité = IndexedDB.

import {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
  type ReactNode,
} from 'react'
import { getIsAdmin } from '../db/sync'
import type {
  BodyMeasurement, Exercise, Goal, PersonalRecord, Program, Session,
  SessionExercise, Settings, SetRecord, Syncable, WorkoutExerciseTemplate,
  WorkoutTemplate,
} from '../types'
import {
  bodyMeasurementRepo, exerciseRepo, goalRepo, personalRecordRepo, programRepo,
  sessionExerciseRepo, sessionRepo, setRepo, settingsRepo,
  workoutExerciseTemplateRepo, workoutTemplateRepo, type NewRecord, type Repo,
} from '../db/repo'
import { ensureSeed } from '../db/seed'

interface Collections {
  exercises: Exercise[]
  programs: Program[]
  workoutTemplates: WorkoutTemplate[]
  workoutExerciseTemplates: WorkoutExerciseTemplate[]
  sessions: Session[]
  sessionExercises: SessionExercise[]
  sets: SetRecord[]
  personalRecords: PersonalRecord[]
  goals: Goal[]
  bodyMeasurements: BodyMeasurement[]
}

interface EntityActions<T extends Syncable> {
  save: (record: NewRecord<T> | T) => Promise<T>
  remove: (id: string) => Promise<void>
}

export interface StoreApi extends Collections {
  ready: boolean
  /** true si l'utilisateur courant est l'administrateur (user_id=1). */
  isAdmin: boolean
  settings: Settings
  saveSettings: (next: Settings) => Promise<void>
  exercise: EntityActions<Exercise>
  program: EntityActions<Program>
  workoutTemplate: EntityActions<WorkoutTemplate>
  workoutExerciseTemplate: EntityActions<WorkoutExerciseTemplate>
  session: EntityActions<Session>
  sessionExercise: EntityActions<SessionExercise>
  set: EntityActions<SetRecord>
  personalRecord: EntityActions<PersonalRecord>
  goal: EntityActions<Goal>
  bodyMeasurement: EntityActions<BodyMeasurement>
  /** Recharge tout depuis IndexedDB (utilisé après une synchro pull). */
  reload: () => Promise<void>
}

const StoreContext = createContext<StoreApi | null>(null)

const EMPTY: Collections = {
  exercises: [], programs: [], workoutTemplates: [], workoutExerciseTemplates: [],
  sessions: [], sessionExercises: [], sets: [], personalRecords: [], goals: [],
  bodyMeasurements: [],
}

function upsert<T extends Syncable>(list: T[], rec: T): T[] {
  const i = list.findIndex((x) => x.id === rec.id)
  if (i === -1) return [...list, rec]
  const copy = list.slice()
  copy[i] = rec
  return copy
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cols, setCols] = useState<Collections>(EMPTY)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => getIsAdmin())

  const loadAll = useCallback(async () => {
    const [
      exercises, programs, workoutTemplates, workoutExerciseTemplates,
      sessions, sessionExercises, sets, personalRecords, goals,
      bodyMeasurements, settingsRow,
    ] = await Promise.all([
      exerciseRepo.all(), programRepo.all(), workoutTemplateRepo.all(),
      workoutExerciseTemplateRepo.all(), sessionRepo.all(),
      sessionExerciseRepo.all(), setRepo.all(), personalRecordRepo.all(),
      goalRepo.all(), bodyMeasurementRepo.all(), settingsRepo.get('singleton'),
    ])
    setCols({
      exercises, programs, workoutTemplates, workoutExerciseTemplates,
      sessions, sessionExercises, sets, personalRecords, goals,
      bodyMeasurements,
    })
    if (settingsRow) setSettings(settingsRow)
    // Met à jour le flag admin depuis la valeur la plus récente (post-pull)
    setIsAdmin(getIsAdmin())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureSeed()
      await loadAll()
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [loadAll])

  // Fabrique les paires save/remove typées pour une collection donnée.
  const actions = useMemo(() => {
    function make<K extends keyof Collections>(
      key: K,
      repo: Repo<Collections[K][number]>,
    ): EntityActions<Collections[K][number]> {
      type T = Collections[K][number]
      return {
        save: async (record) => {
          const saved = (await repo.save(record)) as T
          setCols((c) => ({ ...c, [key]: upsert(c[key] as T[], saved) }))
          return saved
        },
        remove: async (id) => {
          await repo.remove(id)
          setCols((c) => ({
            ...c,
            [key]: (c[key] as T[]).filter((x) => x.id !== id),
          }))
        },
      }
    }
    return {
      exercise: make('exercises', exerciseRepo),
      program: make('programs', programRepo),
      workoutTemplate: make('workoutTemplates', workoutTemplateRepo),
      workoutExerciseTemplate: make('workoutExerciseTemplates', workoutExerciseTemplateRepo),
      session: make('sessions', sessionRepo),
      sessionExercise: make('sessionExercises', sessionExerciseRepo),
      set: make('sets', setRepo),
      personalRecord: make('personalRecords', personalRecordRepo),
      goal: make('goals', goalRepo),
      bodyMeasurement: make('bodyMeasurements', bodyMeasurementRepo),
    }
  }, [])

  const saveSettings = useMemo(
    () => async (next: Settings) => {
      const saved = await settingsRepo.save(next)
      setSettings(saved)
    },
    [],
  )

  const api = useMemo<StoreApi | null>(() => {
    if (!ready || !settings) return null
    return {
      ready: true,
      isAdmin,
      settings,
      saveSettings,
      reload: loadAll,
      ...cols,
      ...actions,
    }
  }, [ready, isAdmin, settings, saveSettings, loadAll, cols, actions])

  if (!api) {
    return (
      <div className="gt-screen">
        <div className="gt-screen__scroll">
          <p className="t-caption">Chargement…</p>
        </div>
      </div>
    )
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore hors de StoreProvider')
  return ctx
}
