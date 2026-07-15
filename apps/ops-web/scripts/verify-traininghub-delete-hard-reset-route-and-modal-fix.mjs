import fs from 'node:fs'

const route = 'app/api/traininghub/internal/partners/[organizationId]/route.ts'
const hardRoute = 'app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts'
const modal = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const routeText = read(route)
const hardRouteText = read(hardRoute)
const modalText = read(modal)

const checks = [
  ['no conflicting [id] route folder', !fs.existsSync('app/api/traininghub/internal/partners/[id]')],
  ['canonical [organizationId] route.ts exists', fs.existsSync(route)],
  ['route.ts has clean imports at top', routeText.startsWith("import { NextRequest, NextResponse }")],
  ['route.ts has one DELETE export', (routeText.match(/export async function DELETE/g) || []).length === 1],
  ['route.ts uses hardDeleteTrainingHubPartnerV2', routeText.includes('hardDeleteTrainingHubPartnerV2')],
  ['hard-delete route exists', fs.existsSync(hardRoute)],
  ['hard-delete route has POST and DELETE', hardRouteText.includes('export async function POST') && hardRouteText.includes('export async function DELETE')],
  ['modal exists', fs.existsSync(modal)],
  ['modal deletePartner exists', modalText.includes('deletePartner')],
  ['modal delete uses hard-delete endpoint', modalText.includes('/api/traininghub/internal/partners/${organizationId}/hard-delete')],
  ['modal reads backend JSON error', modalText.includes('deletePayload')],
  ['modal has no selectedPartner reference in delete endpoint', !modalText.includes('${selectedPartner') && !modalText.includes('${partner.id') && !modalText.includes('${partner?.id')],
  ['modal has no safe-delete endpoint', !modalText.includes('/safe-delete')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub delete hard reset route/modal verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub delete hard reset route/modal verification PASSED.')
