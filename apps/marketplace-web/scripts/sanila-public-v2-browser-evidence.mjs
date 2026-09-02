import fs from 'node:fs/promises'
import path from 'node:path'

const base = (process.env.SANILA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const outDir = process.env.SANILA_EVIDENCE_DIR || path.resolve('sanila-institutional-browser-evidence')
const storageState = process.env.SANILA_STORAGE_STATE || undefined

let chromium
try { ({ chromium } = await import('playwright')) }
catch { console.error('RUNTIME_EVIDENCE_REQUIRED: Playwright is not installed. Run in the real repository/runtime.'); process.exit(2) }

const publicRoutes = ['', 'produit', 'fonctionnalites', 'direction', 'administration', 'admissions', 'presences', 'pedagogie', 'finance', 'paie', 'transport', 'communication', 'bibliotheque', 'inventaire', 'reclamations', 'rapports', 'solutions', 'solutions/creches-maternelles', 'solutions/ecoles-privees', 'solutions/groupes-scolaires', 'securite', 'mise-en-service', 'tarifs', 'ressources', 'faq', 'demonstration', 'contact', 'creer-mon-etablissement', 'connexion']
const major = new Set(['', 'produit', 'direction', 'admissions', 'pedagogie', 'finance', 'transport', 'securite', 'mise-en-service', 'demonstration', 'contact', 'creer-mon-etablissement', 'connexion'])
const genericCollisionRoutes = ['accueil','produit','finance','tarifs','solutions','ressources','administration','transport','admissions']
const authenticated = [
  '/angelcare-360-command-center/direction', '/angelcare-360-command-center/administration', '/angelcare-360-command-center/admissions', '/angelcare-360-command-center/presences', '/angelcare-360-command-center/academique', '/angelcare-360-command-center/finance', '/angelcare-360-command-center/transport', '/angelcare-360-command-center/rapports',
  '/angelcare-360-teacher/login', '/angelcare-360-staff/login', '/angelcare-360-parent/login', '/angelcare-360-student/login', '/angelcare-360-access/login', '/angelcare-360-portal/login',
]
const viewports = {
  desktop: { width: 1440, height: 1100 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
}

await fs.rm(outDir, { recursive: true, force: true })
await fs.mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext(storageState ? { storageState } : {})
const page = await context.newPage()
page.setDefaultTimeout(35_000)
const ledger = []
const consoleErrors = []
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', (error) => consoleErrors.push(error.message))

async function visit(route, label, screenshotModes = []) {
  consoleErrors.length = 0
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  const status = response?.status() || 0
  const finalUrl = page.url()
  const title = await page.title()
  const h1 = await page.locator('h1').first().textContent().catch(() => null)
  for (const mode of screenshotModes) {
    await page.setViewportSize(viewports[mode])
    await page.screenshot({ path: path.join(outDir, `${label}__${mode}.png`), fullPage: true })
  }
  ledger.push({ route, status, finalUrl, title, h1, consoleErrors: [...consoleErrors] })
  return { status, finalUrl, title, h1 }
}

// Root constitution first.
await visit('/', 'marketplace-root', ['desktop','mobile'])
await visit('/angelcare-marketplace/fr', 'marketplace-fr', ['desktop','mobile'])

// SANILA estate.
for (const slug of publicRoutes) {
  const route = `/angelcare-marketplace/fr/sanila${slug ? `/${slug}` : ''}`
  const safe = slug ? slug.replaceAll('/', '__') : 'sanila-home'
  const modes = major.has(slug) ? ['desktop','tablet','mobile'] : ['desktop','mobile']
  await visit(route, safe, modes)
}

// Generic Marketplace collision candidates: record identity, never assume they should 404.
for (const slug of genericCollisionRoutes) await visit(`/angelcare-marketplace/fr/${slug}`, `marketplace-generic__${slug}`, [])

if (storageState) {
  for (const route of authenticated) {
    const safe = route.split('/').filter(Boolean).join('__')
    await visit(route, `authenticated__${safe}`, ['desktop'])
  }
} else {
  ledger.push({ kind: 'authenticated', status: 'RUNTIME_EVIDENCE_REQUIRED', reason: 'Set SANILA_STORAGE_STATE to an authorized Playwright storage state. No authenticated screen is fabricated.' })
}

const contactSheet = `<!doctype html><meta charset="utf-8"><title>SANILA Institutional Visual Board</title><style>body{font-family:Arial;margin:0;background:#eef1f5;color:#10243f}header{padding:32px;background:white;position:sticky;top:0;z-index:2;border-bottom:1px solid #dfe5ec}main{padding:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}figure{margin:0;background:white;border:1px solid #dfe5ec;padding:10px}img{display:block;width:100%;height:420px;object-fit:cover;object-position:top;border:1px solid #edf0f4}figcaption{font-size:12px;font-weight:700;padding:10px 2px 2px}</style><header><strong>SANILA Institutional Product Experience — Visual Certification Board</strong></header><main>${(await fs.readdir(outDir)).filter(x=>x.endsWith('__desktop.png')).sort().map(file=>`<figure><img src="${file}"><figcaption>${file.replace('__desktop.png','')}</figcaption></figure>`).join('')}</main>`
await fs.writeFile(path.join(outDir, 'VISUAL_CONTACT_SHEET.html'), contactSheet)
await fs.writeFile(path.join(outDir, 'BROWSER_EVIDENCE_LEDGER.json'), JSON.stringify(ledger, null, 2))
await browser.close()
console.log(`Evidence written to ${outDir}`)
