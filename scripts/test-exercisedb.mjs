// Affiche la réponse brute de l'API ExerciseDB pour un exercice.
// Usage : RAPIDAPI_KEY=xxx railway run node scripts/test-exercisedb.mjs

const KEY = process.env.RAPIDAPI_KEY
if (!KEY) { console.error('❌ RAPIDAPI_KEY manquant'); process.exit(1) }

const HEADERS = {
  'X-RapidAPI-Key': KEY,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
}

async function fetchByName(name) {
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`
  console.log(`\n→ GET ${url}\n`)
  const res = await fetch(url, { headers: HEADERS })
  console.log(`   HTTP ${res.status}`)
  const body = await res.json()
  return body
}

async function fetchAll() {
  const url = `https://exercisedb.p.rapidapi.com/exercises?limit=3&offset=0`
  console.log(`\n→ GET ${url}\n`)
  const res = await fetch(url, { headers: HEADERS })
  console.log(`   HTTP ${res.status}`)
  return res.json()
}

const [byName, all] = await Promise.all([
  fetchByName('push-up'),
  fetchAll(),
])

console.log('\n══ Réponse /exercises/name/push-up ══════════════════')
console.log(JSON.stringify(byName, null, 2))

console.log('\n══ Réponse /exercises (3 premiers) ═════════════════')
console.log(JSON.stringify(all, null, 2))
