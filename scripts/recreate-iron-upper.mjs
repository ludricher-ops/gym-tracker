// Supprime l'Iron Upper existant et le recrée avec une structure équilibrée.
// Changements vs v1 :
//   Jour 3 : ajout Rowing haltère (traction manquante) + Développé couché
//            remplace les séances isolation-only par un vrai push/pull
//   Core   : 1 triset par séance (Planche + Crunch vélo + Russian twist)
//            au lieu de 3 blocs / 8 exercices — volume réduit à l'essentiel
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
  }
}

// Core triset commun (Planche + Crunch vélo + Russian twist)
function coreTriset(ex, startOrder, groupLetter) {
  return [
    wet(ex.planche,    startOrder,     3, 1,  30, groupLetter, { durationSec: 45 }),
    wet(ex.crunchVelo, startOrder + 1, 3, 20, 30, groupLetter),
    wet(ex.russian,    startOrder + 2, 3, 20, 30, groupLetter),
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
      devCouche:   'Développé couché haltères',
      rowingUni:   'Rowing haltère unilatéral (appui sur banc)',
      devIncline:  'Développé incliné haltères',
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
      planche:     'Planche',
      crunchVelo:  'Crunch bicyclette',
      russian:     'Russian twist',
    }

    // Fallbacks : noms alternatifs si le nom exact est absent
    const fallbacks = {
      rowingUni: ['Rowing haltère Droit (appui sur banc)', 'Rowing haltère unilatéral (appui sur banc)', 'Rowing haltère unilatéral', 'Rowing 1 bras', 'Rowing haltère'],
      curlAlt:   ['Curl haltères alterné', 'Curl haltères'],
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

    // ── Jour 1 : Poitrine + Dos ──────────────────────────────────────────────
    // A : Développé couché ↔ Rowing unilatéral  (push/pull, auto+)
    // B : Développé incliné ↔ Rowing haltère     (push/pull, auto+)
    // Solo : Écarté haltères
    // C : Planche + Crunch vélo + Russian twist
    const j1 = [
      wet(ex.devCouche,  0, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowingUni,  1, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.devIncline, 2, 3, 10, 90, 'B', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.rowing,     3, 3, 10, 90, 'B', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.ecarte,     4, 3, 12, 90, null),
      ...coreTriset(ex, 5, 'C'),
    ]
    for (const w of j1) await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wt1Id, ...w })

    // ── Jour 2 : Épaules + Bras ──────────────────────────────────────────────
    // A : Développé épaules ↔ Curl haltères      (push/pull)
    // B : Extension triceps nuque ↔ Curl marteau  (push/pull)
    // C : Élévations latérales ↔ Oiseau           (isolation épaules)
    // D : Planche + Crunch vélo + Russian twist
    const j2 = [
      wet(ex.devEpaules,  0, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.curlAlt,     1, 3, 10, 90, 'A'),
      wet(ex.extTriceps,  2, 3, 10, 90, 'B'),
      wet(ex.curlMarteau, 3, 3, 10, 90, 'B'),
      wet(ex.elevLat,     4, 3, 12, 90, 'C'),
      wet(ex.oiseau,      5, 3, 12, 90, 'C'),
      ...coreTriset(ex, 6, 'D'),
    ]
    for (const w of j2) await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wt2Id, ...w })

    // ── Jour 3 : Full Upper (rebalancé) ─────────────────────────────────────
    // AVANT : Dips + Pull-over / Écarté + Oiseau (tout isolation, 0 rowing)
    // APRÈS :
    // A : Rowing haltère ↔ Développé couché haltères (pull/push, auto+)
    // B : Dips triceps ↔ Pull-over haltère            (triceps / grand dorsal)
    // C : Écarté haltères ↔ Oiseau                    (isolation finisher)
    // D : Planche + Crunch vélo + Russian twist
    const j3 = [
      wet(ex.rowing,    0, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.devCouche, 1, 3, 10, 90, 'A', { autoProgress: true, progressStep: 2.5 }),
      wet(ex.dips,      2, 3, 10, 90, 'B'),
      wet(ex.pullover,  3, 3, 12, 90, 'B'),
      wet(ex.ecarte,    4, 3, 12, 90, 'C'),
      wet(ex.oiseau,    5, 3, 12, 90, 'C'),
      ...coreTriset(ex, 6, 'D'),
    ]
    for (const w of j3) await upsert(client, 'workoutExerciseTemplates', randomUUID(), { workoutTemplateId: wt3Id, ...w })

    await client.query('COMMIT')

    console.log('\n✅ Iron Upper rebalancé créé !')
    console.log('   J1 Poitrine+Dos  : A(DC↔RowUni) B(DI↔Row) Solo(Écarté) Core')
    console.log('   J2 Épaules+Bras  : A(Dev↔Curl) B(Ext↔Marteau) C(Lat↔Oiseau) Core')
    console.log('   J3 Full Upper    : A(Row↔DC) B(Dips↔Pullover) C(Écarté↔Oiseau) Core')
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
