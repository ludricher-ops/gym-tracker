// Associe des URLs de GIFs/images à tous les exercices sans media.
// Sources : fitnessprogramer.com, docteur-fitness.com (mêmes sources que les
// URLs déjà saisies manuellement par l'utilisateur).
//
// Usage : railway run node scripts/populate-media-manual.mjs

import pg from 'pg'

const { Pool } = pg
const NOW = Date.now()

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

// ── Mapping complet : nom français → URL directe du GIF/image ────────────────
const URLS = {
  // Poids du corps / Cardio ─────────────────────────────────────────────────
  'Dips':                           'https://www.docteur-fitness.com/wp-content/uploads/2000/01/dips-pectoraux.gif',
  'Squats sautés':                  'https://fitnessprogramer.com/wp-content/uploads/2021/02/Jump-Squat.gif',
  'Burpees':                        'https://fitnessprogramer.com/wp-content/uploads/2021/02/burpees.gif',
  'Good morning poids du corps':    'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Good-Morning.gif',
  'Dead bug':                       'https://fitnessprogramer.com/wp-content/uploads/2021/05/Dead-Bug.gif',
  'Mountain climbers':              'https://fitnessprogramer.com/wp-content/uploads/2021/02/Mountain-climber.gif',
  'Pompes':                         'https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif',
  'Pike push-ups':                  'https://fitnessprogramer.com/wp-content/uploads/2021/06/Pike-Push-up.gif',
  'Wall sit':                       'https://fitnessprogramer.com/wp-content/uploads/2021/06/Wall-Sit.png',
  'High knees':                     'https://fitnessprogramer.com/wp-content/uploads/2021/09/Run-in-Place.gif',
  'Hollow body':                    'https://fitnessprogramer.com/wp-content/uploads/2021/02/HollowHold.png',
  'Inchworm':                       'https://fitnessprogramer.com/wp-content/uploads/2022/01/Inchworm.gif',
  'Bird dog':                       'https://fitnessprogramer.com/wp-content/uploads/2022/07/Bird-Dog.gif',
  'Jumping jacks':                  'https://fitnessprogramer.com/wp-content/uploads/2021/05/Jumping-jack.gif',
  'Corde à sauter':                 'https://fitnessprogramer.com/wp-content/uploads/2023/10/Skip-Jump-Rope.gif',
  // Abdos ───────────────────────────────────────────────────────────────────
  'Crunch':                         'https://fitnessprogramer.com/wp-content/uploads/2015/11/Crunch.gif',
  'Planche':                        'https://fitnessprogramer.com/wp-content/uploads/2021/02/plank.gif',
  'Relevé de jambes':               'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Leg-Raise.gif',
  'Roulette abdominale':            'https://fitnessprogramer.com/wp-content/uploads/2021/06/Ab-Wheel-Rollout.gif',
  'Crunch à la poulie':             'https://fitnessprogramer.com/wp-content/uploads/2021/09/Standing-Cable-Crunch.gif',
  'Relevé de jambes suspendu':      'https://fitnessprogramer.com/wp-content/uploads/2021/08/Hanging-Leg-Raises.gif',
  // Dos ─────────────────────────────────────────────────────────────────────
  'Tractions':                      'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif',
  'Tirage vertical':                'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif',
  'Tirage horizontal poulie':       'https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif',
  'Rowing barre':                   'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif',
  'Rowing T-bar':                   'https://fitnessprogramer.com/wp-content/uploads/2021/04/t-bar-rows.gif',
  'Rowing inversé (table)':         'https://fitnessprogramer.com/wp-content/uploads/2021/06/Inverted-Row.gif',
  'Soulevé de terre':               'https://www.docteur-fitness.com/wp-content/uploads/2021/12/souleve-de-terre.gif',
  "Haussements d'épaules":         'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shrug.gif',
  'Superman':                       'https://fitnessprogramer.com/wp-content/uploads/2021/02/Superman-exercise.gif',
  // Pectoraux ───────────────────────────────────────────────────────────────
  'Développé couché barre':         'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',
  'Développé incliné barre':        'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Barbell-Bench-Press.gif',
  'Développé décliné barre':       'https://fitnessprogramer.com/wp-content/uploads/2021/03/Decline-Barbell-Bench-Press.gif',
  'Écarté poulie':                  'https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crossover.gif',
  // Épaules ─────────────────────────────────────────────────────────────────
  'Développé militaire barre':      'https://fitnessprogramer.com/wp-content/uploads/2021/07/Barbell-Standing-Military-Press.gif',
  'Développé épaules haltères':     'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif',
  'Développé Arnold':               'https://fitnessprogramer.com/wp-content/uploads/2021/02/Arnold-Press.gif',
  'Élévations frontales':           'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Front-Raise.gif',
  'Face pull':                      'https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif',
  // Biceps ──────────────────────────────────────────────────────────────────
  'Curl barre':                     'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif',
  'Curl pupitre':                   'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Preacher-Curl.gif',
  'Curl concentration':             'https://fitnessprogramer.com/wp-content/uploads/2021/02/Concentration-Curl.gif',
  // Triceps ─────────────────────────────────────────────────────────────────
  'Kickback triceps':               'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Kickback.gif',
  'Extension triceps poulie':       'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif',
  'Barre au front':                 'https://fitnessprogramer.com/wp-content/uploads/2021/02/EZ-Bar-Skull-Crusher.gif',
  'Extension triceps nuque':        'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Tricep-Extension.gif',
  'Développé couché prise serrée':  'https://fitnessprogramer.com/wp-content/uploads/2021/02/Close-Grip-Barbell-Bench-Press.gif',
  'Dips triceps':                   'https://www.docteur-fitness.com/wp-content/uploads/2021/09/dips-sur-banc.gif',
  'Extension triceps corde':        'https://fitnessprogramer.com/wp-content/uploads/2021/07/Cable-Rope-Tricep-Pushdown.gif',
  // Avant-bras ──────────────────────────────────────────────────────────────
  'Extension poignets':             'https://fitnessprogramer.com/wp-content/uploads/2021/02/Reverse-Wrist-Curl.gif',
  'Curl poignets':                  'https://fitnessprogramer.com/wp-content/uploads/2021/02/barbell-Wrist-Curl.gif',
  // Jambes ──────────────────────────────────────────────────────────────────
  'Squat barre':                    'https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif',
  'Squat avant':                    'https://fitnessprogramer.com/wp-content/uploads/2021/06/front-squat.gif',
  'Goblet squat':                   'https://fitnessprogramer.com/wp-content/uploads/2023/01/Dumbbell-Goblet-Squat.gif',
  'Squat bulgare':                  'https://fitnessprogramer.com/wp-content/uploads/2022/02/Bodyweight-Bulgarian-Split-Squat.gif',
  'Hack squat':                     'https://fitnessprogramer.com/wp-content/uploads/2021/02/Sled-Hack-Squat.gif',
  'Fentes':                         'https://fitnessprogramer.com/wp-content/uploads/2023/10/Static-Lunge.gif',
  'Fentes marchées':                'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lunge.gif',
  'Presse à cuisses':              'https://fitnessprogramer.com/wp-content/uploads/2015/11/Leg-Press.gif',
  'Leg extension':                  'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif',
  'Leg curl allongé':               'https://fitnessprogramer.com/wp-content/uploads/2022/04/Lying-Dumbbell-Leg-Curl.gif',
  'Leg curl assis':                 'https://fitnessprogramer.com/wp-content/uploads/2021/08/Seated-Leg-Curl.gif',
  'Soulevé de terre jambes tendues':'https://www.docteur-fitness.com/wp-content/uploads/2022/04/souleve-de-terre-jambes-tendues.gif',
  'Good morning':                   'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Good-Morning.gif',
  // Fessiers ────────────────────────────────────────────────────────────────
  'Glute bridge':                   'https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif',
  'Hip thrust':                     'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif',
  'Abduction hanches':              'https://fitnessprogramer.com/wp-content/uploads/2021/05/Standing-Hip-Abduction-1.gif',
  'Kickback fessier poulie':        'https://fitnessprogramer.com/wp-content/uploads/2021/02/Standing-Cable-Hip-Extension.gif',
  // Mollets ─────────────────────────────────────────────────────────────────
  'Mollets debout':                 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Standing-Calf-Raise.gif',
  'Mollets assis':                  'https://fitnessprogramer.com/wp-content/uploads/2021/06/Lever-Seated-Calf-Raise.gif',
  // Échauffement / mobilité ─────────────────────────────────────────────────
  'Glute bridge':                   'https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif',
  'Clamshell':                      'https://fitnessprogramer.com/wp-content/uploads/2021/02/Clamshell.gif',
  'Cat-Cow':                        'https://fitnessprogramer.com/wp-content/uploads/2021/02/Cat-Cow-Stretch.gif',
  'Squat poids du corps':           'https://fitnessprogramer.com/wp-content/uploads/2021/02/Air-Squat.gif',
}

