// Compare le programme Iron Upper actif (user:1, isTemplate=false, isActive=true)
// avec le template Iron Upper (user:1, isTemplate=true)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

try {
  // ── Récupérer les deux programmes pour user:1 ─────────────────────────────
  const { rows: progs } = await client.query(`
    SELECT id,
           data->>'name'          AS name,
           (data->>'isTemplate')::boolean AS is_template,
           (data->>'isActive')::boolean   AS is_active,
           data->>'weekTemplate'  AS week_template,
           data->>'sessionsPerWeek' AS spw,
           data->>'durationWeeks'  AS dur
    FROM sync_records
    WHERE store = 'programs' AND user_id = 1
      AND data->>'name' ILIKE '%iron upper%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY is_template
  `)

  const active   = progs.find(p => !p.is_template)
  const template = progs.find(p => p.is_template)

  if (!active)   { console.log('❌ Pas de programme actif Iron Upper trouvé'); process.exit(1) }
  if (!template) { console.log('❌ Pas de template Iron Upper trouvé'); process.exit(1) }

  console.log(`Programme actif  : ${active.id}`)
  console.log(`Template         : ${template.id}`)
  console.log(`sessionsPerWeek  : actif=${active.spw}  template=${template.spw}`)
  console.log(`durationWeeks    : actif=${active.dur}  template=${template.dur}`)

  // ── Récupérer WTs + WETs pour chaque programme ───────────────────────────
  async function getWTs(programId) {
    const { rows } = await client.query(`
      SELECT id, data->>'name' AS name, data->>'type' AS type,
             data->>'icon' AS icon
      FROM sync_records
      WHERE store = 'workoutTemplates' AND user_id = 1
        AND data->>'programId' = $1
        AND (data->>'deleted')::boolean IS NOT TRUE
      ORDER BY name
    `, [programId])
    return rows
  }

  async function getWETs(wtId) {
    const { rows } = await client.query(`
      SELECT
        s.data->>'exerciseId'    AS ex_id,
        ex.data->>'name'         AS ex_name,
        (s.data->>'order')::int  AS ord,
        s.data->>'targetSets'    AS sets,
        s.data->>'targetRepsMin' AS reps_min,
        s.data->>'targetRepsMax' AS reps_max,
        s.data->>'targetDurationSec' AS dur_sec,
        s.data->>'restSec'       AS rest,
        s.data->>'supersetGroup' AS ss,
        (s.data->>'isWarmup')::boolean AS warmup,
        (s.data->>'isAb')::boolean     AS ab
      FROM sync_records s
      LEFT JOIN sync_records ex
        ON ex.store = 'exercises' AND ex.user_id = 1
        AND ex.id = s.data->>'exerciseId'
      WHERE s.store = 'workoutExerciseTemplates' AND s.user_id = 1
        AND s.data->>'workoutTemplateId' = $1
        AND (s.data->>'deleted')::boolean IS NOT TRUE
      ORDER BY ord
    `, [wtId])
    return rows
  }

  const activeWTs   = await getWTs(active.id)
  const templateWTs = await getWTs(template.id)

  // ── Comparer séance par séance ───────────────────────────────────────────
  const allNames = new Set([...activeWTs.map(w => w.name), ...templateWTs.map(w => w.name)])

  let totalDiffs = 0

  for (const name of [...allNames].sort()) {
    const aWT = activeWTs.find(w => w.name === name)
    const tWT = templateWTs.find(w => w.name === name)

    console.log(`\n${'─'.repeat(60)}`)
    console.log(`Séance : "${name}"`)

    if (!aWT) { console.log('  ⚠️  Présent dans template uniquement'); totalDiffs++; continue }
    if (!tWT) { console.log('  ⚠️  Présent dans actif uniquement (ajout postérieur)'); continue }

    if (aWT.icon !== tWT.icon) {
      console.log(`  icon : actif="${aWT.icon ?? '—'}"  template="${tWT.icon ?? '—'}"`)
      totalDiffs++
    }

    const aWETs = await getWETs(aWT.id)
    const tWETs = await getWETs(tWT.id)

    // Map par nom d'exercice
    const aMap = Object.fromEntries(aWETs.map(e => [e.ex_name ?? e.ex_id, e]))
    const tMap = Object.fromEntries(tWETs.map(e => [e.ex_name ?? e.ex_id, e]))
    const allEx = new Set([...Object.keys(aMap), ...Object.keys(tMap)])

    let seanceDiffs = 0
    for (const ex of [...allEx].sort()) {
      const a = aMap[ex]
      const t = tMap[ex]
      const diffs = []
      if (!a) { diffs.push('absent du clone actif') }
      else if (!t) { diffs.push('ajouté au clone (absent du template)') }
      else {
        if (a.sets     !== t.sets)     diffs.push(`sets: actif=${a.sets} tmpl=${t.sets}`)
        if (a.reps_min !== t.reps_min) diffs.push(`repsMin: actif=${a.reps_min} tmpl=${t.reps_min}`)
        if (a.reps_max !== t.reps_max) diffs.push(`repsMax: actif=${a.reps_max} tmpl=${t.reps_max}`)
        if (a.dur_sec  !== t.dur_sec)  diffs.push(`durSec: actif=${a.dur_sec} tmpl=${t.dur_sec}`)
        if (a.rest     !== t.rest)     diffs.push(`rest: actif=${a.rest}s tmpl=${t.rest}s`)
        if (a.ss       !== t.ss)       diffs.push(`superset: actif=${a.ss ?? '—'} tmpl=${t.ss ?? '—'}`)
        if (a.ord      !== t.ord)      diffs.push(`order: actif=${a.ord} tmpl=${t.ord}`)
      }
      if (diffs.length > 0) {
        console.log(`  [${ex}] ${diffs.join(' | ')}`)
        seanceDiffs++
      }
    }
    if (seanceDiffs === 0) console.log('  ✅ Identique')
    totalDiffs += seanceDiffs
  }

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`Total différences : ${totalDiffs}`)
} finally {
  client.release()
  await pool.end()
}
