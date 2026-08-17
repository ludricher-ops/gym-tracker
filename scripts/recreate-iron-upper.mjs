// Supprime l'Iron Upper existant et le recrée à l'identique de la config actuelle.
// Structure reflète exactement ce qui est en base (vérifié via inspect-iron-upper.mjs) :
//   Échauffement : 5 exos spécifiques par séance (Jumping jacks, Mountain climbers…)
//   J1 Poitrine+Dos  : A(DC↔RowUniDroit↔RowUniGauche) B(DI↔Row) Solo(Écarté) + Abdos
//   J2 Épaules+Bras  : A(Dev↔Curl×20) B(Ext↔Marteau) C(Lat↔Oiseau) + Abdos
//   J3 Full Upper    : A(Row↔DC auto+) B(Dips↔Pullover) C(Écarté↔Oiseau) + Abdos
//   Abdominaux : D(Planche 3×45s + Gainage 2×30s) + 7 exos solo (bloc J1)
//
// Usage : railway run node scripts/recreate-iron-upper.mjs

import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Pool } = pg
const NOW = Date.now()

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL ou DATABASE_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

function syncable(id) {
  return { id, updatedAt: NOW, deleted: false, dirty: false }
}

async function upsert(client, store, id, data) {
  await client.query(
    `INSERT INTO sync_records (store, id, data, updated_at, server_seq)
     VALUES ($1, $2, $3, $4, nextval(pg_get_serial_sequence('sync_records','server_seq')))
     ON CONFLICT (store, id) DO UPDATE
       SET data = $3, updated_at = $4,
           server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))`,
    [store, id, JSON.stringify({ ...syncable(id), ...data }), NOW],
  )
}

// exercice de séance : exerciseId, order, sets, repsMin, restSec, supersetGroup, opts
function wet(exerciseId, order, sets, repsMin, rest, group, opts = {}) {
  return {
    exerciseId,
    order,
    targetSets: sets,
    repsMode: opts.repsMode ?? 'fixed',
    targetRepsMin: repsMin,
    targetRepsMax: opts.repsMax,
    targetDurationSec: opts.durationSec,
    restSec: rest,
    supersetGroup: group,
    autoProgress: opts.autoProgress ?? false,
    progressStepKg: opts.progressStep ?? 0,
    isWarmup: opts.isWarmup ?? undefined,
    isAb: opts.isAb ?? undefined,
  }
}

// Exercice d'échauffement (1 set, repos 0s par défaut)
function warmup(exerciseId, order, repsMin, opts = {}) {
  const { restSec = 0, ...rest } = opts
  return wet(exerciseId, order, 1, repsMin, restSec, null, { ...rest, isWarmup: true })
}

// Bloc abdo (isAb: true → section Abdominaux dans l'UI)
// Structure actuelle : superset D (Planche 3×45s + Gainage latéral 2×30s) + 7 exos individuels
function coreBlock(ex, startOrder) {
  return [
    wet(ex.planche,       startOrder,     3, 1,  0, 'D', { durationSec: 45, isAb: true }),
    wet(ex.gainageLat,    startOrder + 1, 2, 1,  0, 'D', { durationSec: 30, isAb: true }),
    wet(ex.ciseaux,       startOrder + 2, 1, 40, 0, null, { isAb: true }),
    wet(ex.relevJambes,   startOrder + 3, 1, 15, 0, null, { isAb: true }),
    wet(ex.crunchVelo,    startOrder + 4, 1, 40, 0, null, { isAb: true }),
    wet(ex.russian,       startOrder + 5, 1, 40, 0, null, { isAb: true }),
    wet(ex.toucheTalon,   startOrder + 6, 1, 40, 0, null, { isAb: true }),
    wet(ex.crunch,        startOrder + 7, 1, 15, 0, null, { isAb: true }),
    wet(ex.crunchJambesV, startOrder + 8, 1, 15, 0, null, { isAb: true }),
  ]
}

