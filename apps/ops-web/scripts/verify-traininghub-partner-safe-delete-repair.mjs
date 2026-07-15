import fs from 'node:fs'

const files = {
  lib: 'lib/traininghub/production/partner-safe-delete.ts',
  safeRoute: 'app/api/traininghub/internal/partners/[organizationId]/safe-delete/route.ts',
  route: 'app/api/traininghub/internal/partners/[organizationId]/route.ts',
  cli: 'scripts/traininghub-safe-delete-partner.mjs',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['safe delete library exists', fs.existsSync(files.lib)],
  ['library has archive/suspend/hard modes', text.lib.includes("'archive'") && text.lib.includes("'suspend'") && text.lib.includes("'hard_delete'")],
  ['library detects smoke/test/demo', text.lib.includes("haystack.includes('smoke')") && text.lib.includes("haystack.includes('test')")],
  ['library handles FK fallback archive', text.lib.includes('fallback_archive') && text.lib.includes('Hard delete blocked')],
  ['library touches commercial child tables', text.lib.includes('bill_proposals') && text.lib.includes('bill_training_credits') && text.lib.includes('trn_sessions') && text.lib.includes('partner_documents')],
  ['safe delete API route exists', fs.existsSync(files.safeRoute)],
  ['safe route requires internal context', text.safeRoute.includes('TRAININGHUB_INTERNAL_REQUIRED') && text.safeRoute.includes('getTrainingHubContext')],
  ['existing partner DELETE route patched', fs.existsSync(files.route) && text.route.includes('deleteTrainingHubPartnerSafely')],
  ['CLI script exists', fs.existsSync(files.cli)],
  ['CLI requires execute yes', text.cli.includes("has('--execute')") && text.cli.includes("has('--yes')")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner safe delete repair verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner safe delete repair verification PASSED.')
