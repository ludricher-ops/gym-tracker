// Audit des specs des 4 programmes JM vs la périodisation auto.
// Usage : railway run node scripts/audit-jm-specs.mjs
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

// ── 1. Trouver les 4 programmes JM ──────────────────────────────────────────
const { rows: progs } = await client.query(`
  SELECT id, data->>'name' AS name, data->>'durationWeeks' AS weeks
  FROM sync_records
  WHERE store='programs' AND user_id=1
    AND data->>'name' ILIKE '%JM%'
    AND (data->>'deleted')::boolean IS NOT TRUE
  ORDER BY data->>'name'
`)

if (progs.length === 0) {
  console.error('Aucun programme JM trouvé.')
  client.release(); await pool.end(); process.exit(1)
}

console.log(`\n${progs.length} programme(s) JM trouvé(s) :`)
progs.forEach(p => console.log(`  • ${p.name} (${p.weeks} sem.) [${p.id}]`))

// ── 2. Pour chaque programme, récupérer les WTs ──────────────────────────────
for (const prog of progs) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  PROGRAMME : ${prog.name}  (${prog.weeks} semaines)`)
  console.log('═'.repeat(70))

  const { rows: wts } = await client.query(`
    SELECT id, data->>'name' AS name, data->>'dayOfWeek' AS dow
    FROM sync_records
    WHERE store='workoutTemplates' AND user_id=1
      AND data->>'programId'=$1
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY (data->>'dayOfWeek')::int
  `, [prog.id])

  for (const wt of wts) {
    const { rows: wets } = await client.query(`
      SELECT e.data->>'name' AS ex,
             w.data->>'targetSets'    AS sets,
             w.data->>'targetRepsMin' AS rmin,
             w.data->>'targetRepsMax' AS rmax,
             w.data->>'restSec'       AS rest,
             w.data->>'isWarmup'      AS warmup,
             w.data->>'isAb'          AS ab,
             w.data->>'order'         AS ord,
             e.data->>'primaryMuscle' AS muscle
      FROM sync_records w
      JOIN sync_records e ON e.store='exercises' AND e.user_id=1 AND e.id=w.data->>'exerciseId'
      WHERE w.store='workoutExerciseTemplates' AND w.user_id=1
        AND w.data->>'workoutTemplateId'=$1
        AND (w.data->>'deleted')::boolean IS NOT TRUE
      ORDER BY (w.data->>'order')::int
    `, [wt.id])

    const dayName = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][+wt.dow] ?? `J${wt.dow}`
    console.log(`\n  ── ${dayName}. ${wt.name} ──`)
    for (const wet of wets) {
      const reps = wet.rmax && wet.rmax !== wet.rmin ? `${wet.rmin}-${wet.rmax}` : `${wet.rmin}`
      const rest = wet.rest ? ` rest=${wet.rest}s` : ''
      const tag = wet.warmup === 'true' ? ' [échauff]' : wet.ab === 'true' ? ' [ab]' : ''
      console.log(`    ${String(wet.ord).padStart(2)}. ${wet.ex.padEnd(35)} ${wet.sets}×${reps.padEnd(5)}${rest}${tag}  (${wet.muscle})`)
    }
  }
}

// ── 3. Résumé tabulaire par exercice pour comparer les 4 programmes ──────────
console.log(`\n${'═'.repeat(70)}`)
console.log('  RÉSUMÉ COMPARATIF — sets×reps par exercice et par programme')
console.log('═'.repeat(70))

// Collecter toutes les paires exercise→spec pour chaque programme
const byProg = {}
for (const prog of progs) {
  byProg[prog.name] = {}
  const { rows: wets } = await client.query(`
    SELECT e.data->>'name' AS ex,
           w.data->>'targetSets'    AS sets,
           w.data->>'targetRepsMin' AS rmin,
           w.data->>'targetRepsMax' AS rmax,
           w.data->>'isWarmup'      AS warmup
    FROM sync_records w
    JOIN sync_records e ON e.store='exercises' AND e.user_id=1 AND e.id=w.data->>'exerciseId'
    JOIN sync_records wt ON wt.store='workoutTemplates' AND wt.user_id=1 AND wt.id=w.data->>'workoutTemplateId'
    WHERE w.store='workoutExerciseTemplates' AND w.user_id=1
      AND wt.data->>'programId'=$1
      AND (w.data->>'deleted')::boolean IS NOT TRUE
      AND (w.data->>'isWarmup')::boolean IS NOT TRUE
    ORDER BY e.data->>'name'
  `, [prog.id])

  for (const wet of wets) {
    const reps = wet.rmax && wet.rmax !== wet.rmin ? `${wet.rmin}-${wet.rmax}` : `${wet.rmin}`
    byProg[prog.name][wet.ex] = `${wet.sets}×${reps}`
  }
}

// Tous les exercices (union)
const allEx = [...new Set(Object.values(byProg).flatMap(m => Object.keys(m)))].sort()
const progNames = progs.map(p => p.name)
const colW = 14

// Entête
const header = 'Exercice'.padEnd(38) + progNames.map(n => n.slice(-8).padEnd(colW)).join('')
console.log('\n' + header)
console.log('-'.repeat(header.length))

for (const ex of allEx) {
  const cols = progNames.map(n => (byProg[n][ex] ?? '—').padEnd(colW)).join('')
  console.log(ex.padEnd(38) + cols)
}

client.release()
await pool.end()
