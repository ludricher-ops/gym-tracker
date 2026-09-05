import type { ScreenName } from './navigation'
import { DashboardScreen } from '../components/screens/DashboardScreen'
import { HistoryScreen } from '../components/screens/HistoryScreen'
import { StatsScreen } from '../components/screens/StatsScreen'
import { ProfileScreen } from '../components/screens/ProfileScreen'
import { MyExercisesScreen } from '../components/screens/MyExercisesScreen'
import { ExerciseFormScreen } from '../components/screens/ExerciseFormScreen'
import { ProgramsLibraryScreen } from '../components/screens/ProgramsLibraryScreen'
import { ProgramDetailScreen } from '../components/screens/ProgramDetailScreen'
import { ProgramBuilderScreen } from '../components/screens/ProgramBuilderScreen'
import { SessionRecapScreen } from '../components/screens/SessionRecapScreen'
import { AccountScreen } from '../components/screens/AccountScreen'
import { PreferencesScreen } from '../components/screens/PreferencesScreen'
import { ExerciseDetailScreen } from '../components/screens/ExerciseDetailScreen'
import { GoalsScreen } from '../components/screens/GoalsScreen'
import { BodyScreen } from '../components/screens/BodyScreen'
import { RattrapagesScreen } from '../components/screens/RattrapagesScreen'
import { ProgramGeneratorScreen } from '../components/screens/ProgramGeneratorScreen'
import { GroupScreen } from '../components/screens/GroupScreen'
import { GroupDetailScreen } from '../components/screens/GroupDetailScreen'
import { RivalsStatsScreen } from '../components/screens/RivalsStatsScreen'

/** Props reçues par tout composant d'écran. */
export interface ScreenProps {
  params?: Record<string, unknown>
}

export type ScreenComponent = (props: ScreenProps) => React.ReactNode

// Registre nom d'écran → composant. Les écrans non encore implémentés
// (jalons ultérieurs) ne figurent pas ici ; un écran de repli les gère.
export const SCREENS: Partial<Record<ScreenName, ScreenComponent>> = {
  dashboard: DashboardScreen,
  history: HistoryScreen,
  stats: StatsScreen,
  profile: ProfileScreen,
  myExercises: MyExercisesScreen,
  exerciseForm: ExerciseFormScreen,
  programsLibrary: ProgramsLibraryScreen,
  programDetail: ProgramDetailScreen,
  programBuilder: ProgramBuilderScreen,
  sessionRecap: SessionRecapScreen,
  account: AccountScreen,
  preferences: PreferencesScreen,
  exerciseDetail: ExerciseDetailScreen,
  goalsPrograms: GoalsScreen,
  body: BodyScreen,
  rattrapages: RattrapagesScreen,
  programGenerator: ProgramGeneratorScreen,
  group: GroupScreen,
  groupDetail: GroupDetailScreen,
  rivalsStats: RivalsStatsScreen,
}
