import fs from 'node:fs'
import path from 'node:path'

const app = process.cwd()
const routes = [
  '/api/b2b-partnerships/revenue-os',
  '/api/traininghub/commercial/revenue-os',
  '/api/email-os/revenue-os',
  '/api/revenue-opportunities/revenue-os',
  '/api/account-plans/revenue-os',
  '/api/campaigns/revenue-os',
  '/api/meetings/revenue-os',
  '/api/proposals/revenue-os',
  '/api/payments/revenue-os',
  '/api/traininghub/trainer-planning/revenue-os',
  '/api/traininghub/delivery/revenue-os',
  '/api/reporting/revenue-os',
  '/api/tasks/revenue-os',
]
const missing = []
const found = []
for (const route of routes) {
  const relative = `app${route}/route.ts`
  if (fs.existsSync(path.join(app, relative))) found.push({ route, relative })
  else missing.push({ route, expected: relative })
}
console.log(JSON.stringify({ checked: routes.length, found: found.length, missing }, null, 2))
if (missing.length) process.exit(1)
