import fs from 'node:fs'

const files = {
  page: 'app/traininghub/offres/page.tsx',
  alias: 'app/traininghub/offers/page.tsx',
  component: 'components/traininghub/offres/TrainingHubOffersCommandCenter.tsx',
  lib: 'lib/traininghub/offres/offers-sync.ts',
  workspaceApi: 'app/api/traininghub/offres/workspace/route.ts',
  actionsApi: 'app/api/traininghub/offres/actions/route.ts',
  commercial: 'components/traininghub/commercial/TrainingHubCommercialCommandCenter.tsx',
}
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([k, p]) => [k, read(p)]))

const checks = [
  ['French offres page exists', fs.existsSync(files.page)],
  ['English offers alias exists', fs.existsSync(files.alias)],
  ['page uses TrainingHub guard', text.page.includes('requireTrainingHubPageContext')],
  ['offers component exists', fs.existsSync(files.component)],
  ['component has create/edit/delete/preview flows', text.component.includes('Créer offre') && text.component.includes('Modifier offre') && text.component.includes('Supprimer définitivement') && text.component.includes('Prévisualisation offre')],
  ['component supports multiple offer creation', text.component.includes('Créer plusieurs offres') && text.component.includes('create_multiple_offers')],
  ['component has packages and line catalogue UI', text.component.includes('Packages préintégrés') && text.component.includes('Lignes opérationnelles')],
  ['offers sync lib exists', fs.existsSync(files.lib)],
  ['sync lib reads bill_proposals and linked flow', text.lib.includes('bill_proposals') && text.lib.includes('bill_orders') && text.lib.includes('bill_subscriptions') && text.lib.includes('bill_training_credits') && text.lib.includes('trn_sessions')],
  ['sync lib supports required actions', text.lib.includes('create_offer') && text.lib.includes('update_offer') && text.lib.includes('delete_offer_permanently') && text.lib.includes('duplicate_offer') && text.lib.includes('convert_offer_to_order') && text.lib.includes('publish_offer_to_portal')],
  ['workspace API exists', fs.existsSync(files.workspaceApi)],
  ['actions API exists', fs.existsSync(files.actionsApi)],
  ['APIs require internal TrainingHub access', text.workspaceApi.includes('TRAININGHUB_INTERNAL_REQUIRED') && text.actionsApi.includes('TRAININGHUB_INTERNAL_REQUIRED')],
  ['commercial sidebar routes Offres to /traininghub/offres', !fs.existsSync(files.commercial) || text.commercial.includes("'Offres': '/traininghub/offres'")],
]
console.table(checks.map(([name, pass]) => ({ name, pass })))
if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub offres enterprise management verification FAILED.')
  process.exit(1)
}
console.log('TrainingHub offres enterprise management verification PASSED.')
