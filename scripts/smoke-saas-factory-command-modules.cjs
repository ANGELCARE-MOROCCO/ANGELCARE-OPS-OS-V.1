#!/usr/bin/env node
const base = process.env.SAAS_FACTORY_BASE_URL || 'http://localhost:3000'

async function check(path, init) {
  const res = await fetch(`${base}${path}`, init)
  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!res.ok && res.status !== 207 && res.status !== 409) throw new Error(`${path} failed: ${res.status} ${text.slice(0, 300)}`)
  return { status: res.status, body }
}

async function main() {
  console.log(`Smoking SaaS Factory Modules against ${base}`)
  const state = await check('/api/saas-factory/modules/command-state')
  console.log(`✓ command-state ${state.status} modules=${state.body.modules?.length || 0}`)
  const first = state.body.modules?.[0]?.key
  const diag = await check('/api/saas-factory/modules/diagnostics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ moduleKeys: first ? [first] : [] }) })
  console.log(`✓ diagnostics ${diag.status} checks=${diag.body.checks?.length || 0}`)
  const sync = await check('/api/saas-factory/modules/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: first ? 'selected' : 'all', moduleKeys: first ? [first] : [] }) })
  console.log(`✓ sync ${sync.status} requested=${sync.body.summary?.requested ?? 0}`)
  if (first) {
    const detail = await check(`/api/saas-factory/modules/${encodeURIComponent(first)}`)
    console.log(`✓ detail ${detail.status} key=${detail.body.module?.key}`)
    const blocked = await check('/api/saas-factory/modules/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete', payload: { key: first } }) })
    if (!blocked.body.blocked) throw new Error('Delete action was not blocked')
    console.log(`✓ unsafe delete blocked ${blocked.status}`)
  }
  const exportJson = await fetch(`${base}/api/saas-factory/modules/export?format=json`)
  if (!exportJson.ok) throw new Error(`export failed ${exportJson.status}`)
  console.log(`✓ export json ${exportJson.status}`)
}

main().catch((error) => { console.error(error); process.exit(1) })
