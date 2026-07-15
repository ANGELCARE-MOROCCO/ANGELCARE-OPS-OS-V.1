#!/usr/bin/env node
const base = process.env.SAAS_FACTORY_BASE_URL || 'http://localhost:3000'
const endpoints = [
  ['GET', '/api/saas-factory/overview'],
  ['POST', '/api/saas-factory/overview/refresh'],
  ['POST', '/api/saas-factory/overview/scan'],
  ['POST', '/api/saas-factory/overview/diagnostics'],
  ['POST', '/api/saas-factory/modules/sync'],
  ['GET', '/api/saas-factory/audit/recent?limit=10'],
  ['POST', '/api/saas-factory/system/actions'],
  ['GET', '/api/saas-factory/audit/export?format=json'],
]
async function main() {
  console.log('SAAS FACTORY COMMAND OVERVIEW SMOKE')
  console.log('===================================')
  for (const [method, path] of endpoints) {
    const body = path.includes('/system/actions') ? JSON.stringify({ action: 'View Queue Summary', payload: { smoke: true } }) : undefined
    const res = await fetch(`${base}${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body })
    const text = await res.text()
    if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${text.slice(0, 500)}`)
    if (!text.includes('ok') && !path.includes('/audit/export')) throw new Error(`${method} ${path} did not return an ok payload`)
    console.log(`✓ ${method} ${path} ${res.status}`)
  }
  console.log('Ready.')
}
main().catch((error) => { console.error(error.message || error); process.exit(1) })
