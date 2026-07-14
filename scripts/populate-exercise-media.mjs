// Associe un GIF animé (ExerciseDB / RapidAPI) à chaque exercice en base.
// Usage (depuis le dossier gym-tracker) :
//   RAPIDAPI_KEY=xxx railway run node scripts/populate-exercise-media.mjs
//
// Obtenir une clé gratuite : https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
//
// Stratégie : 1 requête par exercice (/exercises/name/{name}?limit=1).
// Le script skippe automatiquement les exercices déjà traités → relance-le
// chaque jour jusqu'à 100 % si le tier gratuit limite le nombre de requêtes.

import pg from 'pg'

const { Pool } = pg
const NOW = Date.now()

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
if (!RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY manquant.')
  console.error('   Obtiens une clé sur https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb')
  console.error('   Puis : RAPIDAPI_KEY=xxx railway run node scripts/populate-exercise-media.mjs')
  process.exit(1)
}

const connString = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL
if (!connString) {
  console.error('❌ DATABASE_PUBLIC_URL ou DATABASE_URL requis.')
  process.exit(1)
}

const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })

// ── Mapping nom français → nom ExerciseDB (anglais, lowercase exact) ─────────
// null  = pas d'équivalent pertinent, on ignore volontairement
// clé absente = exercice inconnu au moment de l'écriture du script
const MAPPING = {
  // Poitrine ──────────────────────────────────────────────────────────────────
  'Développé couché barre':               'barbell bench press',
  'Développé incliné barre':              'barbell incline bench press',
  'Développé décliné barre':             'barbell decline bench press',
  'Développé couché haltères':           'dumbbell bench press',
  'Développé incliné haltères':          'dumbbell incline bench press',
  'Écarté haltères':                     'dumbbell fly',
  'Écarté poulie':                       'cable crossover',
  'Pec deck':                            'pec deck fly',
  'Pompes':                              'push-up',
  'Dips':                                'chest dip',
  // Dos ───────────────────────────────────────────────────────────────────────
  'Tractions':                           'pull-up',
  'Tirage vertical':                     'lat pulldown',
  'Rowing barre':                        'barbell bent over row',
  'Rowing haltère':                      'dumbbell row',
  'Rowing haltère unilatéral (appui sur banc)': 'dumbbell one arm row',
  'Tirage horizontal poulie':            'cable seated row',
  'Rowing T-bar':                        't bar row',
  'Rowing machine':                      null,
  'Soulevé de terre':                    'barbell deadlift',
  'Pull-over haltère':                   'dumbbell pullover',
  "Haussements d'épaules":              'dumbbell shrug',
  // Épaules ───────────────────────────────────────────────────────────────────
  'Développé militaire barre':           'barbell overhead press',
  'Développé épaules haltères':          'dumbbell shoulder press',
  'Développé Arnold':                    'arnold press',
  'Élévations latérales':               'dumbbell lateral raise',
  'Élévations latérales poulie':        'cable lateral raise',
  'Élévations frontales':               'dumbbell front raise',
  'Oiseau (buste penché)':              'dumbbell rear delt fly',
  'Face pull':                           'cable face pull',
  // Biceps ────────────────────────────────────────────────────────────────────
  'Curl barre':                          'barbell curl',
  'Curl haltères':                       'dumbbell biceps curl',
  'Curl marteau':                        'dumbbell hammer curl',
  'Curl pupitre':                        'barbell preacher curl',
  'Curl poulie':                         'cable curl',
  'Curl incliné haltères':              'dumbbell incline curl',
  'Curl concentration':                  'dumbbell concentration curl',
  // Triceps ───────────────────────────────────────────────────────────────────
  'Extension triceps poulie':            'cable triceps pushdown',
  'Extension triceps corde':             'cable rope tricep pushdown',
  'Barre au front':                      'barbell skullcrusher',
  'Extension triceps nuque':             'dumbbell triceps extension',
  'Kickback triceps':                    'dumbbell tricep kickback',
  'Développé couché prise serrée':      'barbell close grip bench press',
  'Dips triceps':                        'triceps dip',
  // Avant-bras ────────────────────────────────────────────────────────────────
  'Curl poignets':                       'barbell wrist curl',
  'Extension poignets':                  'barbell reverse wrist curl',
  // Jambes ────────────────────────────────────────────────────────────────────
  'Squat barre':                         'barbell squat',
  'Squat avant':                         'barbell front squat',
  'Presse à cuisses':                   'leg press',
  'Hack squat':                          'hack squat',
  'Fentes':                              'dumbbell lunge',
  'Squat bulgare':                       'dumbbell bulgarian split squat',
  'Goblet squat':                        'kettlebell goblet squat',
  'Leg extension':                       'leg extension',
  'Soulevé de terre jambes tendues':    'romanian deadlift',
  'Leg curl allongé':                   'lying leg curl',
  'Leg curl assis':                      'seated leg curl',
  'Good morning':                        'barbell good morning',
  'Hip thrust':                          'barbell hip thrust',
  'Abduction hanches':                   'hip abduction',
  'Kickback fessier poulie':            'cable glute kickback',
  'Mollets debout':                      'standing calf raise',
  'Mollets assis':                       'seated calf raise',
  // Core ──────────────────────────────────────────────────────────────────────
  'Crunch':                              'crunch',
  'Planche':                             'plank',
  'Gainage latéral':                    'side plank',
  'Relevé de jambes':                   'leg raise',
  'Russian twist':                       'russian twist',
  'Roulette abdominale':                'ab wheel rollout',
  'Crunch à la poulie':                 'cable crunch',
  'Relevé de jambes suspendu':          'hanging leg raise',
  // Cardio machines — pas de GIF pertinent ───────────────────────────────────
  'Course (tapis)':                      null,
  'Vélo':                                null,
  'Rameur':                              null,
  'Corde à sauter':                      'jump rope',
  'Elliptique':                          null,
  // Échauffement / mobilité ───────────────────────────────────────────────────
  'Jumping jacks':                       'jumping jacks',
  'Mountain climbers':                   'mountain climber',
  'Inchworm':                            'inchworm',
  "World's greatest stretch":           null,
  'Cat-Cow':                             'cat cow stretch',
  'Rotations thoraciques':              'thoracic rotation',
  'Superman':                            'superman',
  'Bird dog':                            'bird dog',
  'Dead bug':                            'dead bug',
  'Glute bridge':                        'glute bridge',
  'Clamshell':                           'clamshell',
  'Hip 90/90':                           null,
  'Leg swings':                          null,
  'Fentes marchées':                    'walking lunge',
  'Squat poids du corps':               'bodyweight squat',
  'Good morning poids du corps':        'good morning',
  "Band pull-apart":                     'band pull apart',
  "Cercles d'épaules":                  null,
  // Nouveaux exercices bodyweight ─────────────────────────────────────────────
  'Burpees':                             'burpee',
  'Pike push-ups':                       'pike push up',
  'Squats sautés':                      'jump squat',
  'Wall sit':                            'wall sit',
  'High knees':                          'high knees',
  'Hollow body':                         'hollow body hold',
  'Rowing inversé (table)':             'australian pull-up',
}

