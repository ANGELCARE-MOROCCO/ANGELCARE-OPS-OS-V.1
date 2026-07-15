import fs from 'fs'
const required = [
  'lib/service-os/types.ts',
  'lib/service-os/seed-data.ts',
  'lib/service-os/engine.ts',
  'components/service-os/ServiceOSPrimitives.tsx',
  'app/(protected)/services/enterprise/page.tsx',
  'app/(protected)/services/blueprints/page.tsx',
  'app/(protected)/services/configuration/page.tsx',
  'app/(protected)/services/rules/page.tsx',
  'app/(protected)/services/operations/page.tsx',
  'app/(protected)/services/workflows/page.tsx',
  'app/(protected)/services/incidents/page.tsx',
  'app/(protected)/services/commercial/page.tsx',
  'app/(protected)/services/pricing-engine/page.tsx',
  'app/(protected)/services/subscriptions/page.tsx',
  'app/(protected)/services/live-ops/page.tsx',
  'app/(protected)/services/capacity/page.tsx',
  'app/(protected)/services/expansion/page.tsx',
  'app/(protected)/services/ai-matching/page.tsx',
  'app/(protected)/services/ai-strategy/page.tsx',
  'app/(protected)/services/market-intelligence/page.tsx'
]
const missing = required.filter((p) => !fs.existsSync(p))
if (missing.length) { console.error('Missing ServiceOS files:', missing); process.exit(1) }
console.log('ServiceOS route/file verification passed:', required.length, 'files')
