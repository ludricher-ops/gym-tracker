import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: 'postgresql://postgres:GSjxCCiPcnLMMROqkRpNzjoBrRUYYqTs@autorack.proxy.rlwy.net:29368/railway',
  ssl: { rejectUnauthorized: false }
})

const { rows: users } = await pool.query(
  `SELECT id, data->>'email' AS email, data->>'name' AS name
   FROM sync_records WHERE store = 'users' ORDER BY id`
)
console.log('USERS:' + JSON.stringify(users))

const { rows: programs } = await pool.query(
  `SELECT user_id, id AS program_id, data->>'name' AS program_name,
          data->>'goal' AS goal, data->>'level' AS level,
          data->>'daysPerWeek' AS days, data->>'isActive' AS active
   FROM sync_records
   WHERE store='programs' AND (data->>'deleted')::boolean IS NOT TRUE
   ORDER BY user_id, program_name`
)
console.log('PROGRAMS:' + JSON.stringify(programs))

const { rows: templates } = await pool.query(
  `SELECT user_id, data->>'name' AS tname, data->>'programId' AS pid,
          data->>'splitType' AS stype,
          jsonb_array_length(COALESCE(data->'exercises','[]'::jsonb)) AS nexo
   FROM sync_records
   WHERE store='workoutTemplates' AND (data->>'deleted')::boolean IS NOT TRUE
   ORDER BY user_id, pid, tname`
)
console.log('TEMPLATES:' + JSON.stringify(templates))

await pool.end()
