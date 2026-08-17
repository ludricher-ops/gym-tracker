// Affiche la structure complète de l'Iron Upper (exercices, flags isWarmup/isAb, supersets).
// Usage : railway run node scripts/inspect-iron-upper.mjs

import pg from 'pg'

const { Pool } = pg
const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

async function run() {
  const client = await pool.connect()
  try {
    // Trouver l'Iron Upper
    const { rows: progs } = await client.query(
      `SELECT id, data->>'name' AS name, data->>'isActive' AS active
       FROM sync_records
       WHERE store = 'programs'
         AND data->>'name' = 'Iron Upper'
         AND (data->>'deleted')::boolean IS NOT TRUE
       ORDER BY (data->>'updatedAt')::bigint DESC
       LIMIT 1`,
    )
    if (!progs.length) { console.log('❌ Iron Upper introuvable.'); return }
    const prog = progs[0]
    console.log(`\n══ Iron Upper (${prog.id.slice(0, 8)}…) — actif: ${prog.active} ══`)

    // Séances
    const { rows: workouts } = await client.query(
      `SELECT id, data->>'name' AS name
       FROM sync_records
       WHERE store = 'workoutTemplates'
         AND data->>'programId' = $1
         AND (data->>'deleted')::boolean IS NOT TRUE
       ORDER BY data->>'name'`,
      [prog.id],
    )

    for (const wt of workouts) {
      console.log(`\n── ${wt.name} ─────────────────────────────────`)

      const { rows: wets } = await client.query(
        `SELECT
           e.data->>'name'                        AS ex_name,
           (w.data->>'order')::int                AS "order",
           w.data->>'supersetGroup'               AS grp,
           (w.data->>'isWarmup')::boolean         AS warmup,
           (w.data->>'isAb')::boolean             AS ab,
           (w.data->>'targetSets')::int           AS sets,
           w.data->>'targetRepsMin'               AS reps,
           w.data->>'targetDurationSec'           AS dur,
           w.data->>'restSec'                     AS rest,
           (w.data->>'autoProgress')::boolean     AS auto
         FROM sync_records w
         JOIN sync_records e ON e.store = 'exercises' AND e.id = w.data->>'exerciseId'
         WHERE w.store = 'workoutExerciseTemplates'
           AND w.data->>'workoutTemplateId' = $1
           AND (w.data->>'deleted')::boolean IS NOT TRUE
         ORDER BY
           CASE WHEN (w.data->>'isWarmup')::boolean THEN 0
                WHEN (w.data->>'isAb')::boolean     THEN 2
                ELSE 1
           END,
           (w.data->>'order')::int`,
        [wt.id],
      )

      let lastSection = null
      for (const r of wets) {
        const section = r.warmup ? 'ÉCHAUFFEMENT' : r.ab ? 'ABDOMINAUX' : 'EXERCICES'
        if (section !== lastSection) {
          console.log(`  [${section}]`)
          lastSection = section
        }
        const grp  = r.grp ? `${r.grp} · ` : ''
        const prog = r.auto ? ' ↑' : ''
        const vol  = r.dur
          ? `${r.sets}×${r.dur}s`
          : `${r.sets}×${r.reps}`
        console.log(`    ${String(r.order).padStart(2)} ${grp}${r.ex_name}  ${vol} repos ${r.rest}s${prog}`)
      }
    }
    console.log('')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
