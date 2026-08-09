#!/usr/bin/env node
import { spawn } from 'node:child_process'
const port = Number(process.env.ANGELCARE_FULL_ADMIN_SMOKE_PORT || 3227)
const base = `http://127.0.0.1:${port}`
const views = ['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions']
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', String(port)], { stdio: ['ignore','pipe','pipe'], env: { ...process.env, PORT: String(port) } })
let logs = ''
child.stdout.on('data', (chunk) => { logs += chunk.toString() })
child.stderr.on('data', (chunk) => { logs += chunk.toString() })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
try {
  let ready = false
  for (let index = 0; index < 90; index += 1) {
    await sleep(1000)
    try { const response = await fetch(`${base}/angelcare-360-operator/tenants-product?view=catalogue`, { redirect: 'manual' }); if (response.status < 500) { ready = true; break } } catch {}
  }
  if (!ready) throw new Error('Next.js dev server did not become ready')
  for (const view of views) {
    const response = await fetch(`${base}/angelcare-360-operator/tenants-product?view=${view}`, { redirect: 'manual' })
    if (response.status >= 500) throw new Error(`${view} returned ${response.status}`)
    console.log(`PASS ${view} -> ${response.status}`)
  }
  for (const marker of ['Functions cannot be passed directly','Hydration failed','Unhandled Runtime Error','ERR_MODULE_NOT_FOUND']) {
    if (logs.includes(marker)) throw new Error(`Runtime log contains: ${marker}`)
  }
  console.log('PASS runtime route crawl and RSC/hydration log scan')
} finally {
  child.kill('SIGTERM')
}
