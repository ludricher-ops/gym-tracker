// Restaure l'image originale du Glute bridge (écrasée par add-finishers-jambes.mjs)
// URL originale trouvée dans populate-media-manual.mjs : Glute-Bridge-.gif
// trackingType original : reps_only (poids du corps)
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()

try {
  for (const userId of [1, 2]) {
    const updatedAt = userId === 1 ? Date.now() : 1
    const data = {
      id: 'seed-glute-bridge',
      name: 'Glute bridge',
      primaryMuscle: 'glutes',
      secondaryMuscles: ['hamstrings', 'core'],
      equipment: 'bodyweight',
      category: 'isolation',
      trackingType: 'reps_only',
      isCustom: false,
      isUnilateral: false,
      isWarmupExercise: true,
      popularity: 2,
      media: {
        type: 'gif',
        url: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif',
        mime: 'image/gif',
        sizeBytes: 0,
        aspectRatio: 1,
        importedAt: 1,
      },
      updatedAt,
      deleted: false,
      createdAt: updatedAt,
    }
    await client.query(
      `UPDATE sync_records
       SET data = $1::jsonb,
           updated_at = $2,
           server_seq = nextval(pg_get_serial_sequence('sync_records','server_seq'))
       WHERE store = 'exercises' AND user_id = $3 AND id = 'seed-glute-bridge'`,
      [JSON.stringify(data), updatedAt, userId],
    )
    console.log(`✅ Glute bridge restauré pour user:${userId} (reps_only, URL originale)`)
  }
  console.log('\n✅ Terminé — synchro ≤ 20 s.')
} finally {
  client.release()
  await pool.end()
}
