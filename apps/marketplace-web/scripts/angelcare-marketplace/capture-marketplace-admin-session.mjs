import { chromium } from 'playwright'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.MARKETPLACE_BASE_URL || 'http://localhost:3000'
const statePath = process.env.MARKETPLACE_ADMIN_STORAGE_STATE || path.resolve('marketplace-admin-storage-state.json')
await mkdir(path.dirname(statePath), { recursive: true })
const browser = await chromium.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(`${baseURL}/angelcare-marketplace/admin/activation`, { waitUntil: 'domcontentloaded' })
console.log('\nConnectez-vous comme administrateur dans la fenêtre Chromium.')
const rl = createInterface({ input, output })
await rl.question('Quand le cockpit Production Activation est visible, appuyez sur Entrée ici… ')
rl.close()
await context.storageState({ path: statePath })
await browser.close()
console.log(`Session admin enregistrée : ${statePath}`)
