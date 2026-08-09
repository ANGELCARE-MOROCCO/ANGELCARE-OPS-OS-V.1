import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { projectRoot } from './lib.mjs'

const root = projectRoot()
const scriptRoot = path.join(root, 'scripts/angelcare-marketplace/final-stabilization')
const flags = new Set(process.argv.slice(2))
const all = flags.has('--all')
const tasks = [
  ['Static cumulative authority', 'verify-static.mjs', true],
  ['SQL and source-security authority', 'audit-sql-security.mjs', true],
  ['Route inventory', 'generate-route-inventory.mjs', true],
  ['UI/UIX source matrix', 'generate-uiux-matrix.mjs', true],
  ['TypeScript authority', 'run-typescript-authority.mjs', all || flags.has('--typescript')],
  ['Runtime smoke', 'runtime-smoke.mjs', all || flags.has('--runtime')],
  ['Visual acceptance', 'capture-visual-evidence.mjs', all || flags.has('--visual')],
  ['Database preflight', 'run-database-preflight.mjs', all || flags.has('--database')],
  ['Accessibility acceptance', 'evaluate-accessibility.mjs', all || flags.has('--accessibility')],
  ['Performance acceptance', 'evaluate-performance.mjs', all || flags.has('--performance')],
]

let failed = false
for (const [label, file, enabled] of tasks) {
  if (!enabled) {
    console.log(`SKIP: ${label}`)
    continue
  }
  console.log(`\n=== ${label.toUpperCase()} ===`)
  const extra = file === 'capture-visual-evidence.mjs' && flags.has('--full') ? ['--full'] : []
  const result = spawnSync(process.execPath, [path.join(scriptRoot, file), ...extra], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) failed = true
}

console.log('\n=== FINAL LAUNCH EVALUATION ===')
const decision = spawnSync(process.execPath, [path.join(scriptRoot, 'evaluate-launch.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})
if (decision.status !== 0) failed = true

console.log('\nNo build, Git operation, SQL execution, deployment or production launch was performed.')
process.exitCode = failed ? 1 : 0
