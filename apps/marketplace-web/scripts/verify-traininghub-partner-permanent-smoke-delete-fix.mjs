import fs from 'node:fs'

const files = {
  sql: 'database/traininghub_smoke_partner_hard_delete.sql',
  lib: 'lib/traininghub/production/partner-permanent-delete.ts',
  hardRoute: 'app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts',
  safeRoute: 'app/api/traininghub/internal/partners/[organizationId]/safe-delete/route.ts',
  existingRoute: 'app/api/traininghub/internal/partners/[organizationId]/route.ts',
  cli: 'scripts/traininghub-permanently-delete-smoke-partner.mjs',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['SQL hard delete RPC exists', fs.existsSync(files.sql)],
  ['SQL creates cascade function', text.sql.includes('traininghub_hard_delete_partner_cascade')],
  ['SQL detects smoke/test/demo', text.sql.includes("%smoke%") && text.sql.includes("%test%") && text.sql.includes("%demo%")],
  ['SQL dynamically discovers organization columns', text.sql.includes("column_name in ('organization_id', 'partner_id', 'org_id')")],
  ['SQL discovers FK references', text.sql.includes('pg_constraint') && text.sql.includes('fk_discovery')],
  ['permanent delete library exists', fs.existsSync(files.lib)],
  ['library calls RPC first', text.lib.includes("supabase.rpc('traininghub_hard_delete_partner_cascade'")],
  ['library has manual fallback', text.lib.includes('manualDelete') && text.lib.includes('DIRECT_TABLES')],
  ['hard-delete API route exists', fs.existsSync(files.hardRoute)],
  ['safe-delete route also patched', fs.existsSync(files.safeRoute) && text.safeRoute.includes('permanentlyDeleteTrainingHubPartner')],
  ['existing DELETE route patched', fs.existsSync(files.existingRoute) && text.existingRoute.includes('permanentlyDeleteTrainingHubPartner')],
  ['CLI script exists', fs.existsSync(files.cli)],
  ['CLI requires execute yes', text.cli.includes("has('--execute')") && text.cli.includes("has('--yes')")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner permanent smoke delete fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner permanent smoke delete fix verification PASSED.')
