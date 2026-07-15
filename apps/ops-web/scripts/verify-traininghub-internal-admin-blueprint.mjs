import fs from 'node:fs'

const required = [
  'components/traininghub/internal/TrainingHubInternalBlueprintShell.tsx',
  'components/traininghub/internal/TrainingHubInternalAdminPage.tsx',
  'app/api/traininghub/internal/overview/route.ts',
  'app/api/traininghub/internal/actions/route.ts',
  'app/traininghub/page.tsx',
  'app/traininghub/partners/page.tsx',
  'app/traininghub/partners/[id]/page.tsx',
  'app/traininghub/commercial/page.tsx',
  'app/traininghub/offres/page.tsx',
  'app/traininghub/orders/page.tsx',
  'app/traininghub/billing/page.tsx',
  'app/traininghub/credits/page.tsx',
  'app/traininghub/catalogue/page.tsx',
  'app/traininghub/categories/page.tsx',
  'app/traininghub/sessions/page.tsx',
  'app/traininghub/participants/page.tsx',
  'app/traininghub/trainers/page.tsx',
  'app/traininghub/attendance/page.tsx',
  'app/traininghub/certificates/page.tsx',
  'app/traininghub/documents/page.tsx',
  'app/traininghub/refresh/page.tsx',
  'app/traininghub/quality/page.tsx',
  'app/traininghub/reports/page.tsx',
  'app/traininghub/requests/page.tsx',
  'app/traininghub/notifications/page.tsx',
  'app/traininghub/users/page.tsx',
  'app/traininghub/access/page.tsx',
  'app/traininghub/settings/page.tsx',
  'app/traininghub/audit/page.tsx',
  'app/traininghub/readiness/page.tsx',
  'supabase/migrations/20260701070000_traininghub_internal_admin_blueprint.sql',
]

const rows = required.map((file) => ({ file, ok: fs.existsSync(file) }))
console.table(rows)
const missing = rows.filter((row) => !row.ok)
if (missing.length) {
  console.error('TrainingHub internal admin blueprint verification FAILED.')
  process.exit(1)
}

const shell = fs.readFileSync('components/traininghub/internal/TrainingHubInternalBlueprintShell.tsx', 'utf8')
const requiredWords = [
  'Command Center',
  'Portefeuille partenaires',
  'Partner Mega Dossier',
  'Pipeline commercial',
  'Offres & propositions',
  'Factures & paiements',
  'Catalogue formations',
  'Sessions',
  'Présences & validation',
  'Certificats',
  'Refresh & renouvellements',
  'Demandes partenaires',
  'Rôles & accès',
  'Production readiness',
]

const missingWords = requiredWords.filter((word) => !shell.includes(word))
if (missingWords.length) {
  console.error('Missing blueprint concepts:', missingWords)
  process.exit(1)
}

console.log('TrainingHub internal admin blueprint verification PASSED.')
