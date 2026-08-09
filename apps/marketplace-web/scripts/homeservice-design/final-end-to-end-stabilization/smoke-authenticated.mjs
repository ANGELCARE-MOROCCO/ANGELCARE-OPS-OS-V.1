#!/usr/bin/env node
import fs from 'node:fs'

const baseURL = String(process.env.SERVICE_DESIGN_SMOKE_BASE_URL || '').replace(/\/$/, '')
const storageState = String(process.env.SERVICE_DESIGN_SMOKE_STORAGE_STATE || '')
const categoryCode = String(process.env.SERVICE_DESIGN_SMOKE_CATEGORY_CODE || '')
const mutate = process.env.SERVICE_DESIGN_SMOKE_MUTATE === '1'

if (!baseURL || !storageState || !categoryCode) {
  console.log('NOT_RUN: authenticated Service Design smoke tests require SERVICE_DESIGN_SMOKE_BASE_URL, SERVICE_DESIGN_SMOKE_STORAGE_STATE and SERVICE_DESIGN_SMOKE_CATEGORY_CODE.')
  process.exit(0)
}
if (!fs.existsSync(storageState)) {
  console.log(`NOT_RUN: storage state file not found: ${storageState}`)
  process.exit(0)
}

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.log('NOT_RUN: Playwright is not installed in this repository.')
  process.exit(0)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ storageState, baseURL })
const page = await context.newPage()
const results = []

async function test(label, fn) {
  try { await fn(); results.push({ label, ok: true }); console.log(`PASS  ${label}`) }
  catch (error) { results.push({ label, ok: false, detail: String(error?.message || error) }); console.log(`FAIL  ${label} — ${String(error?.message || error)}`) }
}

await test('authenticated doctrine workspace opens', async () => {
  await page.goto(`${baseURL}/carelink-ops/service-design/standards/doctrine`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /doctrine/i }).first().waitFor()
})

await test('targeted import opens as a visible drawer', async () => {
  await page.getByRole('button', { name: /importer une ressource/i }).click()
  await page.getByText('Import ciblé immédiat').waitFor()
  await page.getByText('Déposez votre CSV ici').waitFor()
  await page.getByRole('button', { name: /fermer l’import/i }).click()
})

await test('multi-mission category studio preserves direct composition journey', async () => {
  await page.goto(`${baseURL}/carelink-ops/service-design/factory/category/${encodeURIComponent(categoryCode)}?mode=multi_mission`, { waitUntil: 'networkidle' })
  await page.getByText('Continuité du brouillon').waitFor()
  await page.getByRole('button', { name: /enregistrer & composer/i }).waitFor()
  await page.getByText(/aucun circuit de validation n’est requis/i).waitFor()
})

await test('action centre and premium feedback surfaces are mounted', async () => {
  await page.getByRole('button', { name: /ouvrir le centre des actions service design/i }).waitFor()
})

if (mutate) {
  await test('save draft persists without an approval detour', async () => {
    await page.getByRole('button', { name: /enregistrer maintenant/i }).click()
    await page.getByText(/brouillon est sauvegardé/i).waitFor({ timeout: 45_000 })
  })
} else {
  console.log('NOT_RUN: mutation smoke step skipped. Set SERVICE_DESIGN_SMOKE_MUTATE=1 to exercise real draft persistence.')
}

await browser.close()
const failed = results.filter((item) => !item.ok)
console.log(`\n${results.length - failed.length}/${results.length} authenticated browser smoke checks passed.`)
if (failed.length) process.exit(1)
