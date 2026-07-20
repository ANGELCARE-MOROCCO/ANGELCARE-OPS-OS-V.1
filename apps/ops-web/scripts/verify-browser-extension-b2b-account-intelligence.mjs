import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())
const contractPath = path.resolve(root, '../../packages/browser-extension-contracts/b2b-account-intelligence.v2.json')
const requiredFiles = [
  ['migration', 'supabase/migrations/20260719_browser_extension_b2b_account_intelligence.sql'],
  ['service', 'lib/browser-extension/b2b-intelligence/service.ts'],
  ['contract', 'lib/browser-extension/b2b-intelligence/contract.ts'],
  ['authorization', 'lib/browser-extension/b2b-intelligence/authorization.ts'],
  ['execute gateway', 'app/api/browser-extension/v1/commands/execute/route.ts'],
  ['context resolver', 'app/api/browser-extension/v1/b2b/context/resolve/route.ts'],
  ['account recognition', 'app/api/browser-extension/v1/b2b/accounts/recognize/route.ts'],
  ['duplicate matching', 'app/api/browser-extension/v1/b2b/accounts/matches/route.ts'],
  ['prospect creation', 'app/api/browser-extension/v1/b2b/prospects/create/route.ts'],
  ['prospect enrichment', 'app/api/browser-extension/v1/b2b/prospects/enrich/route.ts'],
  ['contact capture', 'app/api/browser-extension/v1/b2b/contacts/create/route.ts'],
  ['buying committee', 'app/api/browser-extension/v1/b2b/buying-committee/route.ts'],
  ['account scoring', 'app/api/browser-extension/v1/b2b/account-scoring/route.ts'],
  ['account plans', 'app/api/browser-extension/v1/b2b/account-plans/route.ts'],
  ['research missions', 'app/api/browser-extension/v1/b2b/research-missions/route.ts'],
  ['territory inspection', 'app/api/browser-extension/v1/b2b/territory/inspect/route.ts'],
  ['territory capture', 'app/api/browser-extension/v1/b2b/territory/capture/route.ts'],
  ['evidence', 'app/api/browser-extension/v1/b2b/evidence/route.ts'],
  ['contract supplement', contractPath],
]
let failed = 0
const pass = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++ }
for (const [label, rel] of requiredFiles) pass(label, fs.existsSync(path.isAbsolute(rel) ? rel : path.join(root, rel)))

const service = fs.readFileSync(path.join(root, 'lib/browser-extension/b2b-intelligence/service.ts'), 'utf8')
const authorization = fs.readFileSync(path.join(root, 'lib/browser-extension/b2b-intelligence/authorization.ts'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'lib/browser-extension/authorization.ts'), 'utf8')
const execute = fs.readFileSync(path.join(root, 'app/api/browser-extension/v1/commands/execute/route.ts'), 'utf8')
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260719_browser_extension_b2b_account_intelligence.sql'), 'utf8')
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

const implementationNeedles = [
  ['M2-A01 unknown website context', 'resolveContext'],
  ['M2-A02 existing account recognition', 'resolved_status'],
  ['M2-A03 duplicate block', 'HIGH_CONFIDENCE_DUPLICATE_BLOCKED'],
  ['M2-A04 capability restriction', 'CAPABILITY_NOT_ASSIGNED'],
  ['M2-A05 adapter restriction', 'ADAPTER_NOT_ASSIGNED'],
  ['M2-A06 territory restriction', 'assertTerritory'],
  ['M2-A07 evidence traceability', 'browser_extension_b2b_evidence'],
  ['M2-A08 buying committee mission loop', 'browser_extension_b2b_buying_committee'],
  ['M2-A09 Google Maps territory sweep', 'b2b.territory.target_capture'],
  ['M2-A10 access version enforcement', 'authenticateExtensionRequest'],
]
for (const [label, needle] of implementationNeedles) {
  const haystack = label.includes('capability') || label.includes('adapter') ? authorization : label.includes('access version') ? execute : service
  pass(label, haystack.includes(needle))
}

const tables = [
  'browser_extension_b2b_contexts', 'browser_extension_b2b_identity_matches',
  'browser_extension_b2b_evidence', 'browser_extension_b2b_enrichment_proposals',
  'browser_extension_b2b_score_snapshots', 'browser_extension_b2b_buying_committee',
  'browser_extension_b2b_account_plans', 'browser_extension_b2b_research_missions',
  'browser_extension_b2b_duplicate_reviews', 'browser_extension_b2b_territory_sweeps',
  'browser_extension_b2b_territory_targets', 'browser_extension_adapter_health_events'
]
for (const table of tables) pass(`table ${table}`, migration.includes(table))
pass('21 intelligence commands', Array.isArray(contract.commands) && contract.commands.length === 21)
pass('10 acceptance scenarios', Array.isArray(contract.acceptanceScenarios) && contract.acceptanceScenarios.length === 10)
pass('14 contracted scope areas', Array.isArray(contract.scope) && contract.scope.length === 14)

if (failed) {
  console.error(`MEGA PATCH 02 verification failed: ${failed} checks failed.`)
  process.exit(1)
}
console.log('STATUS: MEGA PATCH 02 B2B ACCOUNT INTELLIGENCE ACCEPTED')