// ── Requête par nom (1 appel API par exercice) ────────────────────────────────

const HEADERS = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
}

async function fetchByName(englishName) {
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(englishName)}?limit=1`
  const res = await fetch(url, { headers: HEADERS })
  if (res.status === 429) return { rateLimited: true }
  if (!res.ok) throw new Error(`ExerciseDB HTTP ${res.status} pour "${englishName}"`)
  const results = await res.json()
  return { exercise: results[0] ?? null }
}

// ── Pause entre requêtes pour ménager le quota ────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Exécution ─────────────────────────────────────────────────────────────────

async function run() {
  const client = await pool.connect()
  try {
    // Rattrapage : bump server_seq pour les exercices qui avaient déjà un GIF
    // mais dont server_seq n'avait pas été incrémenté (ancienne version du script).
    const { rowCount: bumped } = await client.query(
      `UPDATE sync_records
       SET server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
       WHERE store = 'exercises'
         AND data->'media' IS NOT NULL
         AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    if (bumped > 0) console.log(`   📡 Rattrapage : ${bumped} exercice(s) avec GIF → server_seq forcé\n`)

    const { rows } = await client.query(
      `SELECT id, data->>'name' AS name, data
       FROM sync_records
       WHERE store = 'exercises' AND (data->>'deleted')::boolean IS NOT TRUE`,
    )
    console.log(`   ${rows.length} exercices en base.\n`)

    let matched = 0, notFound = 0, skipped = 0, rateLimited = false

    for (const row of rows) {
      if (rateLimited) break

      const frName = row.name
      const engTarget = MAPPING[frName]

      // null = pas de GIF pertinent
      if (engTarget === null) { skipped++; continue }

      // Pas dans le mapping
      if (engTarget === undefined) {
        console.log(`   ⚠️  SANS MAPPING  "${frName}"`)
        skipped++
        continue
      }

      // Déjà un GIF en base → skip
      const existing = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      if (existing.media?.url) {
        console.log(`   ⏭️  DÉJÀ TRAITÉ   "${frName}"`)
        skipped++
        continue
      }

      // Appel API
      const result = await fetchByName(engTarget)

      if (result.rateLimited) {
        console.log(`\n   ⛔ Quota atteint — relance le script demain.`)
        rateLimited = true
        break
      }

      if (!result.exercise) {
        console.log(`   ❌ INTROUVABLE   "${frName}" → "${engTarget}"`)
        notFound++
        await sleep(300)
        continue
      }

      // Mise à jour
      const data = { ...existing }
      data.media = {
        type: 'gif',
        url: result.exercise.gifUrl,
        mime: 'image/gif',
        aspectRatio: 1,
        sizeBytes: 0,
        importedAt: NOW,
      }
      data.updatedAt = NOW

      await client.query(
        `UPDATE sync_records
         SET data = $1, updated_at = $2,
             server_seq = nextval(pg_get_serial_sequence('sync_records', 'server_seq'))
         WHERE store = 'exercises' AND id = $3`,
        [JSON.stringify(data), NOW, row.id],
      )

      console.log(`   ✅ ${frName}`)
      matched++
      await sleep(300) // 300 ms entre chaque requête
    }

    const remaining = rows.filter((r) => {
      const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
      return MAPPING[r.name] && MAPPING[r.name] !== null && !d.media?.url
    }).length - (rateLimited ? matched : 0)

    console.log(`
── Résultat ──────────────────────────────────────────
   ✅ ${matched}  exercices mis à jour avec un GIF
   ❌ ${notFound}  introuvables dans ExerciseDB
   ⚪ ${skipped}  ignorés (déjà traités, cardio, sans mapping)
${rateLimited ? `   ⏳ ~${remaining} restants — relance demain\n` : ''}
   Lance l'app et attends la synchro automatique (≤ 20 s).`)
  } catch (err) {
    console.error('❌ Erreur :', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
