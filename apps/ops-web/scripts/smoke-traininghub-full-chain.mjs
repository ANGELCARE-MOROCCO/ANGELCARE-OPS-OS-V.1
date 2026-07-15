import { spawnSync } from 'node:child_process'

const commands = [
  ['Partner onboarding', 'scripts/smoke-traininghub-partner-lifecycle.mjs'],
  ['Revenue → delivery chain', 'scripts/smoke-traininghub-revenue-lifecycle.mjs'],
  ['Delivery → certification chain', 'scripts/smoke-traininghub-delivery-certification.mjs'],
  ['Partner isolation', 'scripts/verify-traininghub-partner-isolation.mjs'],
  ['Production sync', 'scripts/verify-traininghub-production-sync.mjs'],
  ['Final production gate', 'scripts/verify-traininghub-final-production-gate.mjs'],
]

for (const [label, script] of commands) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`▶ ${label}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  const result = spawnSync(process.execPath, ['--env-file=.env.local', script], {
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    console.error(`\n❌ Full chain smoke failed at: ${label}`)
    process.exit(result.status || 1)
  }
}

console.log('\n✅ TrainingHub full chain smoke PASSED.')
