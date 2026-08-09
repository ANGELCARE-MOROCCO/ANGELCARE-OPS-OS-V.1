import fs from 'node:fs'

const required = [
  'app/carelink/page.tsx',
  'app/carelink/missions/page.tsx',
  'app/carelink/missions/[id]/page.tsx',
  'app/carelink-ops/page.tsx',
  'app/carelink-ops/dispatch/page.tsx',
  'app/api/carelink/health/route.ts',
  'app/api/carelink/missions/[id]/transition/route.ts',
  'lib/carelink/lifecycle.ts',
  'lib/carelink/readiness.ts',
]

const missing = required.filter((file) => !fs.existsSync(file))
if (fs.existsSync('app/(protected)/carelink')) {
  console.error('Duplicate route exists: app/(protected)/carelink must be removed or moved to backup.')
  process.exit(1)
}
if (missing.length) {
  console.error('Missing CareLink enterprise files:', missing.join(', '))
  process.exit(1)
}
console.log('CareLink enterprise route verification passed.')
