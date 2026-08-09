import fs from 'node:fs'

const files = {
  lib: 'lib/traininghub/production/partner-commercial-provisioning.ts',
  route: 'app/api/traininghub/internal/partners/[organizationId]/production-provision/route.ts',
  component: 'components/traininghub/internal/TrainingHubPartnerProductionProvisioner.tsx',
  page: 'app/traininghub/partner-provisioning/page.tsx',
  cli: 'scripts/traininghub-provision-partner-production-records.mjs',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['provisioning library exists', fs.existsSync(files.lib)],
  ['library creates billing account', text.lib.includes('bill_accounts') && text.lib.includes('partner_training_account')],
  ['library creates proposal/offer', text.lib.includes('bill_proposals') && text.lib.includes('TH-OFFRE')],
  ['library creates annual subscription', text.lib.includes('bill_subscriptions') && text.lib.includes('billing_period')],
  ['library creates training credits', text.lib.includes('bill_training_credits') && text.lib.includes('quantity_available')],
  ['library creates first session', text.lib.includes('trn_sessions') && text.lib.includes('Session TrainingHub de lancement')],
  ['library creates proof documents', text.lib.includes('partner_documents') && text.lib.includes('proof_readiness_pack')],
  ['internal API route exists', fs.existsSync(files.route)],
  ['internal API requires internal context', text.route.includes('Only internal TrainingHub users') && text.route.includes('getTrainingHubContext')],
  ['provisioner component exists', fs.existsSync(files.component)],
  ['provisioner calls POST endpoint', text.component.includes('production-provision') && text.component.includes("method: 'POST'")],
  ['admin utility page exists', fs.existsSync(files.page)],
  ['CLI provisioning script exists', fs.existsSync(files.cli)],
  ['CLI requires execute yes', text.cli.includes("has('--execute')") && text.cli.includes("has('--yes')")],
  ['CLI writes expected tables', text.cli.includes('bill_accounts') && text.cli.includes('bill_proposals') && text.cli.includes('bill_subscriptions') && text.cli.includes('bill_training_credits') && text.cli.includes('trn_sessions') && text.cli.includes('partner_documents')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner production activation provisioning verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner production activation provisioning verification PASSED.')