async function run() {
  const client = await pool.connect()
  try {
    // 1. Exercices ─────────────────────────────────────────────────────────────
    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name FROM sync_records
       WHERE store = 'exercises' AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    const byName = Object.fromEntries(rows.map((r) => [r.name, r.id]))

    const needed = {
      // Échauffement
      cerclesEpaules:   "Cercles d'épaules",
      jumpingJacks:     'Jumping jacks',
      mountainClimbers: 'Mountain climbers',
      superman:         'Superman',
      fentes:           'Fentes marchées',
      // Exercices principaux
      devCouche:        'Développé couché haltères',
      rowingUniDroit:   'Rowing haltère Droit (appui sur banc)',
      rowingUniGauche:  'Rowing haltère Gauche (appui sur banc)',
      devIncline:       'Développé incliné haltères',
      rowing:      'Rowing haltère',
      ecarte:      'Écarté haltères',
      devEpaules:  'Développé épaules haltères',
      curlAlt:     'Curl haltères alterné',
      extTriceps:  'Extension triceps nuque',
      curlMarteau: 'Curl marteau',
      elevLat:     'Élévations latérales',
      oiseau:      'Oiseau (buste penché)',
      dips:        'Dips triceps',
      pullover:    'Pull-over haltère',
      // Abdominaux
      planche:       'Planche',
      gainageLat:    'Gainage latéral',
      ciseaux:       'Ciseaux',
      relevJambes:   'Relevé de jambes',
      crunchVelo:    'Crunch bicyclette',
      russian:       'Russian twist',
      toucheTalon:   'Touche talon alternés',
      crunch:        'Crunch',
      crunchJambesV: 'Crunch avec jambes verticales',
    }

    // Fallbacks : noms alternatifs si le nom exact est absent
    const fallbacks = {
      rowingUniDroit:  ['Rowing haltère Droit (appui sur banc)', 'Rowing haltère unilatéral (appui sur banc)', 'Rowing haltère unilatéral', 'Rowing haltère'],
      rowingUniGauche: ['Rowing haltère Gauche (appui sur banc)', 'Rowing haltère unilatéral (appui sur banc)', 'Rowing haltère unilatéral', 'Rowing haltère'],
      curlAlt:         ['Curl haltères alterné', 'Curl haltères'],
    }
    for (const [key, candidates] of Object.entries(fallbacks)) {
      for (const name of candidates) {
        if (byName[name]) { needed[key] = name; break }
      }
      if (needed[key] !== candidates[0]) {
        console.log(`   ℹ️  "${candidates[0]}" introuvable → "${needed[key]}" utilisé`)
      }
    }

    const ex = {}
    const missing = []
    for (const [key, name] of Object.entries(needed)) {
      ex[key] = byName[name]
      if (!ex[key]) missing.push(`"${name}"`)
    }
    if (missing.length) {
      console.error('❌ Exercices introuvables :', missing.join(', '))
      // Afficher les exercices qui ressemblent au nom manquant pour aider
      const keywords = missing.map((m) => m.toLowerCase().replace(/[^a-zàâéèêëîïôùûü\s]/g, '').trim().split(' ').slice(0, 2).join(' '))
      for (const kw of keywords) {
        const similar = rows.filter((r) => r.name.toLowerCase().includes(kw.split(' ')[0] ?? ''))
        if (similar.length) console.error(`   Exercices avec "${kw.split(' ')[0]}" en base :`, similar.map((r) => `"${r.name}"`).join(', '))
      }
      process.exit(1)
    }

    await client.query('BEGIN')

    // 2. Supprimer l'Iron Upper existant ──────────────────────────────────────
    const { rows: existingProgs } = await client.query(
      `SELECT id FROM sync_records
       WHERE store = 'programs' AND data->>'name' = 'Iron Upper'
         AND (data->>'deleted')::boolean IS NOT TRUE`,
    )

    for (const prog of existingProgs) {
      const { rows: wts } = await client.query(
        `SELECT id FROM sync_records
         WHERE store = 'workoutTemplates' AND data->>'programId' = $1`,
        [prog.id],
      )
      for (const wt of wts) {
        await client.query(
          `UPDATE sync_records
           SET data = jsonb_set(data, '{deleted}', 'true'::jsonb),
               updated_at = $1,
               server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
           WHERE store = 'workoutExerciseTemplates' AND data->>'workoutTemplateId' = $2`,
          [NOW, wt.id],
        )
        await client.query(
          `UPDATE sync_records
           SET data = jsonb_set(data, '{deleted}', 'true'::jsonb),
               updated_at = $1,
               server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
           WHERE store = 'workoutTemplates' AND id = $2`,
          [NOW, wt.id],
        )
      }
      await client.query(
        `UPDATE sync_records
         SET data = jsonb_set(data, '{deleted}', 'true'::jsonb),
             updated_at = $1,
             server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
         WHERE store = 'programs' AND id = $2`,
        [NOW, prog.id],
      )
      console.log(`   🗑️  Iron Upper existant supprimé (${prog.id.slice(0, 8)}…)`)
    }

    // 3. Créer le programme rebalancé ──────────────────────────────────────────
    const progId = randomUUID()
    const wt1Id  = randomUUID() // Poitrine + Dos   (lundi)
    const wt2Id  = randomUUID() // Épaules + Bras   (mercredi)
    const wt3Id  = randomUUID() // Full Upper        (vendredi)

    await upsert(client, 'programs', progId, {
      name: 'Iron Upper',
      goal: 'hypertrophy',
      level: 'beginner',
      durationWeeks: 13,
      sessionsPerWeek: 3,
      color: '#f97316',
      isTemplate: true,
      isActive: false,
      createdAt: NOW,
      weekTemplate: { monday: wt1Id, wednesday: wt2Id, friday: wt3Id },
    })

    await upsert(client, 'workoutTemplates', wt1Id, {
      programId: progId, name: 'Poitrine + Dos',
      type: 'upper', muscleGroups: ['chest', 'back', 'core'],
    })
    await upsert(client, 'workoutTemplates', wt2Id, {
      programId: progId, name: 'Épaules + Bras',
      type: 'upper', muscleGroups: ['shoulders', 'biceps', 'triceps', 'core'],
    })
    await upsert(client, 'workoutTemplates', wt3Id, {
      programId: progId, name: 'Full Upper',
      type: 'upper', muscleGroups: ['chest', 'back', 'triceps', 'core'],
    })

    // Échauffement commun aux 3 séances
    const warmupBlock = (s) => [
      warmup(ex.cerclesEpaules,   s,     10),
      warmup(ex.jumpingJacks,     s + 1, 40),
      warmup(ex.mountainClimbers, s + 2, 20),
      warmup(ex.superman,         s + 3, 10),
      warmup(ex.fentes,           s + 4, 10),
    ]

    // ── Jour 1 : Poitrine + Dos ──────────────────────────────────────────────
    // A : Développé couché + Rowing Gauche + Rowing Droit (triset, auto+)
    // B : Développé incliné ↔ Rowing haltère              (superset, auto+)
    // Solo : Écarté haltères
    const j1 = [
      ...warmupBlock(20),
      wet(ex.devCouche,       0, 3, 10, 30, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowingUniGauche, 1, 3, 10, 30, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowingUniDroit,  2, 3, 10, 30, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.devIncline,      3, 3, 10, 30, 'B', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowing,          4, 3, 10, 30, 'B', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.ecarte,          5, 3, 12, 30, null),
      ...coreBlock(ex, 6),
    ]
    for (const w of j1) await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wt1Id, ...w })

    // ── Jour 2 : Épaules + Bras ──────────────────────────────────────────────
    // A : Développé épaules ↔ Curl haltères ×20  (push/pull)
    // B : Extension triceps nuque ↔ Curl marteau  (push/pull)
    // C : Élévations latérales ↔ Oiseau           (isolation épaules)
    const j2 = [
      ...warmupBlock(20),
      wet(ex.devEpaules,  0, 3, 10, 45, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.curlAlt,     1, 3, 20, 45, 'A'),
      wet(ex.extTriceps,  2, 3, 10, 45, 'B'),
      wet(ex.curlMarteau, 3, 3, 20, 45, 'B'),
      wet(ex.elevLat,     4, 3, 12, 45, 'C'),
      wet(ex.oiseau,      5, 3, 12, 45, 'C'),
      ...coreBlock(ex, 6),
    ]
    for (const w of j2) await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wt2Id, ...w })

    // ── Jour 3 : Full Upper ──────────────────────────────────────────────────
    // A : Rowing haltère ↔ Développé couché haltères (pull/push, auto+)
    // B : Dips triceps ↔ Pull-over haltère
    // C : Écarté haltères ↔ Oiseau
    const j3 = [
      ...warmupBlock(20),
      wet(ex.rowing,    0, 3, 10, 30, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.devCouche, 1, 3, 10, 30, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.dips,      2, 3, 10, 30, 'B'),
      wet(ex.pullover,  3, 3, 10, 30, 'B'),
      wet(ex.ecarte,    4, 3, 12, 30, 'C'),
      wet(ex.oiseau,    5, 3, 12, 30, 'C'),
      ...coreBlock(ex, 6),
    ]
    for (const w of j3) await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wt3Id, ...w })

    await client.query('COMMIT')

    console.log('\n✅ Iron Upper recréé !')
    console.log('   J1 Poitrine+Dos  : échauff×5 | A(DC↔RowG↔RowD) B(DI↔Row) Solo(Écarté) | Abdos×9')
    console.log('   J2 Épaules+Bras  : échauff×5 | A(Dev↔Curl×20) B(Ext↔Marteau) C(Lat↔Oiseau) | Abdos×9')
    console.log('   J3 Full Upper    : échauff×5 | A(Row↔DC auto+) B(Dips↔Pullover) C(Écarté↔Oiseau) | Abdos×9')
    console.log('\n   Force une synchro dans l\'app pour voir le template mis à jour.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur :', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
