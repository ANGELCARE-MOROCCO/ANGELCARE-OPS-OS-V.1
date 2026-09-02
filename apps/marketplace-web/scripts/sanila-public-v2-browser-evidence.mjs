import fs from 'node:fs/promises'
import path from 'node:path'

const base = process.env.SANILA_BASE_URL || 'http://localhost:3000'
const outDir = process.env.SANILA_EVIDENCE_DIR || path.resolve('sanila-public-v2-browser-evidence')
const storageState = process.env.SANILA_STORAGE_STATE || undefined

let chromium
try { ({ chromium } = await import('playwright')) }
catch { console.error('RUNTIME_EVIDENCE_REQUIRED: Playwright is not installed in this environment. Run this script in the real repository/runtime after dependencies are available.'); process.exit(2) }

const publicRoutes = [
  '', 'produit', 'fonctionnalites', 'direction', 'administration', 'admissions', 'presences', 'pedagogie', 'finance', 'paie', 'transport', 'communication', 'bibliotheque', 'inventaire', 'reclamations', 'rapports', 'solutions', 'solutions/creches-maternelles', 'solutions/ecoles-privees', 'solutions/groupes-scolaires', 'securite', 'mise-en-service', 'tarifs', 'ressources', 'faq', 'demonstration', 'contact', 'creer-mon-etablissement', 'connexion',
]
const authenticated = [
  '/angelcare-360-command-center/direction',
  '/angelcare-360-command-center/administration',
  '/angelcare-360-command-center/admissions',
  '/angelcare-360-command-center/presences',
  '/angelcare-360-command-center/academique',
  '/angelcare-360-command-center/finance',
  '/angelcare-360-command-center/transport',
  '/angelcare-360-command-center/exports',
]

await fs.mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext(storageState ? { storageState } : {})
const page = await context.newPage()
page.setDefaultTimeout(30_000)
const ledger = []

for (const slug of publicRoutes) {
  const route = `/angelcare-marketplace/fr/sanila${slug ? `/${slug}` : ''}`
  const url = `${base}${route}`
  const response = await page.goto(url, { waitUntil: 'networkidle' })
  const status = response?.status() || 0
  const safe = slug ? slug.replaceAll('/', '__') : 'home'
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.screenshot({ path: path.join(outDir, `${safe}__desktop.png`), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: path.join(outDir, `${safe}__mobile.png`), fullPage: true })
  ledger.push({ kind: 'public', route, status })
}

if (storageState) {
  await page.setViewportSize({ width: 1440, height: 1100 })
  for (const route of authenticated) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
    const status = response?.status() || 0
    const safe = route.split('/').filter(Boolean).join('__')
    await page.screenshot({ path: path.join(outDir, `${safe}__authenticated.png`), fullPage: true })
    ledger.push({ kind: 'authenticated', route, status })
  }
} else {
  ledger.push({ kind: 'authenticated', status: 'RUNTIME_EVIDENCE_REQUIRED', reason: 'Set SANILA_STORAGE_STATE to an authorized Playwright storage state.' })
}

await fs.writeFile(path.join(outDir, 'BROWSER_EVIDENCE_LEDGER.json'), JSON.stringify(ledger, null, 2))
await browser.close()
console.log(`Evidence written to ${outDir}`)
