import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0
let passed = 0
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
function check(condition, label) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`)
  if (condition) passed += 1
  else failed += 1
}
function contains(rel, token, label = `${rel} contains ${token}`) {
  check(exists(rel) && read(rel).includes(token), label)
}
function excludes(rel, token, label = `${rel} excludes ${token}`) {
  check(exists(rel) && !read(rel).includes(token), label)
}

const required = [
  'ANGELCARE_BROWSER_OS_SCANNER_INTELLIGENCE_2_0_CONTRACT.md',
  'packages/browser-extension-contracts/b2b-scanner-intelligence.v7_1.json',
  'apps/revenue-browser-extension/src/generated/b2b-scanner-intelligence.v7_1.json',
  'apps/ops-web/lib/browser-extension/generated/b2b-scanner-intelligence.v7_1.json',
  'apps/ops-web/lib/browser-extension/b2b-scanner/types.ts',
  'apps/ops-web/lib/browser-extension/b2b-scanner/html.ts',
  'apps/ops-web/lib/browser-extension/b2b-scanner/ai.ts',
  'apps/ops-web/lib/browser-extension/b2b-scanner/service.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/scanner/quick/route.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/scanner/deep/route.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/scanner/status/[id]/route.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/scanner/accounts/search/route.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/scanner/decision/route.ts',
  'apps/ops-web/supabase/migrations/20260720_browser_extension_scanner_intelligence_2_0.sql',
  'apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_scanner_intelligence_2_0.sql',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/scanner-mode.ts',
]
for (const rel of required) check(exists(rel), `required file ${rel}`)

const packageJson = JSON.parse(read('apps/revenue-browser-extension/package.json'))
const manifest = JSON.parse(read('apps/revenue-browser-extension/manifest.template.json'))
const contract = JSON.parse(read('packages/browser-extension-contracts/b2b-scanner-intelligence.v7_1.json'))
check(packageJson.version === '0.9.0', 'extension package version 0.9.0 RC preserving Scanner 2.0')
check(manifest.version === '0.9.0', 'manifest version 0.9.0 RC preserving Scanner 2.0')
check(contract.version === '0.7.1', 'scanner contract version 0.7.1')
check(contract.operatingModes?.length === 3, 'three scanner operating modes contracted')
check(contract.gatewayRoutes?.length === 5, 'five governed scanner routes contracted')
check(contract.dataStructures?.length === 8, 'eight scanner persistence structures contracted')
check(contract.strengthensCapabilityIds?.length === 12, 'scanner strengthens canonical capabilities without inventing capability 46')

const migration = read('apps/ops-web/supabase/migrations/20260720_browser_extension_scanner_intelligence_2_0.sql')
const rollback = read('apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_scanner_intelligence_2_0.sql')
for (const table of contract.dataStructures) {
  check(migration.includes(`public.${table}`), `migration creates ${table}`)
  check(rollback.includes(`drop table if exists public.${table}`), `rollback removes ${table}`)
}
for (const token of ['enable row level security','browser_os.scanner_intelligence_2','browser_os.scanner_deep_research','browser_os.scanner_governed_ai',"'0.7.1'"]) contains('apps/ops-web/supabase/migrations/20260720_browser_extension_scanner_intelligence_2_0.sql', token)

const backend = read('apps/ops-web/lib/browser-extension/b2b-scanner/service.ts')
for (const token of ['assertSafePublicUrl','SCANNER_CROSS_ORIGIN_BLOCKED','SCANNER_PRIVATE_IP_BLOCKED','robotsDisallowed','AbortSignal.timeout','SCANNER_PAGE_TOO_LARGE','candidateUrls','runQuickScanner','runDeepScanner','searchScannerAccounts','recordScannerDecision','b2b.context.resolve','filterByOwnership']) check(backend.includes(token), `backend scanner control ${token}`)
check(!backend.includes('service_role'), 'no service-role secret literal in scanner service')
check(!backend.includes('process.env.SUPABASE_SERVICE_ROLE'), 'scanner service does not request direct service-role environment')

for (const rel of required.filter((rel) => rel.endsWith('/route.ts'))) {
  contains(rel, 'authenticateExtensionRequest', `${rel} authenticates extension request`)
  contains(rel, 'authorizeB2BIntelligenceCommand', `${rel} applies B2B command authorization`)
}

const content = read('apps/revenue-browser-extension/src/content/generic-web.ts')
for (const token of ['generic-web-v2.0','internalLinks','sections:sections()','publicEmails','publicPhones','contacts:c','signals']) check(content.includes(token), `live page extractor ${token}`)
excludes('apps/revenue-browser-extension/src/content/generic-web.ts', 'contacts:[]', 'weak empty contacts implementation removed')
excludes('apps/revenue-browser-extension/src/content/generic-web.ts', 'signals:[]', 'weak empty signals implementation removed')
for (const token of ['google-maps-v2.0','reviewCount','businessStatus','organization.website']) contains('apps/revenue-browser-extension/src/content/google-maps.ts', token, `Google Maps scanner ${token}`)

const api = read('apps/revenue-browser-extension/src/api.ts')
const worker = read('apps/revenue-browser-extension/src/background/service-worker.ts')
const runtime = read('apps/revenue-browser-extension/src/modules/revenue-b2b.ts')
const scannerUi = read('apps/revenue-browser-extension/src/modules/revenue-b2b/scanner-mode.ts')
const css = read('apps/revenue-browser-extension/public/sidepanel.css')
check(api.includes("path.includes('/scanner/') && init.method"), 'scanner POST requests are not automatically replayed')
for (const token of ['quickScanActiveContext','deepScanActiveContext','searchB2BAccounts','recordScannerDecision']) check(api.includes(token), `extension API ${token}`)
for (const token of ['SCANNER_QUICK_SCAN','SCANNER_DEEP_SCAN','SCANNER_ACCOUNT_SEARCH','SCANNER_RECORD_DECISION']) check(worker.includes(token), `service worker route ${token}`)
for (const token of ["activeView: 'scanner'",'runScanner','searchScannerAccounts','selectScannerAccount','scanner-quick','scanner-deep','scanner-strategic','data-select-account','scanner-account-search',"decisionType: 'create_prospect'",'45 attribuées']) check(runtime.includes(token), `runtime scanner wiring ${token}`)
check(runtime.includes('clearMessages()\n    const domain'), 'domain navigation clears stale global errors')
check(runtime.includes('clearMessages()\n    const view'), 'workspace navigation clears stale global errors')
for (const token of ['Scan instantané','Deep Company Scan','Mission stratégique','Ouvrir un compte ANGELCARE','Preuves détectées','Décideurs & contacts','Signaux commerciaux','Opportunités ANGELCARE proposées','PASSER DE LA RECHERCHE À L’EXÉCUTION']) check(scannerUi.includes(token), `scanner command center ${token}`)
for (const token of ['scanner-command-center','scanner-launch-hero','scanner-account-results','scanner-quality-grid','scanner-opportunity-grid','scanner-action-deck']) check(css.includes(token), `scanner visual system ${token}`)

const weakClaims = ['45/45 actives','45 capacités opérationnelles chargées']
for (const claim of weakClaims) check(!runtime.includes(claim), `misleading runtime claim removed: ${claim}`)

const sourceContract = read('packages/browser-extension-contracts/b2b-scanner-intelligence.v7_1.json')
for (const rel of ['apps/revenue-browser-extension/src/generated/b2b-scanner-intelligence.v7_1.json','apps/ops-web/lib/browser-extension/generated/b2b-scanner-intelligence.v7_1.json']) check(read(rel) === sourceContract, `scanner contract mirror synchronized: ${rel}`)

console.log(`Scanner Intelligence 2.0 verification: ${passed}/${passed + failed} checks passed`)
if (failed) process.exit(1)
console.log('STATUS: STATIC SOURCE CHECKS PASSED; DEPLOYED BROWSER-TO-DATABASE LIVE ACCEPTANCE NOT PROVEN BY THIS VERIFIER')