// ── Exécution ─────────────────────────────────────────────────────────────────

async function run() {
  const client = await pool.connect()
  try {
    // 1. Charger tous les exercices
    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name, data->'media' AS media
       FROM sync_records
       WHERE store = 'exercises' AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    console.log(`   ${rows.length} exercices en base.\n`)

    let updated = 0, skipped = 0, noMapping = 0

    for (const row of rows) {
      const frName = row.name
      const url = URLS[frName]

      if (!url) {
        noMapping++
        continue
      }

      // Déjà une URL valide → skip
      const existingUrl = row.media ? (row.media.url ?? null) : null
      if (existingUrl) {
        skipped++
        continue
      }

      // Détermine le type à partir de l'extension
      const type = url.endsWith('.gif') ? 'gif' : 'photo'
      const mime = url.endsWith('.gif') ? 'image/gif' : 'image/png'

      await client.query(
        `UPDATE sync_records
         SET data = jsonb_set(
               jsonb_set(data, '{media}', $1::jsonb),
               '{updatedAt}', to_jsonb($2::bigint)
             ),
             updated_at = $2,
             server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
         WHERE store = 'exercises' AND id = $3`,
        [
          JSON.stringify({ type, url, mime, aspectRatio: 1, sizeBytes: 0, importedAt: NOW }),
          NOW,
          row.id,
        ],
      )

      console.log(`   ✅ ${frName}`)
      updated++
    }

    console.log(`
── Résultat ──────────────────────────────────────────
   ✅ ${updated}  exercices mis à jour
   ⏭️  ${skipped}  déjà traités (URL existante conservée)
   ○  ${noMapping}  sans mapping (pas de GIF référencé)

   Lance l'app et attends la synchro automatique (≤ 20 s).`)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
