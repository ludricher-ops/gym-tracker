import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL??process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} })
const client = await pool.connect()
const NOW = Date.now()
try {
  // Les deux exercices burpee pour user:1
  const { rows: exs } = await client.query(`
    SELECT id, data->>'name' AS name FROM sync_records
    WHERE store='exercises' AND user_id=1
      AND data->>'name' ILIKE 'burpee%'
      AND (data->>'deleted')::boolean IS NOT TRUE
    ORDER BY data->>'name'
  `)
  console.log(`Exercices burpee trouvés :`)
  for (const e of exs) console.log(`  id:${e.id}  nom:"${e.name}"`)

  // Vérifier lesquels sont utilisés dans des WETs
  for (const e of exs) {
    const { rows: wets } = await client.query(`
      SELECT COUNT(*) AS n FROM sync_records
      WHERE store='workoutExerciseTemplates'
        AND data->>'exerciseId'=$1
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [e.id])
    console.log(`  → "${e.name}" utilisé dans ${wets[0].n} WET(s)`)
  }

  // Supprimer celui avec le moins d'utilisation (ou le doublon "Burpee" si "Burpees" est le bon)
  // Règle : garder celui avec le plus d'utilisation ; en cas d'égalité, garder "Burpees" (avec s)
  if (exs.length < 2) { console.log('Moins de 2 burpees trouvés, rien à faire.'); process.exit(0) }

  const counts = await Promise.all(exs.map(async e => {
    const { rows } = await client.query(`
      SELECT COUNT(*) AS n FROM sync_records
      WHERE store='workoutExerciseTemplates'
        AND data->>'exerciseId'=$1
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [e.id])
    return { ...e, n: parseInt(rows[0].n) }
  }))

  // Garder celui avec le plus de WETs ; si égal, garder "Burpees" (le seed officiel)
  counts.sort((a, b) => b.n - a.n || (a.name === 'Burpees' ? -1 : 1))
  const keep   = counts[0]
  const remove = counts[1]

  if (remove.n > 0) {
    console.log(`\n⚠️  "${remove.name}" (${remove.id}) est utilisé dans ${remove.n} WET(s) — on pointe vers "${keep.name}" avant de supprimer`)
    await client.query(`
      UPDATE sync_records
      SET data = jsonb_set(jsonb_set(data, '{exerciseId}', to_jsonb($1::text)), '{updatedAt}', to_jsonb($2::bigint)),
          updated_at=$2, server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
      WHERE store='workoutExerciseTemplates'
        AND data->>'exerciseId'=$3
        AND (data->>'deleted')::boolean IS NOT TRUE
    `, [keep.id, NOW, remove.id])
    console.log(`  ✅ WETs réorientés vers "${keep.name}"`)
  }

  // Tombstoner le doublon
  await client.query(`
    UPDATE sync_records
    SET data = jsonb_set(jsonb_set(data, '{deleted}', 'true'::jsonb), '{updatedAt}', to_jsonb($1::bigint)),
        updated_at=$1, server_seq=nextval(pg_get_serial_sequence('sync_records','server_seq'))
    WHERE store='exercises' AND user_id=1 AND id=$2
  `, [NOW, remove.id])
  console.log(`\n✅ "${remove.name}" (${remove.id}) supprimé — conservé : "${keep.name}" (${keep.id})`)
  console.log('Synchro dans ≤ 20 s.')
} finally { client.release(); await pool.end() }
