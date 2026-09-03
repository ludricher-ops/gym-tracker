/**
 * Programme 10 Semaines — Low Impact Calisthenics + Vélo
 * ========================================================
 * Coller dans la console du navigateur sur l'app gym-tracker.
 * Crée 4 programmes templates (phases) × 7 séances/semaine.
 *
 * Phase 1 — Adaptation    (sem 1-2)  : 2 séries, intensité modérée
 * Phase 2 — Progression   (sem 3-5)  : 3 séries, volume croissant
 * Phase 3 — Intensification (sem 6-8): 3-4 séries, supersets, intervalles
 * Phase 4 — Consolidation (sem 9-10) : 4 séries, full body intégré
 *
 * Contraintes respectées : pas de sauts, pas de course, pas de burpees.
 * Genoux / cheville : squats contrôlés, alternatives proposées.
 */
(async () => {
  const DB_NAME = 'gymtrack';
  const now = Date.now();
  const uid = () => crypto.randomUUID();

  // ── Ouvrir l'IDB ─────────────────────────────────────────────────────────────
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

  // Écriture atomique store + outbox
  const save = (storeName, record) =>
    new Promise((res, rej) => {
      const tx = db.transaction([storeName, 'outbox'], 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.objectStore('outbox').add({ store: storeName, id: record.id, updatedAt: record.updatedAt });
      tx.oncomplete = () => res(record);
      tx.onerror = () => rej(tx.error);
    });

  const syncable = () => ({ deleted: false, dirty: true, updatedAt: now });

  // ── IDs des exercices de la bibliothèque seed ─────────────────────────────────
  const E = {
    // Cardio
    velo:         'seed-cycling',
    // Haut du corps
    pushup:       'seed-pushup',
    pikePushup:   'bw-pike-pushup',
    invertedRow:  'bw-inverted-row',
    superman:     'seed-superman',
    tricepsDips:  'seed-triceps-dips',
    // Core
    plank:        'seed-plank',
    sidePlank:    'seed-side-plank',
    deadBug:      'seed-dead-bug',
    birdDog:      'seed-bird-dog',
    hollowBody:   'bw-hollow-body',
    crunch:       'seed-crunch',
    bicycleCrunch:'seed-bicycle-crunch',
    legRaise:     'seed-leg-raise',
    heelTouch:    'seed-heel-touch',
    scissors:     'seed-scissors',
    russianTwist: 'seed-russian-twist',
    // Bas du corps (low impact)
    gluteBridge:  'seed-glute-bridge',
    hipThrustBW:  'seed-hip-thrust-bw',
    donkeyKick:   'seed-donkey-kick',
    fireHydrant:  'seed-fire-hydrant',
    squatBW:      'seed-bodyweight-squat',
    goodMorningBW:'seed-good-morning-bw',
    // Mobilité / échauffement
    catCow:          'seed-cat-cow',
    shoulderCircles: 'seed-shoulder-circles',
    legSwings:       'seed-leg-swings',
    hip9090:         'seed-hip-9090',
    inchworm:        'seed-inchworm',
    thoracicRotation:'seed-thoracic-rotation',
  };

  // ── Helpers d'ajout d'exercice ────────────────────────────────────────────────
  let _order = 0;
  const resetOrder = () => { _order = 0; };

  const addEx = (wtId, exId, opts) =>
    save('workoutExerciseTemplates', {
      id: uid(), workoutTemplateId: wtId, exerciseId: exId,
      order: _order++, repsMode: 'fixed',
      autoProgress: false, progressStepKg: 0, targetRepsMin: 0,
      ...syncable(), ...opts,
    });

  // Échauffement / retour au calme
  const wu = (wtId, exId, reps, opts = {}) =>
    addEx(wtId, exId, { targetSets: 1, targetRepsMin: reps, restSec: 0, isWarmup: true, ...opts });

  // Exercice reps
  const ex = (wtId, exId, sets, reps, rest, opts = {}) =>
    addEx(wtId, exId, { targetSets: sets, targetRepsMin: reps, restSec: rest, ...opts });

  // Exercice durée (planche, hollow body, vélo…)
  const exT = (wtId, exId, sets, sec, rest, opts = {}) =>
    addEx(wtId, exId, { targetSets: sets, targetRepsMin: 1, targetDurationSec: sec, restSec: rest, ...opts });

  // Exercice abdo avec reps
  const ab = (wtId, exId, sets, reps, rest, opts = {}) =>
    addEx(wtId, exId, { targetSets: sets, targetRepsMin: reps, restSec: rest, isAb: true, ...opts });

  // Exercice abdo durée
  const abT = (wtId, exId, sets, sec, rest, opts = {}) =>
    addEx(wtId, exId, { targetSets: sets, targetRepsMin: 1, targetDurationSec: sec, restSec: rest, isAb: true, ...opts });

  // ── Création d'un workout template ──────────────────────────────────────────
  const makeWT = async (programId, day, name, icon, type, muscles) => {
    const id = uid();
    await save('workoutTemplates', { id, programId, name, icon, type, muscleGroups: muscles, ...syncable() });
    console.log(`    ${icon} ${name}`);
    return id;
  };

  // ── Création d'un programme (template) ───────────────────────────────────────
  const makeProgram = async (name, icon, color, weeks, weekTemplate) => {
    const id = uid();
    await save('programs', {
      id, name, goal: 'weight_loss', level: 'beginner',
      durationWeeks: weeks, sessionsPerWeek: 7,
      color, isTemplate: true, isActive: false,
      weekTemplate, createdAt: now, ...syncable(),
    });
    return id;
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 1 — ADAPTATION  (semaines 1-2)
  // 2 séries · repos 60s · mouvements de base · prise d'habitude
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n🌱 Phase 1 — Adaptation...');
  const p1id = uid();
  const wt1 = {};

  // Lundi — Full Body
  resetOrder();
  wt1.monday = await makeWT(p1id, 'monday', 'Full Body — Adaptation', '💪', 'fullbody',
    ['chest', 'back', 'core', 'glutes', 'quads']);
  wu(wt1.monday, E.shoulderCircles, 10);
  wu(wt1.monday, E.catCow, 10);
  wu(wt1.monday, E.legSwings, 10);
  await ex(wt1.monday, E.pushup,      2, 8,  60);
  await ex(wt1.monday, E.squatBW,     2, 12, 60);
  await ex(wt1.monday, E.gluteBridge, 2, 12, 60);
  await ab(wt1.monday, E.deadBug,     2, 8,  60);
  await ex(wt1.monday, E.superman,    2, 10, 60);
  await abT(wt1.monday, E.plank,      2, 20, 60);
  wu(wt1.monday, E.hip9090, 2); // L + R
  await wu(wt1.monday, E.catCow, 8);

  // Mardi — Haut + Core
  resetOrder();
  wt1.tuesday = await makeWT(p1id, 'tuesday', 'Haut + Core — Adaptation', '🙌', 'upper',
    ['chest', 'shoulders', 'core', 'back']);
  wu(wt1.tuesday, E.shoulderCircles, 10);
  await wu(wt1.tuesday, E.catCow, 10);
  await ex(wt1.tuesday, E.pushup,     2, 8,  60);
  await ex(wt1.tuesday, E.pikePushup, 2, 8,  60);
  await ex(wt1.tuesday, E.superman,   2, 12, 60);
  await ab(wt1.tuesday, E.deadBug,    2, 8,  60);
  await ab(wt1.tuesday, E.crunch,     2, 15, 60);
  await abT(wt1.tuesday, E.sidePlank, 2, 20, 60);
  await wu(wt1.tuesday, E.thoracicRotation, 10);

  // Mercredi — Vélo
  resetOrder();
  wt1.wednesday = await makeWT(p1id, 'wednesday', 'Vélo — Adaptation', '🚴', 'cardio', ['cardio']);
  await wu(wt1.wednesday, E.legSwings, 10);
  await wu(wt1.wednesday, E.catCow, 10);
  await exT(wt1.wednesday, E.velo, 1, 1080, 0); // 18 min allure stable
  await wu(wt1.wednesday, E.hip9090, 2);
  await wu(wt1.wednesday, E.catCow, 8);

  // Jeudi — Bas + Stabilité
  resetOrder();
  wt1.thursday = await makeWT(p1id, 'thursday', 'Bas + Stabilité — Adaptation', '🦵', 'lower',
    ['glutes', 'hamstrings', 'quads']);
  await wu(wt1.thursday, E.legSwings, 10);
  await wu(wt1.thursday, E.hip9090, 2);
  await wu(wt1.thursday, E.catCow, 8);
  await ex(wt1.thursday, E.gluteBridge,   2, 15, 60);
  await ex(wt1.thursday, E.hipThrustBW,   2, 12, 60);
  await ex(wt1.thursday, E.donkeyKick,    2, 12, 60);
  await ex(wt1.thursday, E.fireHydrant,   2, 12, 60);
  await ex(wt1.thursday, E.squatBW,       2, 10, 60); // lent, contrôlé
  await ex(wt1.thursday, E.goodMorningBW, 2, 12, 60);
  await wu(wt1.thursday, E.hip9090, 2);

  // Vendredi — Core + Haut
  resetOrder();
  wt1.friday = await makeWT(p1id, 'friday', 'Core + Haut — Adaptation', '🏋️', 'upper',
    ['core', 'chest', 'back']);
  await wu(wt1.friday, E.shoulderCircles, 10);
  await wu(wt1.friday, E.catCow, 10);
  await ex(wt1.friday, E.pushup,       2, 8,  60);
  await ex(wt1.friday, E.invertedRow,  2, 8,  60);
  await abT(wt1.friday, E.plank,       2, 20, 60);
  await ab(wt1.friday, E.deadBug,      2, 8,  60);
  await ab(wt1.friday, E.legRaise,     2, 10, 60);
  await ab(wt1.friday, E.heelTouch,    2, 20, 60);
  await wu(wt1.friday, E.inchworm, 5);

  // Samedi — Circuit Full Body
  resetOrder();
  wt1.saturday = await makeWT(p1id, 'saturday', 'Circuit Full Body — Adaptation', '⚡', 'fullbody',
    ['chest', 'glutes', 'core', 'quads']);
  await wu(wt1.saturday, E.legSwings, 10);
  await wu(wt1.saturday, E.shoulderCircles, 10);
  // 2 tours de circuit, 30s de repos entre exercices
  await ex(wt1.saturday, E.pushup,      2, 8,  30);
  await ex(wt1.saturday, E.gluteBridge, 2, 15, 30);
  await ab(wt1.saturday, E.crunch,      2, 15, 30);
  await ex(wt1.saturday, E.donkeyKick,  2, 12, 30);
  await ab(wt1.saturday, E.deadBug,     2, 8,  30);
  await ex(wt1.saturday, E.squatBW,     2, 10, 30);
  await wu(wt1.saturday, E.catCow, 10);
  await wu(wt1.saturday, E.hip9090, 2);

  // Dimanche — Mobilité
  resetOrder();
  wt1.sunday = await makeWT(p1id, 'sunday', 'Mobilité — Adaptation', '🧘', 'mobility',
    ['core', 'back', 'glutes']);
  await wu(wt1.sunday, E.catCow, 15);
  await wu(wt1.sunday, E.thoracicRotation, 10);
  await wu(wt1.sunday, E.hip9090, 2);
  await wu(wt1.sunday, E.legSwings, 12);
  await wu(wt1.sunday, E.shoulderCircles, 15);
  await wu(wt1.sunday, E.inchworm, 5);
  await ex(wt1.sunday, E.superman,  2, 8,  45);
  await abT(wt1.sunday, E.sidePlank, 2, 20, 45);
  await exT(wt1.sunday, E.velo, 1, 600, 0); // 10 min léger
  await makeProgram('Programme 10S — Phase 1 · Adaptation', '🌱', '#10b981', 2, wt1);
  console.log('  ✅ Phase 1 créée');

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 2 — PROGRESSION  (semaines 3-5)
  // 3 séries · repos 45s · reps croissantes · nouvelles variantes
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n📈 Phase 2 — Progression...');
  const p2id = uid();
  const wt2 = {};

  resetOrder();
  wt2.monday = await makeWT(p2id, 'monday', 'Full Body — Progression', '💪', 'fullbody',
    ['chest', 'back', 'core', 'glutes', 'quads']);
  await wu(wt2.monday, E.shoulderCircles, 10);
  await wu(wt2.monday, E.catCow, 10);
  await wu(wt2.monday, E.legSwings, 10);
  await ex(wt2.monday, E.pushup,      3, 10, 45);
  await ex(wt2.monday, E.squatBW,     3, 15, 45);
  await ex(wt2.monday, E.gluteBridge, 3, 15, 45);
  await ab(wt2.monday, E.deadBug,     3, 10, 45);
  await ex(wt2.monday, E.superman,    3, 12, 45);
  await abT(wt2.monday, E.plank,      3, 30, 45);
  await ex(wt2.monday, E.pikePushup,  3, 8,  45);
  await wu(wt2.monday, E.hip9090, 2);

  resetOrder();
  wt2.tuesday = await makeWT(p2id, 'tuesday', 'Haut + Core — Progression', '🙌', 'upper',
    ['chest', 'shoulders', 'core', 'back', 'triceps']);
  await wu(wt2.tuesday, E.shoulderCircles, 10);
  await wu(wt2.tuesday, E.catCow, 10);
  await ex(wt2.tuesday, E.pushup,       3, 12, 45);
  await ex(wt2.tuesday, E.pikePushup,   3, 10, 45);
  await ex(wt2.tuesday, E.invertedRow,  3, 10, 45);
  await ex(wt2.tuesday, E.superman,     3, 15, 45);
  await abT(wt2.tuesday, E.hollowBody,  3, 20, 45);
  await ab(wt2.tuesday, E.bicycleCrunch,3, 15, 45);
  await ab(wt2.tuesday, E.russianTwist, 3, 20, 45);
  await wu(wt2.tuesday, E.thoracicRotation, 12);

  resetOrder();
  wt2.wednesday = await makeWT(p2id, 'wednesday', 'Vélo — Progression', '🚴', 'cardio', ['cardio']);
  await wu(wt2.wednesday, E.legSwings, 10);
  await wu(wt2.wednesday, E.catCow, 10);
  await exT(wt2.wednesday, E.velo, 1, 1200, 0); // 20 min avec 2 blocs d'effort
  await wu(wt2.wednesday, E.hip9090, 2);
  await wu(wt2.wednesday, E.catCow, 8);

  resetOrder();
  wt2.thursday = await makeWT(p2id, 'thursday', 'Bas + Stabilité — Progression', '🦵', 'lower',
    ['glutes', 'hamstrings', 'quads', 'core']);
  await wu(wt2.thursday, E.legSwings, 10);
  await wu(wt2.thursday, E.hip9090, 2);
  await wu(wt2.thursday, E.catCow, 8);
  await ex(wt2.thursday, E.hipThrustBW,   3, 15, 45);
  await ex(wt2.thursday, E.donkeyKick,    3, 15, 45);
  await ex(wt2.thursday, E.fireHydrant,   3, 15, 45);
  await ex(wt2.thursday, E.squatBW,       3, 15, 45);
  await ex(wt2.thursday, E.goodMorningBW, 3, 15, 45);
  await ex(wt2.thursday, E.gluteBridge,   3, 20, 45);
  await wu(wt2.thursday, E.hip9090, 2);

  resetOrder();
  wt2.friday = await makeWT(p2id, 'friday', 'Core + Haut — Progression', '🏋️', 'upper',
    ['core', 'chest', 'back']);
  await wu(wt2.friday, E.shoulderCircles, 10);
  await wu(wt2.friday, E.catCow, 10);
  await ex(wt2.friday, E.pushup,       3, 12, 45);
  await ab(wt2.friday, E.deadBug,      3, 10, 45);
  await ab(wt2.friday, E.legRaise,     3, 12, 45);
  await abT(wt2.friday, E.hollowBody,  3, 25, 45);
  await ab(wt2.friday, E.heelTouch,    3, 25, 45);
  await abT(wt2.friday, E.plank,       3, 30, 45);
  await wu(wt2.friday, E.inchworm, 6);

  resetOrder();
  wt2.saturday = await makeWT(p2id, 'saturday', 'Circuit Full Body — Progression', '⚡', 'fullbody',
    ['chest', 'glutes', 'core', 'quads', 'back']);
  await wu(wt2.saturday, E.legSwings, 10);
  await wu(wt2.saturday, E.shoulderCircles, 10);
  // 3 tours de circuit
  await ex(wt2.saturday, E.pushup,      3, 12, 30);
  await ex(wt2.saturday, E.gluteBridge, 3, 20, 30);
  await ab(wt2.saturday, E.crunch,      3, 20, 30);
  await ex(wt2.saturday, E.donkeyKick,  3, 15, 30);
  await ex(wt2.saturday, E.squatBW,     3, 15, 30);
  await ab(wt2.saturday, E.deadBug,     3, 8,  30);
  await ex(wt2.saturday, E.superman,    3, 12, 30);
  await abT(wt2.saturday, E.plank,      3, 25, 30);
  await wu(wt2.saturday, E.catCow, 10);
  await wu(wt2.saturday, E.hip9090, 2);

  resetOrder();
  wt2.sunday = await makeWT(p2id, 'sunday', 'Mobilité — Progression', '🧘', 'mobility',
    ['core', 'back', 'glutes']);
  await wu(wt2.sunday, E.catCow, 15);
  await wu(wt2.sunday, E.thoracicRotation, 15);
  await wu(wt2.sunday, E.hip9090, 2);
  await wu(wt2.sunday, E.legSwings, 12);
  await wu(wt2.sunday, E.inchworm, 8);
  await ex(wt2.sunday, E.superman,   2, 12, 45);
  await abT(wt2.sunday, E.sidePlank, 2, 25, 45);
  await abT(wt2.sunday, E.hollowBody,2, 20, 45);
  await exT(wt2.sunday, E.velo, 1, 600, 0); // 10 min léger
  await makeProgram('Programme 10S — Phase 2 · Progression', '📈', '#3b82f6', 3, wt2);
  console.log('  ✅ Phase 2 créée');

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 3 — INTENSIFICATION  (semaines 6-8)
  // 3-4 séries · repos 40s · supersets · vélo intervalles · variantes exigeantes
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n🔥 Phase 3 — Intensification...');
  const p3id = uid();
  const wt3 = {};

  resetOrder();
  wt3.monday = await makeWT(p3id, 'monday', 'Full Body — Intensification', '💪', 'fullbody',
    ['chest', 'back', 'core', 'glutes', 'quads']);
  await wu(wt3.monday, E.shoulderCircles, 12);
  await wu(wt3.monday, E.catCow, 10);
  await wu(wt3.monday, E.legSwings, 12);
  // Superset A : Pompes + Glute bridge
  await ex(wt3.monday, E.pushup,      3, 12, 60, { supersetGroup: 'A' });
  await ex(wt3.monday, E.gluteBridge, 3, 20, 60, { supersetGroup: 'A' });
  // Superset B : Pike push-up + Squat BW
  await ex(wt3.monday, E.pikePushup,  3, 10, 60, { supersetGroup: 'B' });
  await ex(wt3.monday, E.squatBW,     3, 20, 60, { supersetGroup: 'B' });
  // Superset C : Dead bug + Superman
  await ab(wt3.monday, E.deadBug,     3, 10, 60, { supersetGroup: 'C' });
  await ex(wt3.monday, E.superman,    3, 15, 60, { supersetGroup: 'C' });
  await abT(wt3.monday, E.plank,      3, 40, 45);
  await wu(wt3.monday, E.hip9090, 2);

  resetOrder();
  wt3.tuesday = await makeWT(p3id, 'tuesday', 'Haut + Core — Intensification', '🙌', 'upper',
    ['chest', 'shoulders', 'core', 'back', 'triceps']);
  await wu(wt3.tuesday, E.shoulderCircles, 12);
  await wu(wt3.tuesday, E.catCow, 10);
  await ex(wt3.tuesday, E.pushup,       4, 12, 40);
  await ex(wt3.tuesday, E.pikePushup,   3, 12, 40);
  await ex(wt3.tuesday, E.invertedRow,  3, 12, 40);
  await ex(wt3.tuesday, E.superman,     4, 15, 40);
  await ab(wt3.tuesday, E.bicycleCrunch,4, 20, 40);
  await ab(wt3.tuesday, E.russianTwist, 3, 25, 40);
  await ab(wt3.tuesday, E.scissors,     3, 20, 40);
  await wu(wt3.tuesday, E.thoracicRotation, 15);

  resetOrder();
  wt3.wednesday = await makeWT(p3id, 'wednesday', 'Vélo Intervalles — Intensification', '🚴', 'cardio', ['cardio']);
  await wu(wt3.wednesday, E.legSwings, 12);
  await wu(wt3.wednesday, E.catCow, 10);
  // 22 min : 3 blocs d'effort (3min effort / 2min récup) encadrés de 3min chauffe/retour
  await exT(wt3.wednesday, E.velo, 1, 1320, 0);
  await wu(wt3.wednesday, E.hip9090, 2);
  await wu(wt3.wednesday, E.catCow, 8);

  resetOrder();
  wt3.thursday = await makeWT(p3id, 'thursday', 'Bas + Stabilité — Intensification', '🦵', 'lower',
    ['glutes', 'hamstrings', 'quads', 'core']);
  await wu(wt3.thursday, E.legSwings, 12);
  await wu(wt3.thursday, E.hip9090, 2);
  await wu(wt3.thursday, E.catCow, 8);
  await ex(wt3.thursday, E.hipThrustBW,   4, 20, 40);
  await ex(wt3.thursday, E.donkeyKick,    3, 20, 40);
  await ex(wt3.thursday, E.fireHydrant,   3, 20, 40);
  await ex(wt3.thursday, E.squatBW,       4, 20, 40); // lent, 3s bas
  await ex(wt3.thursday, E.goodMorningBW, 4, 15, 40);
  await abT(wt3.thursday, E.sidePlank,    3, 30, 40);
  await wu(wt3.thursday, E.hip9090, 2);

  resetOrder();
  wt3.friday = await makeWT(p3id, 'friday', 'Core + Haut — Intensification', '🏋️', 'upper',
    ['core', 'chest', 'back']);
  await wu(wt3.friday, E.shoulderCircles, 12);
  await wu(wt3.friday, E.catCow, 10);
  await ex(wt3.friday, E.pushup,      4, 15, 40);
  await ab(wt3.friday, E.deadBug,     4, 12, 40);
  await abT(wt3.friday, E.hollowBody, 4, 30, 40);
  await abT(wt3.friday, E.plank,      4, 40, 40);
  await ab(wt3.friday, E.scissors,    3, 25, 40);
  await ab(wt3.friday, E.legRaise,    3, 15, 40);
  await wu(wt3.friday, E.inchworm, 8);

  resetOrder();
  wt3.saturday = await makeWT(p3id, 'saturday', 'Circuit Full Body — Intensification', '⚡', 'fullbody',
    ['chest', 'glutes', 'core', 'quads', 'back']);
  await wu(wt3.saturday, E.legSwings, 12);
  await wu(wt3.saturday, E.shoulderCircles, 12);
  // 4 tours · 25s repos
  await ex(wt3.saturday, E.pushup,      4, 15, 25);
  await ex(wt3.saturday, E.hipThrustBW, 4, 20, 25);
  await ab(wt3.saturday, E.bicycleCrunch,4,20, 25);
  await ex(wt3.saturday, E.fireHydrant, 4, 15, 25);
  await ex(wt3.saturday, E.squatBW,     4, 15, 25);
  await ab(wt3.saturday, E.deadBug,     4, 10, 25);
  await abT(wt3.saturday, E.plank,      4, 35, 25);
  await wu(wt3.saturday, E.catCow, 10);
  await wu(wt3.saturday, E.hip9090, 2);

  resetOrder();
  wt3.sunday = await makeWT(p3id, 'sunday', 'Mobilité — Intensification', '🧘', 'mobility',
    ['core', 'back', 'glutes']);
  await wu(wt3.sunday, E.catCow, 15);
  await wu(wt3.sunday, E.thoracicRotation, 15);
  await wu(wt3.sunday, E.hip9090, 2);
  await wu(wt3.sunday, E.legSwings, 15);
  await wu(wt3.sunday, E.inchworm, 10);
  await ex(wt3.sunday, E.superman,    3, 15, 45);
  await abT(wt3.sunday, E.sidePlank,  3, 35, 45);
  await abT(wt3.sunday, E.hollowBody, 2, 20, 45);
  await exT(wt3.sunday, E.velo, 1, 720, 0); // 12 min léger
  await makeProgram('Programme 10S — Phase 3 · Intensification', '🔥', '#f59e0b', 3, wt3);
  console.log('  ✅ Phase 3 créée');

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 4 — CONSOLIDATION  (semaines 9-10)
  // 4 séries · repos 35-40s · full-body intégré · meilleur des phases précédentes
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n🏆 Phase 4 — Consolidation...');
  const p4id = uid();
  const wt4 = {};

  resetOrder();
  wt4.monday = await makeWT(p4id, 'monday', 'Full Body — Consolidation', '💪', 'fullbody',
    ['chest', 'back', 'core', 'glutes', 'quads']);
  await wu(wt4.monday, E.shoulderCircles, 12);
  await wu(wt4.monday, E.catCow, 10);
  await wu(wt4.monday, E.legSwings, 12);
  await ex(wt4.monday, E.pushup,      4, 15, 40);
  await ex(wt4.monday, E.hipThrustBW, 4, 20, 40);
  await ex(wt4.monday, E.pikePushup,  3, 12, 40);
  await ab(wt4.monday, E.deadBug,     4, 12, 40);
  await ex(wt4.monday, E.gluteBridge, 4, 25, 40);
  await abT(wt4.monday, E.plank,      4, 45, 40);
  await ex(wt4.monday, E.squatBW,     3, 20, 40);
  await wu(wt4.monday, E.hip9090, 2);

  resetOrder();
  wt4.tuesday = await makeWT(p4id, 'tuesday', 'Haut + Core — Consolidation', '🙌', 'upper',
    ['chest', 'shoulders', 'core', 'back', 'triceps']);
  await wu(wt4.tuesday, E.shoulderCircles, 12);
  await wu(wt4.tuesday, E.catCow, 10);
  await ex(wt4.tuesday, E.pushup,       4, 15, 35);
  await ex(wt4.tuesday, E.pikePushup,   4, 12, 35);
  await ex(wt4.tuesday, E.invertedRow,  4, 12, 35);
  await ab(wt4.tuesday, E.bicycleCrunch,4, 20, 35);
  await ab(wt4.tuesday, E.scissors,     4, 25, 35);
  await abT(wt4.tuesday, E.hollowBody,  3, 35, 35);
  await ab(wt4.tuesday, E.russianTwist, 3, 30, 35);
  await wu(wt4.tuesday, E.thoracicRotation, 15);

  resetOrder();
  wt4.wednesday = await makeWT(p4id, 'wednesday', 'Vélo Intervalles — Consolidation', '🚴', 'cardio', ['cardio']);
  await wu(wt4.wednesday, E.legSwings, 12);
  await wu(wt4.wednesday, E.catCow, 10);
  // 25 min : 4 blocs d'effort
  await exT(wt4.wednesday, E.velo, 1, 1500, 0);
  await wu(wt4.wednesday, E.hip9090, 2);
  await wu(wt4.wednesday, E.catCow, 8);

  resetOrder();
  wt4.thursday = await makeWT(p4id, 'thursday', 'Bas + Stabilité — Consolidation', '🦵', 'lower',
    ['glutes', 'hamstrings', 'quads', 'core']);
  await wu(wt4.thursday, E.legSwings, 12);
  await wu(wt4.thursday, E.hip9090, 2);
  await wu(wt4.thursday, E.catCow, 8);
  await ex(wt4.thursday, E.hipThrustBW,   4, 20, 40);
  await ex(wt4.thursday, E.squatBW,       4, 20, 40); // 3s descente
  await ex(wt4.thursday, E.donkeyKick,    4, 20, 40);
  await ex(wt4.thursday, E.fireHydrant,   4, 20, 40);
  await ex(wt4.thursday, E.goodMorningBW, 4, 15, 40);
  await abT(wt4.thursday, E.sidePlank,    4, 35, 40);
  await ex(wt4.thursday, E.gluteBridge,   3, 25, 40);
  await wu(wt4.thursday, E.hip9090, 2);

  resetOrder();
  wt4.friday = await makeWT(p4id, 'friday', 'Core + Haut — Consolidation', '🏋️', 'upper',
    ['core', 'chest', 'back']);
  await wu(wt4.friday, E.shoulderCircles, 12);
  await wu(wt4.friday, E.catCow, 10);
  await ex(wt4.friday, E.pushup,      4, 15, 35);
  await ab(wt4.friday, E.deadBug,     4, 12, 35);
  await abT(wt4.friday, E.plank,      4, 50, 35);
  await abT(wt4.friday, E.hollowBody, 4, 35, 35);
  await ab(wt4.friday, E.legRaise,    4, 15, 35);
  await ex(wt4.friday, E.superman,    3, 15, 35);
  await wu(wt4.friday, E.inchworm, 10);

  resetOrder();
  wt4.saturday = await makeWT(p4id, 'saturday', 'Circuit Full Body — Consolidation', '⚡', 'fullbody',
    ['chest', 'glutes', 'core', 'quads', 'back']);
  await wu(wt4.saturday, E.legSwings, 12);
  await wu(wt4.saturday, E.shoulderCircles, 12);
  // 4 tours · 20s repos — le meilleur du programme
  await ex(wt4.saturday, E.pushup,      4, 15, 20);
  await ex(wt4.saturday, E.hipThrustBW, 4, 25, 20);
  await ab(wt4.saturday, E.bicycleCrunch,4,25, 20);
  await ex(wt4.saturday, E.donkeyKick,  4, 15, 20);
  await ex(wt4.saturday, E.squatBW,     4, 20, 20);
  await ab(wt4.saturday, E.deadBug,     4, 10, 20);
  await abT(wt4.saturday, E.plank,      4, 45, 20);
  await ex(wt4.saturday, E.superman,    4, 15, 20);
  await wu(wt4.saturday, E.catCow, 10);
  await wu(wt4.saturday, E.hip9090, 2);

  resetOrder();
  wt4.sunday = await makeWT(p4id, 'sunday', 'Mobilité + Récup — Consolidation', '🧘', 'mobility',
    ['core', 'back', 'glutes']);
  await wu(wt4.sunday, E.catCow, 20);
  await wu(wt4.sunday, E.thoracicRotation, 20);
  await wu(wt4.sunday, E.hip9090, 2);
  await wu(wt4.sunday, E.legSwings, 15);
  await wu(wt4.sunday, E.inchworm, 10);
  await ex(wt4.sunday, E.superman,    3, 15, 45);
  await abT(wt4.sunday, E.sidePlank,  3, 40, 45);
  await abT(wt4.sunday, E.hollowBody, 2, 25, 45);
  await exT(wt4.sunday, E.velo, 1, 900, 0); // 15 min léger
  await makeProgram('Programme 10S — Phase 4 · Consolidation', '🏆', '#8b5cf6', 2, wt4);
  console.log('  ✅ Phase 4 créée');

  console.log(`
✅ Programme 10 semaines injecté !
   4 templates dans "Programmes → Templates"
   → 🌱 Phase 1 · Adaptation  (sem 1-2)
   → 📈 Phase 2 · Progression (sem 3-5)
   → 🔥 Phase 3 · Intensification (sem 6-8)
   → 🏆 Phase 4 · Consolidation (sem 9-10)

Rechargez la page (F5) puis activez la Phase 1 pour démarrer.
Changez de phase en activant le template suivant quand c'est le moment.
  `);
  db.close();
})().catch(e => console.error('[Forge] ❌', e));
