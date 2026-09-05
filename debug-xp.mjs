import pg from 'pg'
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const USER = 1
// Septembre 2026
const SEP_START = Date.UTC(2026, 8, 1)   // 1756684800000
const SEP_END   = Date.UTC(2026, 9, 1) - 1

console.log(`Bornes septembre : ${SEP_START} → ${SEP_END}`)

// 1. Combien de séries de travail complétées en septembre ?
const { rows: [sets] } = await pool.query(`
  SELECT
    COUNT(*)::int AS total_sets,
    COUNT(*) FILTER (WHERE (data->>'deleted')::boolean = true)::int AS deleted_sets,
    COUNT(*) FILTER (WHERE (data->>'isWarmup')::boolean = true)::int AS warmup_sets,
    COUNT(*) FILTER (WHERE data->>'completedAt' IS NOT NULL
      AND (data->>'completedAt')::bigint BETWEEN $2 AND $3)::int AS sep_sets
  FROM sync_records
  WHERE user_id = $1 AND store = 'sets'
`, [USER, SEP_START, SEP_END])
console.log('\nSéries user 1 :', sets)

// 2. XP brut en septembre (sans filtre deleted)
const { rows: [xpRaw] } = await pool.query(`
  SELECT COALESCE(SUM(
    CASE
      WHEN (data->>'isWarmup')::boolean = true THEN 0
      WHEN data->>'completedAt' IS NULL THEN 0
      ELSE
        CASE WHEN (data->>'weightKg')::float > 0
          THEN GREATEST(1, floor((data->>'weightKg')::float * (data->>'reps')::int / 10))
               + CASE WHEN (data->>'weightKg')::float >= 80
                   THEN floor((data->>'weightKg')::float * (data->>'reps')::int / 20) ELSE 0 END
          ELSE (data->>'reps')::int * 3 END
        + CASE WHEN (data->>'isPersonalRecord')::boolean = true THEN 150 ELSE 0 END
    END
  ), 0)::int AS xp
  FROM sync_records
  WHERE user_id = $1 AND store = 'sets'
    AND data->>'completedAt' IS NOT NULL
    AND (data->>'completedAt')::bigint BETWEEN $2 AND $3
`, [USER, SEP_START, SEP_END])
console.log('\nXP sets septembre (sans filtre deleted):', xpRaw.xp)

// 3. XP brut en septembre (AVEC filtre deleted)
const { rows: [xpFiltered] } = await pool.query(`
  SELECT COALESCE(SUM(
    CASE
      WHEN (data->>'isWarmup')::boolean = true THEN 0
      WHEN data->>'completedAt' IS NULL THEN 0
      ELSE
        CASE WHEN (data->>'weightKg')::float > 0
          THEN GREATEST(1, floor((data->>'weightKg')::float * (data->>'reps')::int / 10))
               + CASE WHEN (data->>'weightKg')::float >= 80
                   THEN floor((data->>'weightKg')::float * (data->>'reps')::int / 20) ELSE 0 END
          ELSE (data->>'reps')::int * 3 END
        + CASE WHEN (data->>'isPersonalRecord')::boolean = true THEN 150 ELSE 0 END
    END
  ), 0)::int AS xp
  FROM sync_records
  WHERE user_id = $1 AND store = 'sets'
    AND data->>'completedAt' IS NOT NULL
    AND (data->>'deleted')::boolean IS NOT TRUE
    AND (data->>'completedAt')::bigint BETWEEN $2 AND $3
`, [USER, SEP_START, SEP_END])
console.log('XP sets septembre (avec filtre deleted):', xpFiltered.xp)

// 4. Séances en septembre
const { rows: [sess] } = await pool.query(`
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE (data->>'deleted')::boolean = true)::int AS deleted,
    COUNT(*) FILTER (WHERE (data->>'deleted')::boolean IS NOT TRUE
      AND (data->>'endedAt')::bigint BETWEEN $2 AND $3)::int AS sep_sessions,
    COALESCE(SUM(CASE
      WHEN (data->>'deleted')::boolean = true THEN 0
      WHEN (data->>'endedAt')::bigint NOT BETWEEN $2 AND $3 THEN 0
      ELSE 100 +
        CASE WHEN (data->>'endedAt')::bigint - (data->>'startedAt')::bigint > 3600000 THEN 150
             WHEN (data->>'endedAt')::bigint - (data->>'startedAt')::bigint > 2700000 THEN 75
             ELSE 0 END
    END), 0)::int AS sess_xp
  FROM sync_records
  WHERE user_id = $1 AND store = 'sessions'
    AND data->>'endedAt' IS NOT NULL
`, [USER, SEP_START, SEP_END])
console.log('\nSéances user 1 septembre :', sess)

// 5. Total XP all-time AVEC filtre deleted
const { rows: [totalClean] } = await pool.query(`
  SELECT COALESCE(SUM(
    CASE
      WHEN (data->>'isWarmup')::boolean = true THEN 0
      WHEN data->>'completedAt' IS NULL THEN 0
      ELSE
        CASE WHEN (data->>'weightKg')::float > 0
          THEN GREATEST(1, floor((data->>'weightKg')::float * (data->>'reps')::int / 10))
               + CASE WHEN (data->>'weightKg')::float >= 80
                   THEN floor((data->>'weightKg')::float * (data->>'reps')::int / 20) ELSE 0 END
          ELSE (data->>'reps')::int * 3 END
        + CASE WHEN (data->>'isPersonalRecord')::boolean = true THEN 150 ELSE 0 END
    END
  ), 0)::int AS xp
  FROM sync_records
  WHERE user_id = $1 AND store = 'sets'
    AND data->>'completedAt' IS NOT NULL
    AND (data->>'deleted')::boolean IS NOT TRUE
`, [USER])
console.log('\nXP all-time (avec filtre deleted):', totalClean.xp)

// 6. Distribution des completedAt (pour détecter timestamps incorrects)
const { rows: dist } = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE (data->>'completedAt')::bigint < 1000000000000)::int AS old_format,
    COUNT(*) FILTER (WHERE (data->>'completedAt')::bigint >= 1000000000000
      AND (data->>'completedAt')::bigint < 2000000000000)::int AS normal_ms,
    MIN((data->>'completedAt')::bigint) AS min_ts,
    MAX((data->>'completedAt')::bigint) AS max_ts
  FROM sync_records
  WHERE user_id = $1 AND store = 'sets'
    AND data->>'completedAt' IS NOT NULL
    AND (data->>'deleted')::boolean IS NOT TRUE
`, [USER])
console.log('\nDistribution timestamps:', dist[0])

await pool.end()
