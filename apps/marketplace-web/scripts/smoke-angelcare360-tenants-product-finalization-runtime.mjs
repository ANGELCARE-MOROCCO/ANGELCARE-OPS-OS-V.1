import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const root = process.cwd()
const port = Number(process.env.ANGELCARE_TENANTS_PRODUCT_SMOKE_PORT || 3231)
const logFile = path.join(os.tmpdir(), `angelcare-tenants-product-finalization-${Date.now()}.log`)
const log = fs.createWriteStream(logFile)
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
child.stdout.pipe(log); child.stderr.pipe(log)
const base = `http://127.0.0.1:${port}`
const views = ['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions']
const routes = views.map((view) => `/angelcare-360-operator/tenants-product?view=${view}`)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitReady() {
  for (let i = 0; i < 90; i++) {
    try { const response = await fetch(base, { redirect: 'manual' }); if (response.status < 500) return }
    catch {}
    await sleep(1000)
  }
  throw new Error('Next.js did not become ready within 90 seconds.')
}
let failed = false
try {
  await waitReady()
  for (const route of routes) {
    const response = await fetch(`${base}${route}`, { redirect: 'manual' })
    const body = await response.text()
    const ok = response.status < 500 && !/Functions cannot be passed directly to Client Components|Unhandled Runtime Error|Application error/i.test(body)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${route} -> ${response.status}`)
    if (!ok) failed = true
  }
  await sleep(1500)
} finally {
  child.kill('SIGTERM')
  await sleep(800)
  log.end()
}
const output = fs.readFileSync(logFile, 'utf8')
const forbidden = [/Functions cannot be passed directly to Client Components/i,/hydration failed/i,/hydration mismatch/i,/Unhandled Runtime Error/i,/TypeError:.*is not a function/i,/ReferenceError:/i]
for (const pattern of forbidden) {
  const hit = pattern.test(output)
  console.log(`${hit ? 'FAIL' : 'PASS'}  runtime log excludes ${pattern}`)
  if (hit) failed = true
}
console.log(`Runtime log: ${logFile}`)
if (failed) process.exit(1)
console.log('Tenants & Product finalization runtime route smoke passed.')
