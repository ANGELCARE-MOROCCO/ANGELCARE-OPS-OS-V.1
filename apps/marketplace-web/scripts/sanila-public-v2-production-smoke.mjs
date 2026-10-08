const apex = (process.env.SANILA_PRODUCTION_ORIGIN || 'https://my.angelcarehub.com').replace(/\/$/, '')
const www = (process.env.SANILA_WWW_ORIGIN || 'https://www.my.angelcarehub.com').replace(/\/$/, '')
const expectedMarketplace = '/angelcare-marketplace/fr'
const publicRoutes = ['', 'produit', 'fonctionnalites', 'direction', 'administration', 'admissions', 'presences', 'pedagogie', 'finance', 'paie', 'transport', 'communication', 'bibliotheque', 'inventaire', 'reclamations', 'rapports', 'solutions', 'solutions/creches-maternelles', 'solutions/ecoles-privees', 'solutions/groupes-scolaires', 'securite', 'mise-en-service', 'tarifs', 'ressources', 'faq', 'demonstration', 'contact', 'creer-mon-etablissement', 'connexion']
const generic = ['accueil','produit','finance','tarifs','solutions','ressources','administration','transport','admissions']
let failed = false
async function check(url, label, predicate = (r)=>r.ok) {
  try {
    const response = await fetch(url, { redirect: 'follow' })
    const body = await response.text()
    const finalUrl = response.url
    const ok = predicate(response, body, finalUrl)
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label} status=${response.status} final=${finalUrl}`)
    if (!ok) failed = true
    return { response, body, finalUrl }
  } catch (error) { console.error(`FAIL ${label} ${error.message}`); failed = true; return null }
}

console.log('=== ROOT AUTHORITY ===')
await check(`${apex}/`, 'apex root -> Marketplace', (r,b,u)=>r.ok && new URL(u).pathname === expectedMarketplace && !/SANILA Operating System/i.test(b.slice(0,12000)))
await check(`${www}/`, 'www root -> Marketplace', (r,b,u)=>r.ok && new URL(u).pathname === expectedMarketplace && !/SANILA Operating System/i.test(b.slice(0,12000)))
await check(`${apex}${expectedMarketplace}`, 'Marketplace FR', (r,b)=>r.ok && !/data-page="accueil"|SANILA Operating System/i.test(b.slice(0,16000)))

console.log('=== SANILA ESTATE ===')
for (const slug of publicRoutes) {
  const route = `${expectedMarketplace}/sanila${slug ? `/${slug}` : ''}`
  await check(`${apex}${route}`, `SANILA ${slug || 'home'}`, (r,b)=>r.ok && /SANILA/i.test(b))
}

console.log('=== GENERIC MARKETPLACE COLLISION CANDIDATES ===')
for (const slug of generic) await check(`${apex}${expectedMarketplace}/${slug}`, `generic ${slug} is NOT SANILA`, (r,b)=>r.status < 500 && !/data-page="(accueil|produit|finance|tarifs|solutions|administration|transport|admissions)"/i.test(b))

if (failed) { console.error('SANILA_INSTITUTIONAL_PRODUCTION_SMOKE=FAIL'); process.exit(1) }
console.log('SANILA_INSTITUTIONAL_PRODUCTION_SMOKE=PASS')
