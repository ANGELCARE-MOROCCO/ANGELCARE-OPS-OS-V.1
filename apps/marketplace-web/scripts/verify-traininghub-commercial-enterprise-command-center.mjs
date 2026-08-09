import fs from 'node:fs'

const files = {
  page: 'app/traininghub/commercial/page.tsx',
  component: 'components/traininghub/commercial/TrainingHubCommercialCommandCenter.tsx',
  lib: 'lib/traininghub/commercial/commercial-sync.ts',
  workspaceApi: 'app/api/traininghub/commercial/workspace/route.ts',
  actionsApi: 'app/api/traininghub/commercial/actions/route.ts',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['commercial page exists', fs.existsSync(files.page)],
  ['commercial page uses internal guard', text.page.includes('requireTrainingHubPageContext')],
  ['premium component exists', fs.existsSync(files.component)],
  ['component has subnavigation', text.component.includes('Vue globale') && text.component.includes('Pipeline') && text.component.includes('Facturation') && text.component.includes('Audit')],
  ['component has board and table modes', text.component.includes("type DisplayMode = 'board' | 'table'") && text.component.includes('PipelineBoard') && text.component.includes('PremiumTable')],
  ['component has required modals', text.component.includes('Offer Studio TrainingHub') && text.component.includes('Générer facture') && text.component.includes('Émettre crédits formation') && text.component.includes('Visibilité portail partenaire')],
  ['component has preintegrated packages', text.component.includes('Activation') && text.component.includes('Growth') && text.component.includes('Premium') && text.component.includes('Enterprise') && text.component.includes('Custom')],
  ['sync lib exists', fs.existsSync(files.lib)],
  ['sync lib reads core and commercial tables', text.lib.includes('core_organizations') && text.lib.includes('bill_proposals') && text.lib.includes('bill_subscriptions') && text.lib.includes('bill_training_credits') && text.lib.includes('trn_sessions')],
  ['sync lib builds workspace', text.lib.includes('buildTrainingHubCommercialWorkspace')],
  ['sync lib supports adaptive action writes', text.lib.includes('executeTrainingHubCommercialAction') && text.lib.includes('adaptiveInsert') && text.lib.includes('adaptiveUpdate')],
  ['workspace API exists', fs.existsSync(files.workspaceApi)],
  ['workspace API requires internal users', text.workspaceApi.includes('TRAININGHUB_INTERNAL_REQUIRED')],
  ['actions API exists', fs.existsSync(files.actionsApi)],
  ['actions API executes commercial actions', text.actionsApi.includes('executeTrainingHubCommercialAction')],
  ['actions cover monetization flow', text.lib.includes('create_offer') && text.lib.includes('convert_offer_to_order') && text.lib.includes('create_subscription') && text.lib.includes('generate_invoice') && text.lib.includes('issue_credits') && text.lib.includes('plan_session') && text.lib.includes('publish_portal_visibility')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub commercial enterprise command center verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub commercial enterprise command center verification PASSED.')
