/**
 * seed-full-body-rowing.js
 * À coller dans la console du navigateur sur l'app gym-tracker.
 * Crée le programme "Full Body Rowing" directement dans l'IndexedDB.
 */
(async () => {
  const DB_NAME = 'gymtrack';
  const now = Date.now();
  const uid = () => crypto.randomUUID();

  // ── Ouvrir la base ──────────────────────────────────────────────────────────
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  console.log('[Forge] Base ouverte :', DB_NAME);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const normalize = s =>
    s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

  // Écrit dans un store + ajoute à l'outbox (atomique, comme repo.ts)
  const save = (storeName, record) =>
    new Promise((res, rej) => {
      const tx = db.transaction([storeName, 'outbox'], 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.objectStore('outbox').add({ store: storeName, id: record.id, updatedAt: record.updatedAt });
      tx.oncomplete = () => res(record);
      tx.onerror = () => rej(tx.error);
    });

  const syncable = () => ({ deleted: false, dirty: true, updatedAt: now });

  // ── Exercices existants ─────────────────────────────────────────────────────
  const existing = await new Promise((res, rej) => {
    const tx = db.transaction('exercises', 'readonly');
    const r = tx.objectStore('exercises').getAll();
    r.onsuccess = () => res(r.result.filter(e => !e.deleted));
    r.onerror = () => rej(r.error);
  });
  const exMap = new Map(existing.map(e => [normalize(e.name), e.id]));
  console.log(`[Forge] ${existing.length} exercice(s) trouvé(s) dans l'IDB`);

  // ── Créer un exercice s'il n'existe pas déjà (matching par nom normalisé) ───
  const ensureEx = async ({ key, name, primaryMuscle, secondaryMuscles = [], equipment, category, trackingType, media }) => {
    const k = normalize(name);
    if (exMap.has(k)) { console.log(`  ✓ ${name}`); return exMap.get(k); }
    const id = uid();
    await save('exercises', {
      id, name, primaryMuscle, secondaryMuscles, equipment, category, trackingType,
      isCustom: true, isWarmupExercise: false, popularity: 0, usageCount: 0, createdAt: now,
      ...(media ? { media } : {}),
      ...syncable(),
    });
    exMap.set(k, id);
    console.log(`  + ${name} (créé)`);
    return id;
  };

  // ── Définitions d'exercices ─────────────────────────────────────────────────
  console.log('[Forge] Vérification / création des exercices...');
  const E = {};
  const defs = [
    // Échauffement — "Fentes dynamiques" n'existe pas → on réutilise "Fentes"
    { key: 'jj',   name: 'Jumping jacks',              primaryMuscle: 'cardio',            equipment: 'bodyweight', category: 'compound',  trackingType: 'time' },
    { key: 'fd',   name: 'Fentes',                     primaryMuscle: 'quads',             equipment: 'bodyweight', category: 'compound',  trackingType: 'reps_only', secondaryMuscles: ['glutes'] },
    { key: 'te',   name: "Tour d'épaules barre vide",  primaryMuscle: 'shoulders',         equipment: 'barbell',    category: 'isolation', trackingType: 'reps_only' },
    // J1 — noms alignés sur la BDD
    { key: 'dc',   name: 'Développé couché barre',     primaryMuscle: 'chest',             equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['shoulders_front', 'triceps'] },
    { key: 'el',   name: 'Élévations latérales',       primaryMuscle: 'shoulders_lateral', equipment: 'dumbbell',   category: 'isolation', trackingType: 'weight_reps' },
    { key: 'rb',   name: 'Rowing barre',               primaryMuscle: 'back_thickness',    equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['biceps', 'back_width'] },
    { key: 'cb',   name: 'Curl barre',                 primaryMuscle: 'biceps',            equipment: 'barbell',    category: 'isolation', trackingType: 'weight_reps' },
    { key: 'sq',   name: 'Squat barre',                primaryMuscle: 'quads',             equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['glutes', 'hamstrings'] },
    { key: 'rdl',  name: 'Romanian deadlift',          primaryMuscle: 'hamstrings',        equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['glutes', 'back'],
      media: { type: 'gif', url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif' } },
    // J2
    { key: 'dih',  name: 'Développé incliné haltères', primaryMuscle: 'chest_upper',       equipment: 'dumbbell',   category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['shoulders_front', 'triceps'] },
    { key: 'oi',   name: 'Oiseau (buste penché)',       primaryMuscle: 'shoulders_rear',    equipment: 'dumbbell',   category: 'isolation', trackingType: 'weight_reps', secondaryMuscles: ['back'] },
    { key: 'tl',   name: 'Tractions lestées',           primaryMuscle: 'back_width',        equipment: 'bodyweight', category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['biceps'],
      media: { type: 'gif', url: 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Weighted-Pull-up.gif' } },
    { key: 'cm',   name: 'Curl marteau',                primaryMuscle: 'biceps',            equipment: 'dumbbell',   category: 'isolation', trackingType: 'weight_reps', secondaryMuscles: ['forearms'] },
    { key: 'sqa',  name: 'Squat avant',                 primaryMuscle: 'quads',             equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['glutes', 'core'] },
    { key: 'gm',   name: 'Good morning',                primaryMuscle: 'hamstrings',        equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['glutes', 'back'] },
    // J3
    { key: 'dm',   name: 'Développé militaire barre',  primaryMuscle: 'shoulders',         equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['shoulders_front', 'triceps'] },
    { key: 'dips', name: 'Dips lestés',                 primaryMuscle: 'chest_lower',       equipment: 'bodyweight', category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['triceps', 'shoulders_front'],
      media: { type: 'gif', url: 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Chest-Dips.gif' } },
    { key: 'rhu',  name: 'Rowing haltère',              primaryMuscle: 'back_thickness',    equipment: 'dumbbell',   category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['biceps'] },
    { key: 'ch',   name: 'Curl haltères',               primaryMuscle: 'biceps',            equipment: 'dumbbell',   category: 'isolation', trackingType: 'weight_reps' },
    { key: 'fb',   name: 'Squat bulgare',               primaryMuscle: 'quads',             equipment: 'dumbbell',   category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['glutes', 'hamstrings'] },
    { key: 'ht',   name: 'Hip thrust',                  primaryMuscle: 'glutes',            equipment: 'barbell',    category: 'compound',  trackingType: 'weight_reps', secondaryMuscles: ['hamstrings'] },
    // Abdos
    { key: 'crl',  name: 'Crunch lestés',               primaryMuscle: 'core',              equipment: 'dumbbell',   category: 'isolation', trackingType: 'weight_reps',
      media: { type: 'gif', url: 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Weighted-Crunch.gif' } },
    { key: 'rj',   name: 'Relevé de jambes',            primaryMuscle: 'core',              equipment: 'bodyweight', category: 'isolation', trackingType: 'reps_only' },
    { key: 'gl',   name: 'Gainage latéral',             primaryMuscle: 'core',              equipment: 'bodyweight', category: 'isolation', trackingType: 'time' },
  ];
  for (const def of defs) E[def.key] = await ensureEx(def);

  // ── Programme ────────────────────────────────────────────────────────────────
  console.log('[Forge] Création du programme...');
  const programId = uid();
  await save('programs', {
    id: programId, name: 'Full Body Rowing',
    goal: 'hypertrophy', level: 'intermediate',
    durationWeeks: 12, sessionsPerWeek: 3,
    color: '#3b82f6', isTemplate: false, isActive: false,
    weekTemplate: {}, createdAt: now, ...syncable(),
  });

  // ── Templates de séances ─────────────────────────────────────────────────────
  console.log('[Forge] Création des templates de séances...');
  const makeWT = async (name, icon, muscleGroups) => {
    const id = uid();
    await save('workoutTemplates', {
      id, programId, name, icon, type: 'fullbody', muscleGroups, ...syncable(),
    });
    console.log(`  + ${name}`);
    return id;
  };
  const j1Id = await makeWT('J1 — Base',              '🏋️', ['chest', 'back_thickness', 'quads', 'hamstrings']);
  const j2Id = await makeWT('J2 — Volume',            '💪',  ['chest_upper', 'back_width', 'quads', 'hamstrings']);
  const j3Id = await makeWT('J3 — Force & Unilatéral','⚡',  ['shoulders', 'back_thickness', 'quads', 'glutes']);

  // ── Exercices de templates ────────────────────────────────────────────────────
  let _order = 0;
  const resetOrder = () => { _order = 0; };

  const addExT = (workoutTemplateId, exerciseId, opts) =>
    save('workoutExerciseTemplates', {
      id: uid(), workoutTemplateId, exerciseId,
      order: _order++, repsMode: 'fixed',
      autoProgress: false, progressStepKg: 0,
      targetRepsMin: 0,
      ...syncable(), ...opts,
    });

  // Raccourcis
  const wu = (wtId, exId, opts) =>
    addExT(wtId, exId, { targetSets: 2, restSec: 30, isWarmup: true, ...opts });

  const sup = (wtId, exId, group, reps, restSec) =>
    addExT(wtId, exId, {
      targetSets: 3, supersetGroup: group, targetRepsMin: reps, restSec,
      autoProgress: true, progressStepKg: 2.5,
    });

  const abEx = (wtId, exId, opts) =>
    addExT(wtId, exId, { targetSets: 3, isAb: true, restSec: 60, ...opts });

  // ── J1 — Base ────────────────────────────────────────────────────────────────
  console.log('[Forge] J1...');
  resetOrder();
  await wu(j1Id, E.jj,  { targetDurationSec: 30, targetRepsMin: 1 });
  await wu(j1Id, E.fd,  { targetRepsMin: 10 });
  await wu(j1Id, E.te,  { targetRepsMin: 15 });
  await sup(j1Id, E.dc,  'A', 6,  0);
  await sup(j1Id, E.el,  'A', 12, 90);
  await sup(j1Id, E.rb,  'B', 6,  0);
  await sup(j1Id, E.cb,  'B', 10, 90);
  await sup(j1Id, E.sq,  'C', 6,  0);
  await sup(j1Id, E.rdl, 'C', 10, 120);
  await abEx(j1Id, E.crl, { targetRepsMin: 15 });
  await abEx(j1Id, E.rj,  { targetRepsMin: 12 });
  await abEx(j1Id, E.gl,  { targetDurationSec: 30, targetRepsMin: 1 });

  // ── J2 — Volume ──────────────────────────────────────────────────────────────
  console.log('[Forge] J2...');
  resetOrder();
  await wu(j2Id, E.jj,  { targetDurationSec: 30, targetRepsMin: 1 });
  await wu(j2Id, E.fd,  { targetRepsMin: 10 });
  await wu(j2Id, E.te,  { targetRepsMin: 15 });
  await sup(j2Id, E.dih, 'A', 10, 0);
  await sup(j2Id, E.oi,  'A', 12, 90);
  await sup(j2Id, E.tl,  'B', 6,  0);
  await sup(j2Id, E.cm,  'B', 10, 90);
  await sup(j2Id, E.sqa, 'C', 8,  0);
  await sup(j2Id, E.gm,  'C', 10, 120);
  await abEx(j2Id, E.crl, { targetRepsMin: 15 });
  await abEx(j2Id, E.rj,  { targetRepsMin: 12 });
  await abEx(j2Id, E.gl,  { targetDurationSec: 30, targetRepsMin: 1 });

  // ── J3 — Force & Unilatéral ──────────────────────────────────────────────────
  console.log('[Forge] J3...');
  resetOrder();
  await wu(j3Id, E.jj,   { targetDurationSec: 30, targetRepsMin: 1 });
  await wu(j3Id, E.fd,   { targetRepsMin: 10 });
  await wu(j3Id, E.te,   { targetRepsMin: 15 });
  await sup(j3Id, E.dm,   'A', 6,  0);
  await sup(j3Id, E.dips, 'A', 8,  90);
  await sup(j3Id, E.rhu,  'B', 6,  0);
  await sup(j3Id, E.ch,   'B', 10, 90);
  await sup(j3Id, E.fb,   'C', 8,  0);
  await sup(j3Id, E.ht,   'C', 10, 120);
  await abEx(j3Id, E.crl, { targetRepsMin: 15 });
  await abEx(j3Id, E.rj,  { targetRepsMin: 12 });
  await abEx(j3Id, E.gl,  { targetDurationSec: 30, targetRepsMin: 1 });

  console.log('[Forge] ✅ "Full Body Rowing" injecté ! Rechargez la page (F5).');
  db.close();
})().catch(e => console.error('[Forge] ❌ Erreur :', e));
