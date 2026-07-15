import fs from 'node:fs'

const required = [
  'lib/traininghub/production/server.ts',
  'lib/traininghub/production/workflows.ts',
  'components/traininghub/internal/TrainingHubProductionBindingPanel.tsx',
  'app/api/traininghub/internal/production/snapshot/route.ts',
  'app/api/traininghub/internal/partners/route.ts',
  'app/api/traininghub/internal/partners/[id]/dossier/route.ts',
  'app/api/traininghub/internal/offers/route.ts',
  'app/api/traininghub/internal/offers/[id]/convert/route.ts',
  'app/api/traininghub/internal/catalogue/route.ts',
  'app/api/traininghub/internal/sessions/route.ts',
  'app/api/traininghub/internal/attendance/validate/route.ts',
  'app/api/traininghub/internal/certificates/issue/route.ts',
  'app/api/traininghub/internal/documents/publish/route.ts',
  'app/api/traininghub/internal/requests/[id]/resolve/route.ts',
  'supabase/migrations/20260701080000_traininghub_production_real_layer.sql',
]
const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)
if (rows.some((row) => !row.ok)) process.exit(1)

const workflow = fs.readFileSync('lib/traininghub/production/workflows.ts', 'utf8')
for (const concept of ['createPartner', 'createOffer', 'convertOffer', 'upsertCourse', 'planSession', 'validateAttendance', 'issueCertificates', 'publishDocument', 'resolveRequest']) {
  if (!workflow.includes(concept)) {
    console.error('Missing workflow:', concept)
    process.exit(1)
  }
}
console.log('TrainingHub production real layer verification PASSED.')
