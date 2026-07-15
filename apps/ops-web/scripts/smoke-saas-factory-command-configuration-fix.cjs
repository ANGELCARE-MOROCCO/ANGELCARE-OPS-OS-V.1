const base = process.env.APP_URL || 'http://localhost:3000'
async function hit(path, init) {
  const response = await fetch(`${base}${path}`, init)
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { throw new Error(`${path} returned non-JSON: ${response.status} ${text.slice(0, 120)}`) }
  if (!response.ok && response.status !== 409) throw new Error(`${path} failed: ${response.status} ${text.slice(0, 300)}`)
  console.log(`✓ ${path} ${response.status}`)
  return json
}
async function main() {
  await hit('/api/saas-factory/configuration')
  await hit('/api/saas-factory/configuration/validate', { method: 'POST' })
  await hit('/api/saas-factory/configuration/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmed: false }) })
  await hit('/api/saas-factory/configuration/rollback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmed: false }) })
  await hit('/api/saas-factory/configuration/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'hard-delete' }) })
  const csv = await fetch(`${base}/api/saas-factory/configuration/export?dataset=options&format=csv`)
  const text = await csv.text()
  if (!csv.ok || text.trim().startsWith('<')) throw new Error('export returned invalid response')
  console.log('✓ /api/saas-factory/configuration/export?dataset=options&format=csv '+csv.status)
  console.log('SAAS FACTORY CONFIGURATION FIX SMOKE PASSED')
}
main().catch((error) => { console.error(error); process.exit(1) })
