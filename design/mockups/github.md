repo: ludricher-ops/gym-tracker
branch: main

## Last sync

date: 2026-09-04T13:18:01Z

### Updated in this project

- Lu le code réel de l'app : tokens, primitives UI, jeu d'icônes, modale de séance, écrans principaux.
- « Session active — refonte UI » : comparatif Actuel / Proposé de l'écran de séance.
- « Refonte UI — écrans principaux » : Aujourd'hui, Historique, Progression + les sept règles globales.
- « Refonte UI — post-séance » : séance terminée, célébration PR, vue d'ensemble in-session, récap détaillé.

## Screen map

| Écran du projet | Fichiers du dépôt |
| --- | --- |
| Session active — refonte UI | src/components/screens/SessionModal/SessionModal.tsx, src/components/screens/SessionModal/SetTable.tsx, src/components/screens/SessionModal/RestTimerBar.tsx |
| Refonte UI — écrans principaux · Aujourd'hui | src/components/screens/DashboardScreen.tsx, src/utils/programSchedule.ts |
| Refonte UI — écrans principaux · Historique | src/components/screens/HistoryScreen.tsx, src/components/ui/Heatmap.tsx |
| Refonte UI — écrans principaux · Progression | src/components/screens/StatsScreen.tsx, src/components/ui/LineChart.tsx |
| Primitives partagées (tokens, icônes, lignes, tuiles) | src/index.css, src/theme/accents.ts, src/components/ui/ui.css, src/components/ui/Icon.tsx, src/components/ui/Row.tsx, src/components/ui/StatTile.tsx |
| Chrome (barre d'onglets, coquille) | src/components/ui/TabBar.tsx, src/nav/navigation.ts, src/App.tsx |
| Refonte UI — post-séance · Séance terminée | src/components/screens/SessionModal/SessionCompleteView.tsx |
| Refonte UI — post-séance · Célébration PR | src/components/screens/SessionModal/PRCelebrationOverlay.tsx |
| Refonte UI — post-séance · Vue d'ensemble | src/components/screens/SessionModal/SessionOverviewSheet.tsx |
| Refonte UI — post-séance · Récap détaillé | src/components/screens/SessionRecapScreen.tsx, src/utils/sessionRecap.ts |
