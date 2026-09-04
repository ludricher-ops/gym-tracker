// app.jsx — Gym Track mobile · main mount

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "accent": "oklch(0.88 0.20 130)"
}/*EDITMODE-END*/;

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const theme = makeTheme(t.dark, t.accent);

  // Bg of the canvas page follows dark/light so the artboards sit on a tonal bg
  useEffect(() => {
    document.body.style.background = t.dark ? '#1b1916' : '#f0eee9';
  }, [t.dark]);

  const W = 402, H = 874;

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="screens"
          title="Gym Track · mobile"
          subtitle="Direction sombre · accent lime · Space Grotesk + JetBrains Mono"
        >
          <DCArtboard id="dashboard" label="01 · Dashboard" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <DashboardScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="session" label="02 · Session active (interactive)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <SessionScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="history" label="03 · Historique" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <HistoryScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="stats" label="04 · Stats / Progression" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <StatsScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="profile-flow"
          title="Profil · flow complet"
          subtitle="6 écrans · Hub → Compte → Corps → Objectifs → Préférences → Notifications"
        >
          <DCArtboard id="profile-hub" label="P1 · Profil (hub)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ProfileScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="profile-edit" label="P2 · Compte personnel" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ProfileEditScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="profile-body" label="P3 · Corps & mesures" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <BodyScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="profile-goals" label="P4 · Objectifs & programmes" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <GoalsScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="profile-prefs" label="P5 · Préférences" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <PreferencesScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="profile-notifs" label="P6 · Notifications" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <NotificationsScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="program-flow"
          title="Créer un programme · workflow"
          subtitle="7 écrans · Bibliothèque → Méta → Structure semaine → Séance → Picker exos → Config exo → Revue"
        >
          <DCArtboard id="prog-library" label="G1 · Bibliothèque programmes" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ProgramsLibraryScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="prog-meta" label="G2 · Méta (étape 1/4)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ProgramMetaScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="prog-week" label="G3 · Structure semaine (2/4)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <WeekStructureScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="prog-session" label="G4 · Éditer une séance (3/4)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <SessionEditorScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="prog-picker" label="G5 · Picker exercices" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ExercisePickerScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="prog-exconfig" label="G6 · Config exercice" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ExerciseConfigScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="prog-review" label="G7 · Récap & activation (4/4)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ProgramReviewScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="start-flow"
          title="Choisir un programme & démarrer · workflow"
          subtitle="4 écrans · Détail programme → Activer → Aperçu séance du jour → Briefing pré-séance"
        >
          <DCArtboard id="start-detail" label="S1 · Détail du programme" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ProgramDetailScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="start-activate" label="S2 · Activer (bottom sheet)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ActivateProgramScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="start-brief" label="S3 · Aperçu séance du jour" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <TodayBriefScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="start-pre" label="S4 · Briefing pré-séance" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <PreSessionScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="session-flow"
          title="Exécuter la séance · workflow"
          subtitle="4 écrans · Vue d'ensemble in-session → Célébration PR → Séance terminée → Récap détaillé"
        >
          <DCArtboard id="sess-overview" label="T1 · Vue d'ensemble (in-session)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <InSessionOverviewScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="sess-pr" label="T2 · Célébration PR" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <PRCelebrationScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="sess-complete" label="T3 · Séance terminée" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <SessionCompleteScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="sess-recap" label="T4 · Récap détaillé" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <SessionRecapScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="exercise-create-flow"
          title="Créer un exercice perso avec média · workflow"
          subtitle="5 écrans · Mes exercices → Form → Source média → Galerie → Éditeur (crop/trim)"
        >
          <DCArtboard id="ex-library" label="E1 · Mes exercices" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <MyExercisesScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="ex-form" label="E2 · Form de création" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <CreateExerciseFormScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="ex-source" label="E3 · Source du média" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <MediaSourceSheetScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="ex-gallery" label="E4 · Galerie interne" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <GalleryPickerScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="ex-editor" label="E5 · Éditeur (crop & trim)" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <MediaEditorScreen theme={theme} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Apparence">
          <TweakToggle
            label="Thème sombre"
            value={t.dark}
            onChange={v => setT('dark', v)}
          />
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={v => setT('accent', v)}
            options={[
              'oklch(0.88 0.20 130)', // lime
              'oklch(0.74 0.19 48)',  // orange
              'oklch(0.74 0.17 245)', // blue
              'oklch(0.74 0.20 8)',   // pink
              'oklch(0.78 0.16 75)',  // amber
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
