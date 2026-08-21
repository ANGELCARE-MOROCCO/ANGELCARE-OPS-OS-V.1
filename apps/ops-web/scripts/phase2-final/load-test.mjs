#!/usr/bin/env node

const baseUrl = String(
  process.env.ANGELCARE_LOAD_BASE_URL ||
  process.env.BASE_URL ||
  'http://127.0.0.1:3000',
).replace(/\/+$/, '')

const secret = String(
  process.env.OPS_GOVERNOR_TEST_SECRET || '',
).trim()

const stageArg = process.argv.find((value) => value.startsWith('--stages='))
const delayArg = process.argv.find((value) => value.startsWith('--delay='))
const classArg = process.argv.find((value) => value.startsWith('--class='))

const stages = (stageArg?.split('=')[1] || '10,25,50,100')
  .split(',')
  .map(Number)
  .filter((value) => Number.isInteger(value) && value > 0 && value <= 500)

const delayMs = Math.max(0, Math.min(3000, Number(delayArg?.split('=')[1] || 200)))
const workloadClass = String(classArg?.split('=')[1] || 'mutation')

if (!secret) {
  console.error('FAIL: OPS_GOVERNOR_TEST_SECRET is required.')
  process.exit(1)
}

function percentile(values, p) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1))
  return Math.round(sorted[index] * 100) / 100
}

async function oneRequest(index) {
  const started = performance.now()
  try {
    const response = await fetch(
      `${baseUrl}/api/opsos-control-plane/performance/synthetic`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-angelcare-governor-test-secret': secret,
        },
        body: JSON.stringify({
          workloadClass,
          delayMs,
          index,
        }),
        signal: AbortSignal.timeout(15000),
      },
    )

    const elapsedMs = performance.now() - started
    const body = await response.json().catch(() => ({}))

    return {
      status: response.status,
      elapsedMs,
      code: body?.code || null,
    }
  } catch (error) {
    return {
      status: 0,
      elapsedMs: performance.now() - started,
      code: error instanceof Error ? error.name : 'ERROR',
    }
  }
}

async function runStage(concurrency) {
  const started = performance.now()
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, index) => oneRequest(index)),
  )
  const wallMs = performance.now() - started

  const latencies = results.map((item) => item.elapsedMs)
  const counts = new Map()
  for (const item of results) counts.set(item.status, (counts.get(item.status) || 0) + 1)

  const ok = results.filter((item) => item.status >= 200 && item.status < 300).length
  const controlled = results.filter((item) => item.status === 429 || item.status === 503).length
  const unexpected = results.length - ok - controlled
  const throughput = wallMs > 0 ? results.length / (wallMs / 1000) : 0

  const verdict = unexpected > 0
    ? 'FAIL'
    : ok > 0
      ? 'PASS'
      : controlled === results.length
        ? 'PARTIAL'
        : 'FAIL'

  return {
    concurrency,
    workloadClass,
    delayMs,
    total: results.length,
    ok,
    controlled,
    unexpected,
    p50Ms: percentile(latencies, 0.5),
    p95Ms: percentile(latencies, 0.95),
    p99Ms: percentile(latencies, 0.99),
    wallMs: Math.round(wallMs * 100) / 100,
    throughputRps: Math.round(throughput * 100) / 100,
    statusCounts: Object.fromEntries([...counts.entries()].sort((a, b) => a[0] - b[0])),
    verdict,
  }
}

console.log('============================================================')
console.log(' ANGELCARE PHASE II — SYNTHETIC LOAD ACCEPTANCE')
console.log('============================================================')
console.log(`BASE_URL=${baseUrl}`)
console.log(`WORKLOAD_CLASS=${workloadClass}`)
console.log(`DELAY_MS=${delayMs}`)
console.log(`STAGES=${stages.join(',')}`)
console.log('BUSINESS_DATA_MUTATION=NO')
console.log('REAL_EMAIL_SEND=NO')

const outputs = []
for (const concurrency of stages) {
  const result = await runStage(concurrency)
  outputs.push(result)
  console.log(`STAGE_${concurrency}=${JSON.stringify(result)}`)
  await new Promise((resolve) => setTimeout(resolve, 750))
}

const highestPass = outputs.filter((item) => item.verdict === 'PASS').at(-1)?.concurrency || 0
const overall = outputs.some((item) => item.unexpected > 0) ? 'FAIL' : 'PASS'

console.log('============================================================')
console.log(`LOAD_TEST=${overall}`)
console.log(`HIGHEST_CONTROLLED_CONCURRENCY=${highestPass}`)
console.log('============================================================')

process.exit(overall === 'PASS' ? 0 : 1)
