import fs from 'node:fs'
const component = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'
const route = 'app/api/traininghub/internal/partner-dossier/[id]/route.ts'
const c = fs.existsSync(component) ? fs.readFileSync(component, 'utf8') : ''
const r = fs.existsSync(route) ? fs.readFileSync(route, 'utf8') : ''
const checks = [
  ['component exists', fs.existsSync(component)],
  ['api route exists', fs.existsSync(route)],
  ['wide create-style viewport shell', c.includes("width:'calc(100vw - 16px)'") || c.includes("width: 'calc(100vw - 16px)'")],
  ['preview locked by default', c.includes('MODE PREVIEW SYNCHRONISÉ') && c.includes('useState(false)')],
  ['edit/save buttons', c.includes('Modifier') && c.includes('Enregistrer modifications')],
  ['suspend/delete buttons', c.includes('Suspendre accès') && c.includes('Supprimer définitivement')],
  ['create modal sections', c.includes('Identité établissement') && c.includes('Billing & contrôle') && c.includes('Preuves & SLA')],
  ['GET PATCH DELETE api', r.includes('export async function GET') && r.includes('export async function PATCH') && r.includes('export async function DELETE')],
  ['delete confirmation', r.includes('DELETE_PARTNER')],
]
console.table(checks.map(([name, pass]) => ({ name, pass })))
if (checks.some(([, pass]) => !pass)) { console.error('TrainingHub existing partner create-style modal verification FAILED.'); process.exit(1) }
console.log('TrainingHub existing partner create-style modal verification PASSED.')
