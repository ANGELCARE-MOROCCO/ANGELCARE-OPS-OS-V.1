import fs from 'node:fs'

const route = 'app/api/traininghub/internal/partners/[organizationId]/route.ts'
const hardRoute = 'app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts'
const modal = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const routeText = read(route)
const hardRouteText = read(hardRoute)
const modalText = read(modal)

const deleteCount = (routeText.match(/export async function DELETE/g) || []).length

const checks = [
  ['route.ts exists', fs.existsSync(route)],
  ['route.ts has exactly one DELETE export', deleteCount === 1],
  ['route.ts DELETE uses hardDeleteTrainingHubPartnerV2', routeText.includes('hardDeleteTrainingHubPartnerV2')],
  ['hard-delete route exists', fs.existsSync(hardRoute)],
  ['hard-delete route uses hardDeleteTrainingHubPartnerV2', hardRouteText.includes('hardDeleteTrainingHubPartnerV2')],
  ['modal exists', fs.existsSync(modal)],
  ['modal delete points to hard-delete endpoint', modalText.includes('/api/traininghub/internal/partners/') && modalText.includes('/hard-delete')],
  ['modal no longer uses safe-delete', !modalText.includes('/safe-delete')],
  ['modal exposes backend error', modalText.includes('Endpoint hard-delete') || modalText.includes('deletePayload')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub delete compile/modal wire fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub delete compile/modal wire fix verification PASSED.')
