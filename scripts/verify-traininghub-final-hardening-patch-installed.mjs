import fs from 'node:fs'

const requiredFiles = [
  'scripts/verify-traininghub-production-hardening-static.mjs',
  'scripts/traininghub-final-production-completion-gate.mjs',
  'scripts/traininghub-e2e-prod-journey-smoke.mjs',
  'scripts/traininghub-production-safe-cleanup-report.mjs',
  'docs/traininghub/PRODUCTION_COMPLETION_CHECKLIST.md',
  'database/traininghub_production_hardening_audit.sql',
  'lib/traininghub/production-gate-manifest.ts',
]

const packageText = fs.existsSync('package.json') ? fs.readFileSync('package.json', 'utf8') : ''

const checks = [
  ...requiredFiles.map((file) => [file, fs.existsSync(file)]),
  ['package script traininghub:prod-gate', packageText.includes('"traininghub:prod-gate"')],
  ['package script traininghub:prod-gate:full', packageText.includes('"traininghub:prod-gate:full"')],
  ['package script traininghub:e2e', packageText.includes('"traininghub:e2e"')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub final hardening patch installation verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub final hardening patch installation verification PASSED.')
