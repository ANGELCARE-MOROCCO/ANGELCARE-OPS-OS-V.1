#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()

const root =
  fs.existsSync(
    path.join(
      cwd,
      'apps',
      'ops-web',
    ),
  )
    ? path.join(
        cwd,
        'apps',
        'ops-web',
      )
    : cwd
const checks = []

function checkFile(relative, markers = []) {
  const file = path.join(root, relative)
  if (!fs.existsSync(file)) {
    checks.push({ ok: false, label: `missing ${relative}` })
    return
  }
  const source = fs.readFileSync(file, 'utf8')
  checks.push({ ok: true, label: `exists ${relative}` })
  for (const marker of markers) {
    checks.push({ ok: source.includes(marker), label: `${relative} contains ${marker}` })
  }
}

const required = [
  ['lib/runtime/governor/types.ts', ['ANGELCARE_WORKLOAD_CLASSES']],
  ['lib/runtime/governor/config.ts', ['OPS_GOVERNOR_GLOBAL_BURST_CAPACITY']],
  ['lib/runtime/governor/semaphore.ts', ['ZREMRANGEBYSCORE', 'failClosedWhenRedisConfigured']],
  ['lib/runtime/governor/route.ts', ['ANGELCARE_GOVERNOR_SATURATED']],
  ['lib/runtime/governor/burst.ts', ['consumeAngelCareGlobalBurstToken']],
  ['lib/runtime/governor/performance.ts', ['emailQueue', 'eventLoop', 'containerMemory']],
  ['lib/email-os-core/worker-auth.ts', ['EMAIL_OS_WORKER_SECRET', 'timingSafeEqual']],
  ['app/api/opsos-control-plane/performance/route.ts', ['requirePerformanceOperator']],
  ['app/api/opsos-control-plane/performance/synthetic/route.ts', ['OPS_GOVERNOR_TEST_UNAUTHORIZED']],
  ['app/(protected)/opsos-control-plane/performance/page.tsx', ['PerformanceCapacityCockpit']],
  ['components/opsos-control-plane/PerformanceCapacityCockpit.tsx', ['System pressure']],
  ['app/api/email-os/cron/queue-worker/route.ts', ['authorizeEmailOSWorkerRequest']],
  ['app/api/email-os/dispatch-now/route.ts', ['x-angelcare-worker-secret']],
]

for (const [relative, markers] of required) checkFile(relative, markers)

const manifestPath = path.join(root, 'scripts/phase2-final/governed-routes.json')
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const governed = Array.isArray(manifest.governed) ? manifest.governed : []
  checks.push({ ok: governed.length >= 5, label: `governed route count >= 5 (${governed.length})` })
} else {
  checks.push({ ok: false, label: 'governed-routes.json exists' })
}

const failures = checks.filter((item) => !item.ok)
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}: ${item.label}`)

console.log('============================================================')
console.log(`PHASE_II_FINAL_SOURCE_CHECKS=${checks.length}`)
console.log(`PHASE_II_FINAL_SOURCE_FAILURES=${failures.length}`)
console.log('============================================================')

if (failures.length) process.exit(1)
