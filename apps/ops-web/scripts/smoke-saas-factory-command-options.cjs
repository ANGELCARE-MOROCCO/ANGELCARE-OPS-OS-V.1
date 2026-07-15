#!/usr/bin/env node
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function readJson(path, init) {
  const response = await fetch(`${BASE_URL}${path}`, init)
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch (error) { throw new Error(`${path} returned non-JSON: ${text.slice(0, 120)}`) }
  if (!response.ok || data.ok === false) throw new Error(`${path} failed: ${data.error || data.reason || response.status}`)
  return data
}

async function main() {
  const summary = await readJson('/api/saas-factory/options/summary?reason=smoke')
  if (!summary.summary || !summary.summary.metrics) throw new Error('Summary payload missing metrics')
  const validation = await readJson('/api/saas-factory/options/validate')
  if (!Array.isArray(validation.warnings) || !Array.isArray(validation.failed)) throw new Error('Validation payload missing warnings/failed arrays')
  const blocked = await readJson('/api/saas-factory/options/actions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'blocked_delete', payload: { group_key: 'smoke', value: 'unsafe-delete' } }),
  })
  if (blocked.blocked !== true) throw new Error('Blocked delete action did not return blocked=true')
  const exportResponse = await fetch(`${BASE_URL}/api/saas-factory/options/export?format=json`)
  if (!exportResponse.ok) throw new Error('Export endpoint failed')
  const disposition = exportResponse.headers.get('content-disposition') || ''
  if (!disposition.includes('saas-factory-options-registry')) throw new Error('Export endpoint missing download filename')
  console.log('SaaS Factory Options smoke test passed.')
  console.log(`Base URL: ${BASE_URL}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
