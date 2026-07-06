import fs from 'node:fs'

const files = {
  sql: 'database/traininghub_force_delete_partner_v2.sql',
  lib: 'lib/traininghub/production/partner-hard-delete-v2.ts',
  hardRoute: 'app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts',
  route: 'app/api/traininghub/internal/partners/[organizationId]/route.ts',
  cli: 'scripts/traininghub-hard-delete-partner-v2.mjs',
  wiring: 'scripts/traininghub-find-partner-delete-wiring.mjs',
}

const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([k, p]) => [k, read(p)]))

const checks = [
  ['SQL force delete v2 exists', fs.existsSync(files.sql)],
  ['SQL refuses non-smoke by default', text.sql.includes('NOT_SMOKE_REFUSED') && text.sql.includes('p_allow_non_smoke')],
  ['SQL dynamic direct org deletion exists', text.sql.includes('information_schema.columns') && text.sql.includes('organization_id')],
  ['SQL dynamic linked child deletion exists', text.sql.includes('proposal_id') && text.sql.includes('session_id')],
  ['hard delete lib exists', fs.existsSync(files.lib)],
  ['lib calls RPC v2', text.lib.includes("traininghub_force_delete_partner_v2")],
  ['hard delete API route exists', fs.existsSync(files.hardRoute)],
  ['existing DELETE route patched to v2', text.route.includes('hardDeleteTrainingHubPartnerV2')],
  ['CLI hard delete v2 exists', fs.existsSync(files.cli)],
  ['wiring finder exists', fs.existsSync(files.wiring)],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner delete no-more-guessing v2 verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner delete no-more-guessing v2 verification PASSED.')
