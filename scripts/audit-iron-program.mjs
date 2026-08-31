import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

const { rows: progs } = await client.query(`
  SELECT id, data->>'name' AS name, data->>'goal' AS goal, data->>'level' AS level, data->>'durationWeeks' AS weeks
  FROM sync_records WHERE store='programs' AND user_id=1 AND data->>'name' ILIKE '%iron%' AND (data->>'deleted')::boolean IS NOT TRUE
`)

for (const prog of progs) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`PROGRAMME : ${prog.name} | ${prog.goal} | ${prog.level} | ${prog.weeks} sem.`)
  console.log('='.repeat(60))

  const { rows: wts } = await client.query(`
    SELECT id, data->>'name' AS name, data->>'type' AS type
    FROM sync_records WHERE store='workoutTemplates' AND user_id=1 AND data->>'programId'=$1 AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY data->>'name'
  `, [prog.id])

  for (const wt of wts) {
    const { rows: wets } = await client.query(`
      SELECT e.data->>'name' AS ex,
             w.data->>'targetSets' AS sets,
             w.data->>'targetRepsMin' AS rmin,
             w.data->>'targetRepsMax' AS rmax,
             w.data->>'targetDurationSec' AS dur,
             w.data->>'supersetGroup' AS ss,
             w.data->>'isWarmup' AS warmup,
             w.data->>'isAb' AS ab,
             w.data->>'trackingType' AS tracking,
             e.data->>'primaryMuscle' AS muscle
      FROM sync_records w
      JOIN sync_records e ON e.store='exercises' AND e.user_id=1 AND e.id=w.data->>'exerciseId'
      WHERE w.store='workoutExerciseTemplates' AND w.user_id=1
        AND w.data->>'workoutTemplateId'=$1 AND (w.data->>'deleted')::boolean IS NOT TRUE
      ORDER BY (w.data->>'order')::int
    `, [wt.id])

    console.log(`\n--- ${wt.name} (${wt.type}) ---`)
    for (const wet of wets) {
      const reps = wet.dur ? `${wet.dur}s` : wet.rmax && wet.rmax !== wet.rmin ? `${wet.rmin}-${wet.rmax} reps` : `${wet.rmin} reps`
      const ss = wet.ss ? ` [SS-${wet.ss}]` : ''
      const tag = wet.warmup === 'true' ? ' [échauff]' : wet.ab === 'true' ? ' [ab]' : ''
      console.log(`  ${wet.ex} — ${wet.sets}×${reps}${ss}${tag}  (${wet.muscle})`)
    }
  }
}

client.release(); await pool.end()
