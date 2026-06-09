import fs from 'node:fs'

const required = [
  'app/(protected)/carelink/page.tsx',
  'app/(protected)/carelink/missions/page.tsx',
  'app/(protected)/carelink/missions/[id]/page.tsx',
  'app/(protected)/carelink/schedule/page.tsx',
  'app/(protected)/carelink/messages/page.tsx',
  'app/(protected)/carelink/profile/page.tsx',
  'components/carelink/CareLinkMobileClient.tsx',
  'components/carelink/CareLinkMobileGate.tsx',
  'lib/carelink/server.ts',
  'lib/carelink/seed.ts',
  'lib/carelink/types.ts',
  'app/api/carelink/health/route.ts',
  'app/api/carelink/dashboard/route.ts',
  'app/api/carelink/missions/route.ts',
  'supabase/migrations/20260609_carelink_field_agent_mobile_portal.sql',
]

const missing = required.filter((file) => !fs.existsSync(file))
if (missing.length) {
  console.error('CareLink verification failed. Missing files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}
console.log(`CareLink verification passed: ${required.length} required files found.`)
