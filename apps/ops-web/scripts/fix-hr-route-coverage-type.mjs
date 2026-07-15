import fs from 'node:fs'

const file = 'lib/hr-production/route-coverage.ts'

if (!fs.existsSync(file)) {
  console.error('Missing lib/hr-production/route-coverage.ts')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Widen Set typing so nav.has(route) accepts plain string routes.
s = s.replace(
  /const\s+nav\s*=\s*new Set\(([^)]*)\)/,
  'const nav = new Set<string>($1)'
)

// Fallback for already formatted variants.
s = s.replace(
  /const\s+nav\s*:\s*Set<[^>]+>\s*=\s*new Set\(([^)]*)\)/,
  'const nav: Set<string> = new Set($1)'
)

fs.writeFileSync(file, s)
console.log('Patched route-coverage nav Set typing')
