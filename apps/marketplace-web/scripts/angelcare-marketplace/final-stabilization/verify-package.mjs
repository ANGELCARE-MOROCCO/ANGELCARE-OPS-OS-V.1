import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
const failures = []
function check(label, value) {
  const passed = Boolean(value)
  checks.push({ label, passed })
  console.log(`  ${passed ? '✓' : '✗'} ${label}`)
  if (!passed) failures.push(label)
}
function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8')
}
function exists(relative) {
  return fs.existsSync(path.join(root, relative))
}

console.log('ANGELCARE Marketplace Final Stabilization — Package Acceptance')

const requiredFiles = [
  'app/api/angelcare-marketplace/discovery/search/route.ts',
  'angelcare-marketplace/homepage-flagship/homepage.module.css',
  'scripts/angelcare-marketplace/final-stabilization/lib.mjs',
  'scripts/angelcare-marketplace/final-stabilization/verify-static.mjs',
  'scripts/angelcare-marketplace/final-stabilization/audit-sql-security.mjs',
  'scripts/angelcare-marketplace/final-stabilization/generate-route-inventory.mjs',
  'scripts/angelcare-marketplace/final-stabilization/generate-uiux-matrix.mjs',
  'scripts/angelcare-marketplace/final-stabilization/run-typescript-authority.mjs',
  'scripts/angelcare-marketplace/final-stabilization/runtime-smoke.mjs',
  'scripts/angelcare-marketplace/final-stabilization/capture-visual-evidence.mjs',
  'scripts/angelcare-marketplace/final-stabilization/evaluate-accessibility.mjs',
  'scripts/angelcare-marketplace/final-stabilization/evaluate-performance.mjs',
  'scripts/angelcare-marketplace/final-stabilization/database-preflight.sql',
  'scripts/angelcare-marketplace/final-stabilization/run-database-preflight.mjs',
  'scripts/angelcare-marketplace/final-stabilization/evaluate-launch.mjs',
  'scripts/angelcare-marketplace/final-stabilization/run-final-stabilization.mjs',
  'angelcare-marketplace/documentation/final-stabilization/FINAL_STABILIZATION_IMPLEMENTATION_REPORT.md',
  'angelcare-marketplace/documentation/final-stabilization/FINAL_STABILIZATION_ACCEPTANCE_REPORT.md',
  'angelcare-marketplace/documentation/final-stabilization/UIUX_VISUAL_ACCEPTANCE_PROGRAM.md',
  'angelcare-marketplace/documentation/final-stabilization/SECURITY_AND_ISOLATION_ASSURANCE.md',
  'angelcare-marketplace/documentation/final-stabilization/DATABASE_AND_MIGRATION_ASSURANCE.md',
  'angelcare-marketplace/documentation/final-stabilization/ACCESSIBILITY_AND_PERFORMANCE_STANDARD.md',
  'angelcare-marketplace/documentation/final-stabilization/CUMULATIVE_ACCEPTANCE_MAP.md',
  'angelcare-marketplace/documentation/final-stabilization/WORKFLOW_ACCEPTANCE_MATRIX.md',
  'angelcare-marketplace/documentation/final-stabilization/RELEASE_RUNBOOK.md',
  'angelcare-marketplace/documentation/final-stabilization/ROLLBACK_RUNBOOK.md',
  'angelcare-marketplace/documentation/final-stabilization/POST_LAUNCH_MONITORING_PLAN.md',
  'angelcare-marketplace/documentation/final-stabilization/EXECUTIVE_HANDOVER.md',
  'angelcare-marketplace/documentation/final-stabilization/FINAL_LAUNCH_DECISION.md',
  'angelcare-marketplace/documentation/final-stabilization/DEFECT_REGISTER.json',
  'angelcare-marketplace/documentation/final-stabilization/OPERATOR_COMMANDS.md',
]
for (const file of requiredFiles) check(`required ${file}`, exists(file))

const adapter = read('app/api/angelcare-marketplace/discovery/search/route.ts')
check('Discovery adapter remains three non-empty lines', adapter.split(/\r?\n/).filter((line) => line.trim()).length <= 3)
check('Discovery adapter delegates to searchDiscovery', adapter.includes('searchDiscovery'))
check('Discovery adapter does not introduce client authority', !adapter.includes('use client'))

const css = read('angelcare-marketplace/homepage-flagship/homepage.module.css')
check('Homepage heroEyebrow class exists', /\.heroEyebrow\s*\{/.test(css))
check('Homepage reduced-motion authority remains', /prefers-reduced-motion/.test(css))
check('Homepage responsive authority remains', /@media\s*\([^)]*max-width/.test(css))
check('Homepage RTL authority remains', /\.rtl\b|\[dir=['"]?rtl/.test(css))

const requiredAssets = [
  'hero-family-marketplace.svg','hero-academy-marketplace.svg','hero-partner-os.svg','hero-international.svg',
  'family-showcase.svg','category-universal.svg','category-family.svg','category-development.svg','category-kits.svg',
  'category-academy.svg','category-institutions.svg','category-hospitality.svg','category-health.svg','category-corporate.svg',
  'category-partner-os.svg','category-quality.svg','item-home-care.svg','item-recurring-care.svg','item-mother-baby.svg',
  'item-after-school.svg','item-montessori.svg','item-autonomy-kit.svg','item-academy-safety.svg','item-academy-montessori.svg',
  'item-school-diagnostic.svg','item-hospitality.svg','item-corporate.svg','item-partner-os.svg','item-quality-check.svg',
]
for (const asset of requiredAssets) {
  const relative = `public/angelcare-marketplace/homepage/${asset}`
  check(`visual asset ${asset}`, exists(relative) && /<svg\b/.test(read(relative)))
}

const implementation = read('angelcare-marketplace/documentation/final-stabilization/FINAL_STABILIZATION_IMPLEMENTATION_REPORT.md')
check('Implementation report preserves environmental truth boundary', implementation.includes('cannot manufacture environmental evidence'))
const decision = read('angelcare-marketplace/documentation/final-stabilization/FINAL_LAUNCH_DECISION.md')
check('Launch decision is not fabricated green', decision.includes('BLOCKED'))
const database = read('angelcare-marketplace/documentation/final-stabilization/DATABASE_AND_MIGRATION_ASSURANCE.md')
check('Final stabilization requires no migration', database.includes('No new database migration is required'))
const preflight = read('scripts/angelcare-marketplace/final-stabilization/database-preflight.sql')
check('Database preflight is read-only', /begin transaction read only/i.test(preflight) && !/\b(?:insert|update|delete|truncate|drop|alter|create)\b/i.test(preflight.replace(/'[^']*'/g, '')))
const runner = read('scripts/angelcare-marketplace/final-stabilization/run-final-stabilization.mjs')
check('Stabilization runner does not build or deploy', !/npm\s+run\s+build|next\s+build|vercel\s+deploy|git\s+(?:add|commit|push)/i.test(runner))

console.log(`\nPASS ${checks.length - failures.length}/${checks.length}`)
if (failures.length) {
  console.log(`FAIL ${failures.length}`)
  for (const failure of failures) console.log(`  ✗ ${failure}`)
  process.exit(1)
}
console.log('RESULT: FINAL STABILIZATION PACKAGE ACCEPTANCE PASSED')
console.log('No TypeScript compiler, build, Git, SQL mutation, deployment or production launch was executed.')
