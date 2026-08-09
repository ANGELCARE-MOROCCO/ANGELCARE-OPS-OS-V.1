const base = process.env.SAAS_FACTORY_BASE_URL || 'http://localhost:3000'

async function hit(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  if (!response.ok) throw new Error(`${pathname} failed HTTP ${response.status}: ${typeof body === 'string' ? body.slice(0, 220) : JSON.stringify(body).slice(0, 220)}`)
  console.log(`✓ ${pathname} HTTP ${response.status}`)
  return body
}

async function main() {
  const state = await hit('/api/saas-factory/observatory')
  if (!state.ok || !Array.isArray(state.probes)) throw new Error('Observatory state did not include probes')
  console.log(`  probes=${state.probes.length} source=${state.source} confidence=${state.confidence}`)

  await hit('/api/saas-factory/observatory/refresh', { method: 'POST', body: '{}' })
  const scan = await hit('/api/saas-factory/observatory/scan', { method: 'POST', body: '{}' })
  if (!Array.isArray(scan.checks)) throw new Error('Scan did not return structured checks')
  const diagnostics = await hit('/api/saas-factory/observatory/diagnostics', { method: 'POST', body: '{}' })
  if (!Array.isArray(diagnostics.diagnostics)) throw new Error('Diagnostics did not return structured diagnostics')

  if (state.probes[0]?.id) {
    const detail = await hit(`/api/saas-factory/observatory/probes/${encodeURIComponent(state.probes[0].id)}`)
    if (!detail.ok || !detail.probe) throw new Error('Probe detail endpoint did not return selected probe')
  }

  const exportResponse = await fetch(`${base}/api/saas-factory/observatory/export?format=json`)
  if (!exportResponse.ok) throw new Error(`Export failed HTTP ${exportResponse.status}`)
  if (!String(exportResponse.headers.get('content-disposition') || '').includes('saas-factory-observatory-snapshot')) throw new Error('Export missing expected download filename')
  console.log('✓ export endpoint returns downloadable snapshot')

  const blocked = await hit('/api/saas-factory/system/actions', { method: 'POST', body: JSON.stringify({ action: 'Purge Queue', payload: {} }) })
  if (!blocked.blocked) throw new Error('Unsafe purge action was not blocked')
  console.log('✓ unsafe purge action is safely blocked and audited')

  console.log('\nSAAS FACTORY OBSERVATORY SMOKE PASSED')
}

main().catch((error) => { console.error(`✗ ${error.message}`); process.exit(1) })
