import fs from 'node:fs'

const files = {
  sync: 'lib/traininghub/partner-portal-sync.ts',
  subpage: 'components/traininghub/TrainingHubPartnerSubPage.tsx',
  bootstrap: 'scripts/traininghub-bootstrap-partner-portal-records.mjs',
}

const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '']))

const checks = [
  ['sync helper exists', fs.existsSync(files.sync)],
  ['summary includes subscriptions/documents/entitlements', text.sync.includes('subscriptions: any[]') && text.sync.includes('documents: any[]') && text.sync.includes('entitlements: any[]')],
  ['summary computes commercial state', text.sync.includes('commercial_state') && text.sync.includes('credit_wallet_ready')],
  ['subpage exists', fs.existsSync(files.subpage)],
  ['facturation combines account subscription offer order invoice credit', text.subpage.includes('buildCommercialRows') && text.subpage.includes('data.subscriptions') && text.subpage.includes('data.credits')],
  ['formations show credits/entitlements when sessions empty', text.subpage.includes('buildFormationRows') && text.subpage.includes('data.entitlements') && text.subpage.includes('training-empty-action')],
  ['documents include partner_documents/resources', text.subpage.includes('data.documents') && text.subpage.includes('data.resources')],
  ['empty state is actionable not blank', text.subpage.includes('Action AngelCare requise') && text.subpage.includes('Aucune session encore planifiée')],
  ['bootstrap script exists', fs.existsSync(files.bootstrap)],
  ['bootstrap creates account/proposal/subscription/credits/session/documents', text.bootstrap.includes('bill_accounts') && text.bootstrap.includes('bill_proposals') && text.bootstrap.includes('bill_subscriptions') && text.bootstrap.includes('bill_training_credits') && text.bootstrap.includes('trn_sessions') && text.bootstrap.includes('partner_documents')],
  ['bootstrap requires execute yes', text.bootstrap.includes("has('--execute')") && text.bootstrap.includes("has('--yes')")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner portal commercial visibility sync verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner portal commercial visibility sync verification PASSED.')
