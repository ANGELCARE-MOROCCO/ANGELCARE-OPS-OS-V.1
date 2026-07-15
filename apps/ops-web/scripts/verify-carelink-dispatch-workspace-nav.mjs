import fs from 'node:fs'

const required = [
  'app/carelink-ops/dispatch/page.tsx',
  'app/carelink-ops/dispatch/live-map/page.tsx',
  'app/carelink-ops/dispatch/matching-engine/page.tsx',
  'app/carelink-ops/dispatch/agent-pool/page.tsx',
  'app/carelink-ops/dispatch/schedule/page.tsx',
  'app/carelink-ops/dispatch/sla-escalations/page.tsx',
  'app/carelink-ops/dispatch/communications/page.tsx',
  'app/carelink-ops/dispatch/audit-trail/page.tsx',
  'components/carelink/ops/dispatch/CareLinkDispatchWorkspacePage.tsx',
  'lib/carelink/ops-dispatch-workspace.ts',
  'lib/carelink/ops-dispatch-workspace-crud.ts',
  'app/api/carelink/ops/dispatch/workspace-action/route.ts',
  'app/api/carelink/ops/dispatch/live-map/route.ts',
  'app/api/carelink/ops/dispatch/matching-engine/route.ts',
  'app/api/carelink/ops/dispatch/agent-pool/route.ts',
  'app/api/carelink/ops/dispatch/schedule/route.ts',
  'app/api/carelink/ops/dispatch/sla-escalations/route.ts',
  'app/api/carelink/ops/dispatch/communications/route.ts',
  'app/api/carelink/ops/dispatch/audit-trail/route.ts',
  'supabase/migrations/20260610_carelink_ops_dispatch_workspace_nav.sql',
]

const missing = required.filter((file) => !fs.existsSync(file))
if (missing.length) {
  console.error('Missing CareLink dispatch workspace files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const forbidden = ['Famille ', 'M-109', 'M-110', 'demo', 'mock', 'seed']
const checked = required.filter((f) => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.sql'))
const hits = []
for (const file of checked) {
  const text = fs.readFileSync(file, 'utf8')
  for (const token of forbidden) {
    if (text.includes(token)) hits.push(`${file}: contains forbidden token ${token}`)
  }
}
if (hits.length) {
  console.error('Forbidden static/demo content found:')
  for (const hit of hits) console.error(`- ${hit}`)
  process.exit(1)
}
console.log('CareLink dispatch workspace navigation package verified. No seeded/static mission references found.')
