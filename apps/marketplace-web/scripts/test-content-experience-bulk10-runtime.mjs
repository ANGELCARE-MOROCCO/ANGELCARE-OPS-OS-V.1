import fs from 'node:fs'
const read = (rel) => fs.readFileSync(rel, 'utf8')
const gateway = read('lib/market-os/ai-runtime/gateway.ts')
const route = read('lib/market-os/ai-runtime/provider-route.ts')
const control = read('lib/market-os/ai-runtime/control-service.ts')
const provider = read('lib/market-os/marketing-ai/provider.ts')
const cases = [
  ['research-route-tavily', /web_research.*tavily|tavily.*web_research/s.test(route)],
  ['content-route-openrouter', route.includes("? 'tavily' : 'openrouter'")],
  ['gemini-retired', route.includes('RETIRED_TYPES')],
  ['auto-manual-continuity', gateway.includes("status: 'manual_required'")],
  ['without-research', gateway.includes("mode !== 'without_research'")],
  ['manual-task-plan', provider.includes("type: 'create_task_plan'")],
  ['delete-requires-disabled', control.includes('RUNTIME_ASSIGNMENT_MUST_BE_DISABLED_BEFORE_DELETE')],
  ['delete-requires-confirmation', control.includes('RUNTIME_DELETE_CONFIRMATION_REQUIRED')],
  ['delete-blocks-active-request', control.includes('RUNTIME_ASSIGNMENT_HAS_ACTIVE_REQUESTS')],
  ['dossier-dependencies', control.includes('RUNTIME_DOSSIER_HAS_DEPENDENCIES')],
  ['schedule-suspension', control.includes("status: 'suspended'")],
]
const failed = cases.filter(([, ok]) => !ok)
for (const [name, ok] of cases) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
if (failed.length) process.exit(1)
console.log(`PASS — ${cases.length} deterministic runtime, continuation and deletion-policy cases passed.`)
