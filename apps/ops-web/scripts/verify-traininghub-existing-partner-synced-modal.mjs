import fs from 'node:fs'
const files = ['components/traininghub/internal/ExistingPartnerDossierControlModal.tsx','components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx','app/api/traininghub/internal/partner-dossier/[id]/route.ts']
const rows = files.map(file => ({ file, ok: fs.existsSync(file) }))
console.table(rows)
if (rows.some(row => !row.ok)) process.exit(1)
const modal = fs.readFileSync(files[0], 'utf8')
const main = fs.readFileSync(files[1], 'utf8')
const api = fs.readFileSync(files[2], 'utf8')
const checks = [
 ['main uses modal', main.includes('ExistingPartnerDossierControlModal')],
 ['preview mode', modal.includes('MODE PREVIEW SYNCHRONISÉ')],
 ['edit button', modal.includes('Modifier')],
 ['save button', modal.includes('Enregistrer modifications')],
 ['close button', modal.includes('onClose')],
 ['suspend', modal.includes('Suspendre accès') && api.includes('suspend_access')],
 ['delete permanent', modal.includes('Supprimer définitivement') && api.includes('DELETE_PARTNER_PERMANENTLY')],
 ['GET/PATCH/DELETE API', api.includes('export async function GET') && api.includes('export async function PATCH') && api.includes('export async function DELETE')],
]
console.table(checks.map(([name, pass]) => ({ name, pass })))
if (checks.some(([, pass]) => !pass)) process.exit(1)
console.log('TrainingHub existing partner synced modal verification PASSED.')
