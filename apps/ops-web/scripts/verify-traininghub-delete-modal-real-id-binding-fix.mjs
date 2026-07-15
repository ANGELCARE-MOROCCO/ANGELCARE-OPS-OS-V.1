import fs from 'node:fs'

const modal = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'
const text = fs.existsSync(modal) ? fs.readFileSync(modal, 'utf8') : ''

const deleteBodyMatch = text.match(/(?:const\s+deletePartner\s*=\s*async\s*\([^)]*\)\s*=>|async\s+function\s+deletePartner\s*\([^)]*\)|function\s+deletePartner\s*\([^)]*\))\s*\{([\s\S]*?)\n\s*\}/)
const deleteBody = deleteBodyMatch ? deleteBodyMatch[1] : ''

const checks = [
  ['modal exists', fs.existsSync(modal)],
  ['deletePartner function exists', text.includes('deletePartner')],
  ['delete function does not use undefined partner.id', !deleteBody.includes('partner.id') && !deleteBody.includes('partner?.id')],
  ['delete function does not use undefined selectedPartner', !deleteBody.includes('selectedPartner')],
  ['delete function resolves organizationId from real expression', deleteBody.includes('const organizationId = String((')],
  ['delete function calls hard-delete endpoint', deleteBody.includes('/api/traininghub/internal/partners/${organizationId}/hard-delete')],
  ['delete function reads backend JSON error', deleteBody.includes('deletePayload')],
  ['no safe-delete endpoint remains in modal', !text.includes('/safe-delete')],
  ['no [id] conflicting route folder', !fs.existsSync('app/api/traininghub/internal/partners/[id]')],
  ['canonical [organizationId] route folder exists', fs.existsSync('app/api/traininghub/internal/partners/[organizationId]')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub delete modal real id binding verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub delete modal real id binding verification PASSED.')
