import fs from 'node:fs'
import path from 'node:path'

const required = [
  'components/traininghub/TrainingHubPartnerBlueprintPortal.tsx',
  'components/traininghub/TrainingHubPartnerSubPage.tsx',
  'components/traininghub/TrainingHubPartnerPortalWorkspace.tsx',
  'app/api/traininghub/partner/requests/route.ts',
  'app/traininghub/partner/formations/page.tsx',
  'app/traininghub/partner/equipe/page.tsx',
  'app/traininghub/partner/certificats/page.tsx',
  'app/traininghub/partner/refresh/page.tsx',
  'app/traininghub/partner/documents/page.tsx',
  'app/traininghub/partner/facturation/page.tsx',
  'app/traininghub/partner/demandes/page.tsx',
  'app/traininghub/partner/profil/page.tsx',
  'supabase/migrations/20260701060000_traininghub_partner_portal_blueprint.sql',
]

const checks = required.map((file) => ({
  file,
  ok: fs.existsSync(path.resolve(file)),
}))

console.table(checks)

const failed = checks.filter((row) => !row.ok)
if (failed.length) {
  console.error('TrainingHub partner portal blueprint verification FAILED.')
  process.exit(1)
}

const workspace = fs.readFileSync('components/traininghub/TrainingHubPartnerPortalWorkspace.tsx', 'utf8')
const forbiddenVisible = [
  'TrainingHubPartnerScopeGuardPanel',
  'TrainingHubCutoverCommandPanel',
  'Production Cutover Command',
  'Smoke records',
  'schema',
  'RLS',
]

const forbidden = forbiddenVisible.filter((needle) => workspace.includes(needle))
if (forbidden.length) {
  console.error('Forbidden technical wording/components still visible in partner workspace:', forbidden)
  process.exit(1)
}

console.log('TrainingHub partner portal blueprint verification PASSED.')
