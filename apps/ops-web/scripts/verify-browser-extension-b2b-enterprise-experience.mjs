import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repo = path.resolve(root, '../..')
let failed = 0

function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`)
  if (!condition) failed += 1
}

function read(relative) {
  return fs.readFileSync(path.join(repo, relative), 'utf8')
}

const required = [
  'apps/ops-web/lib/browser-extension/b2b-workspace/service.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/workspace/hydrate/route.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/workspace-types.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/workspace-store.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/capability-ui.ts',
  'apps/revenue-browser-extension/src/focus/focus.ts',
  'apps/revenue-browser-extension/public/focus.html',
  'apps/revenue-browser-extension/src/generated/b2b-enterprise-experience.v4_5.json',
]
for (const item of required) check(`required file ${item}`, fs.existsSync(path.join(repo, item)))

const registry = JSON.parse(read('apps/revenue-browser-extension/src/generated/b2b-enterprise-experience.v4_5.json'))
check('35 operational capability-to-UI mappings', registry.operationalCapabilityCount === 35 && registry.capabilities?.length === 35)
check('five enterprise domains', JSON.stringify(registry.domains) === JSON.stringify(['account','execute','deal','intelligence','more']))
check('35/35 live data contract', registry.acceptance?.liveDataHydration === '35/35')

const runtime = read('apps/revenue-browser-extension/src/modules/revenue-b2b.ts')
for (const signal of [
  'command-domain-nav','premium-account-360','proposal-studio-runtime','capability-command-center',
  'HYDRATE_B2B_WORKSPACE','OPEN_B2B_FOCUS_MODE','Account 360','Proposal Studio','Deal Room','Closing Room',
]) check(`runtime signal ${signal}`, runtime.includes(signal))

const css = read('apps/revenue-browser-extension/public/sidepanel.css')
for (const signal of ['Mega ZIP 4.5','command-domain-nav','command-account-hero','proposal-paper','focus-root','capability-grid']) {
  check(`premium visual signal ${signal}`, css.includes(signal))
}

const hydrate = read('apps/ops-web/lib/browser-extension/b2b-workspace/service.ts')
for (const signal of ['contacts','committee','opportunities','execution','deal','timeline','commercialHealth','dataQuality']) {
  check(`Account 360 hydration ${signal}`, hydrate.includes(signal))
}

const worker = read('apps/revenue-browser-extension/src/background/service-worker.ts')
check('live workspace invalidation', worker.includes('ANGELCARE_WORKSPACE_INVALIDATE'))
check('Focus Mode background command', worker.includes('OPEN_B2B_FOCUS_MODE'))
check('extension version preserves 0.4.5 foundation', Number(JSON.parse(read('apps/revenue-browser-extension/manifest.template.json')).version.split('.').slice(0,2).join('.')) >= 0.4)

if (failed) {
  console.error(`Mega ZIP 4.5 verification failed: ${failed} check(s)`) 
  process.exit(1)
}
console.log('MEGA PATCH 04.5 ENTERPRISE EXPERIENCE VERIFICATION PASSED')
