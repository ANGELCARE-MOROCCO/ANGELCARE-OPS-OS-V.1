#!/usr/bin/env node
import { spawn } from 'node:child_process'

const port = Number(process.env.ANGELCARE_REVENUE_SMOKE_PORT || 3231)
const base = `http://127.0.0.1:${port}`
const cookie = process.env.ANGELCARE_OPERATOR_COOKIE || ''
const modes = ['command','markets','pipeline','offers','contracts','portfolio','health','performance']
const patterns = [/Functions cannot be passed directly to Client Components/i,/hydration failed/i,/Unhandled Runtime Error/i,/Internal Server Error/i,/ReferenceError:/i]
const child = spawn('npm', ['run','dev','--','--port',String(port)], { stdio: ['ignore','pipe','pipe'], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } })
let logs = ''
child.stdout.on('data', (data) => { logs += data.toString(); process.stdout.write(data) })
child.stderr.on('data', (data) => { logs += data.toString(); process.stderr.write(data) })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function wait() { for (let i=0;i<120;i+=1) { try { const r=await fetch(`${base}/angelcare-360-operator/growth?view=command`, { redirect:'manual', headers: cookie ? { cookie } : {} }); if (r.status < 500) return } catch {} await sleep(500) } throw new Error('Next.js did not become ready.') }
let failed = false
try {
  await wait()
  for (const mode of modes) {
    const url = `${base}/angelcare-360-operator/growth?view=${mode}`
    const response = await fetch(url, { redirect:'manual', headers: cookie ? { cookie } : {} })
    const body = await response.text()
    const bad = response.status >= 500 || patterns.some((pattern) => pattern.test(body))
    console.log(`${bad ? 'FAIL' : 'PASS'} ${mode} -> ${response.status}`)
    if (bad) failed = true
  }
  if (patterns.some((pattern) => pattern.test(logs))) { console.error('FAIL: runtime log signature detected.'); failed = true }
} finally {
  child.kill('SIGTERM')
  await sleep(500)
  if (!child.killed) child.kill('SIGKILL')
}
if (failed) process.exit(1)
console.log('PASS: eight-scene route crawl completed without known RSC/hydration/server-error signatures.')
