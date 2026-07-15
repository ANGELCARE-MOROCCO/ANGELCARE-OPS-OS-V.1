import fs from 'node:fs'

const requiredFiles = [
  'lib/ac360/customer-direction-action-map.ts',
  'lib/ac360/customer-direction-cockpit-production.ts',
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`)
}

const actionMap = fs.readFileSync('lib/ac360/customer-direction-action-map.ts', 'utf8')
const page = fs.readFileSync('components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'utf8')
const production = fs.readFileSync('lib/ac360/customer-direction-cockpit-production.ts', 'utf8')

const checks = [
  [actionMap.includes("DirectionActionExecutionMode = 'local_context' | 'governed_api' | 'readonly_drawer'"), 'action map declares explicit execution modes'],
  [actionMap.includes("localContextOperations") && actionMap.includes("direction_context.period.update") && actionMap.includes("direction_context.scope.update"), 'period and scope actions are classified as local context operations'],
  [page.includes("if (definition.executionMode === 'local_context')"), 'page handles context-only modals without POSTing to production API'],
  [page.includes('setLocalContext(nextContext)'), 'page updates local cockpit context for period/scope selectors'],
  [page.includes('friendlyExecutionError') && page.includes('Compte à finaliser'), 'page translates backend context errors into customer-facing messages'],
  [page.includes('cockpitContext: localContext'), 'governed API calls include active cockpit context'],
  [production.includes("clientReason: 'account_setup_required'") && production.includes('Compte à finaliser'), 'backend returns customer-facing account-finalization error'],
  [!page.includes('Contexte AC360 introuvable'), 'active cockpit page does not expose developer context wording'],
]

const failed = checks.filter(([ok]) => !ok)
if (failed.length) {
  for (const [, label] of failed) console.error(`❌ ${label}`)
  process.exit(1)
}

console.log('✅ AC360 Direction context-aware modal execution verification passed.')
console.log('✅ Period/site selectors now update cockpit context locally; production workflows still execute through governed API with customer-friendly errors.')
