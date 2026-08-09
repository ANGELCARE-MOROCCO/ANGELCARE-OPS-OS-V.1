import fs from 'node:fs'
import path from 'node:path'

const idDir = 'app/api/traininghub/internal/partners/[id]'
const orgDir = 'app/api/traininghub/internal/partners/[organizationId]'
const modal = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'

const modalText = fs.existsSync(modal) ? fs.readFileSync(modal, 'utf8') : ''
const routeFiles = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) routeFiles.push(full)
  }
}

walk('app/api/traininghub/internal/partners')

const checks = [
  ['conflicting [id] dynamic route removed', !fs.existsSync(idDir)],
  ['[organizationId] route directory exists', fs.existsSync(orgDir)],
  ['modal exists', fs.existsSync(modal)],
  ['modal no longer references undefined partner.id in delete endpoint', !modalText.includes('${partner.id}/hard-delete') && !modalText.includes('${partner?.id}/hard-delete')],
  ['modal resolves organizationId before delete', modalText.includes('const organizationId =') && modalText.includes('identifiant partenaire introuvable')],
  ['modal calls hard-delete endpoint', modalText.includes('/api/traininghub/internal/partners/${organizationId}/hard-delete')],
  ['modal has no safe-delete endpoint', !modalText.includes('/safe-delete')],
  ['hard-delete route exists', fs.existsSync('app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub delete partner-not-defined/slug-conflict verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub delete partner-not-defined/slug-conflict verification PASSED.')
