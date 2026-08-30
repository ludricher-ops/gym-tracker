// Corrige les URLs media cassées (404) dans la base de données.
// Contrairement à populate-media-manual.mjs, ce script ÉCRASE les URLs existantes
// pour les exercices explicitement listés ici.
//
// Usage : railway run node scripts/fix-broken-media-urls.mjs

import pg from 'pg'

const { Pool } = pg
const NOW = Date.now()

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) { console.error('❌ DATABASE_PUBLIC_URL requis.'); process.exit(1) }

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

// ── URLs corrigées (vérifiées via navigateur) ─────────────────────────────────
// Valeur null = supprimer le media (URL cassée sans remplaçant connu)
const FIXES = {
  // Jambes
  'Fentes marchées':              'https://fitnessprogramer.com/wp-content/uploads/2023/09/bodyweight-walking-lunge.gif',
  'Squat poids du corps':         'https://fitnessprogramer.com/wp-content/uploads/2021/05/bodyweight-squat-full-version.gif',
  // Fessiers BW
  'Donkey kick':                  'https://fitnessprogramer.com/wp-content/uploads/2021/02/Donkey-Kicks.gif',
  'Fire hydrant':                 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Fire-Hydrant.gif',
  'Fente curtsy':                 'https://fitnessprogramer.com/wp-content/uploads/2023/09/curtsy-lunge.gif',
  'Hip thrust poids du corps':    'https://fitnessprogramer.com/wp-content/uploads/2022/04/bodyweight-hip-thrust.gif',
  // Échauffement / mobilité
  'Cat-Cow':                      'https://fitnessprogramer.com/wp-content/uploads/2021/02/cat-cow.gif',
  // Triceps
  'Barre au front':               'https://fitnessprogramer.com/wp-content/uploads/2021/06/Dumbbell-Skull-Crusher.gif',
  'Extension triceps nuque':      'https://fitnessprogramer.com/wp-content/uploads/2021/04/Cable-Rope-Overhead-Triceps-Extension.gif',
  'Extension triceps corde':      'https://fitnessprogramer.com/wp-content/uploads/2021/06/Rope-Pushdown.gif',
  'Développé couché prise serrée':'https://fitnessprogramer.com/wp-content/uploads/2021/02/Close-Grip-Bench-Press.gif',
  // Épaules / dos
  "Oiseau (buste penché)":        'https://fitnessprogramer.com/wp-content/uploads/2021/02/cable-rear-delt-fly.gif',
  'Rowing haltère':               'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif',
  // Pectoraux
  'Dips':                         'https://fitnessprogramer.com/wp-content/uploads/2021/06/Chest-Dips.gif',
  'Développé incliné haltères':   'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif',
  'Développé couché haltères':    'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press-1.gif',
  // Cardio machines
  'Course (tapis)':               'https://fitnessprogramer.com/wp-content/uploads/2021/06/Treadmill-.gif',
  'Vélo':                         'https://fitnessprogramer.com/wp-content/uploads/2021/06/Bike.gif',
  'Rameur':                       'https://fitnessprogramer.com/wp-content/uploads/2021/06/Rowing-Machine.gif',
  'Elliptique':                   'https://fitnessprogramer.com/wp-content/uploads/2021/10/Elliptical-Machine.gif',
  // Fessiers poulie
  'Kickback fessier poulie':      'https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Hip-Extension.gif',
  // Abdos nouveaux
  'Ciseaux abdominaux':           'https://fitnessprogramer.com/wp-content/uploads/2022/12/Leg-Scissors.gif',
  'Touche talons alternés':       'https://fitnessprogramer.com/wp-content/uploads/2021/02/Heel-Touch.gif',
  // URL introuvable → supprimer le media cassé (affichera le placeholder musculaire)
  'Gainage latéral':              null,
  'Clamshell':                    null,
  'Crunch jambes verticales':     null,
  'Rotations thoraciques':        null,
  "World's greatest stretch":     null,
  'Rowing machine':               null,
}

async function run() {
  const client = await pool.connect()
  try {
    // Charger tous les exercices avec leur URL actuelle
    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name, data->'media'->>'url' AS url
       FROM sync_records
       WHERE store = 'exercises'
         AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    console.log(`   ${rows.length} exercices en base.\n`)

    let updated = 0, cleared = 0, skipped = 0

    for (const row of rows) {
      const newUrl = FIXES[row.name]
      if (newUrl === undefined) {
        // Pas dans la liste des corrections → ignorer
        skipped++
        continue
      }

      if (newUrl === null) {
        // Supprimer le media (URL cassée sans remplaçant)
        await client.query(
          `UPDATE sync_records
           SET data = (data - 'media') || jsonb_build_object('updatedAt', $1::bigint),
               updated_at = $1,
               server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
           WHERE store = 'exercises' AND id = $2`,
          [NOW, row.id],
        )
        console.log(`   🗑️  "${row.name}" → media supprimé (URL cassée)`)
        cleared++
      } else {
        // Mettre à jour avec la bonne URL
        const type = newUrl.endsWith('.gif') ? 'gif' : 'photo'
        const mime = newUrl.endsWith('.gif') ? 'image/gif' : 'image/png'
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
            JSON.stringify({ type, url: newUrl, mime, aspectRatio: 1, sizeBytes: 0, importedAt: NOW }),
            NOW,
            row.id,
          ],
        )
        console.log(`   ✅ "${row.name}"`)
        updated++
      }
    }

    console.log(`
── Résultat ──────────────────────────────────────────
   ✅ ${updated}  URLs corrigées
   🗑️  ${cleared}  medias supprimés (URL introuvable → placeholder)
   ○  ${skipped}  exercices non concernés

   Lance l'app et attends la synchro automatique (≤ 20 s).`)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
