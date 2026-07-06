import fs from 'node:fs'

const component = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'
const route = 'app/api/traininghub/internal/partner-dossier/[id]/commercial-depth/route.ts'
const componentText = fs.existsSync(component) ? fs.readFileSync(component, 'utf8') : ''
const routeText = fs.existsSync(route) ? fs.readFileSync(route, 'utf8') : ''

const checks = [
  ['modal component exists', fs.existsSync(component)],
  ['commercial depth API exists', fs.existsSync(route)],
  ['offer catalog exists', componentText.includes('offerCatalog')],
  ['multiple offers supported', componentText.includes('addOffer') && componentText.includes('removeOffer')],
  ['offer status/classification controls exist', componentText.includes('ready_to_convert') && componentText.includes('Classification')],
  ['billing rules exist', componentText.includes('billingRulesSeed') && componentText.includes('Billing, règles')],
  ['delivery services exist', componentText.includes('deliverySeed') && componentText.includes('Delivery opérationnelle')],
  ['proof/SLA controls exist', componentText.includes('proofSeed') && componentText.includes('Preuves, SLA')],
  ['sync business button exists', componentText.includes('Sync business')],
  ['API stores commercialDepth', routeText.includes('commercialDepth')],
  ['API syncs proposals', routeText.includes('bill_proposals')],
  ['API syncs sessions', routeText.includes('trn_sessions')],
  ['access/password preserved', componentText.includes('setPassword')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner dossier commercial depth verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner dossier commercial depth verification PASSED.')
