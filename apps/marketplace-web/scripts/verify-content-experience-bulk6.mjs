import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const gates = [
  'scripts/verify-content-command-mz7-route-scope.mjs',
  'scripts/verify-content-command-mz7-distribution-preflight.mjs',
  'scripts/verify-content-command-mz7-distribution-tower.mjs',
  'scripts/verify-content-command-mz7-publishing-operations.mjs',
  'scripts/verify-content-command-mz7-publication-recovery.mjs',
  'scripts/verify-content-command-mz7-release-lineage.mjs',
  'scripts/verify-content-command-mz7-validation-chamber.mjs',
  'scripts/verify-content-command-mz7-validation-decisions.mjs',
  'scripts/verify-content-command-mz7-no-fabricated-release.mjs',
  'scripts/verify-content-command-mz7-css-references.mjs',
  'scripts/verify-content-command-mz7-accessibility.mjs',
  'scripts/verify-content-command-mz7-backend-boundaries.mjs',
  'scripts/verify-content-command-mz7-portability.mjs',
  'scripts/verify-content-command-mz7-mz1-mz6-preservation.mjs',
]

for (const gate of gates) {
  if (!fs.existsSync(gate)) throw new Error(`Bulk 6 verification gate missing: ${gate}`)
  console.log(`\n=== ${gate} ===`)
  const result = spawnSync(process.execPath, [gate], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}

console.log(`\nPASS — ${gates.length} Bulk 6 static authority gates passed`)
