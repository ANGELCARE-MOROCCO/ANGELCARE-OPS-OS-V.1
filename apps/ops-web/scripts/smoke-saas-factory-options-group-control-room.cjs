const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
async function j(path, init) {
  const res = await fetch(`${baseUrl}${path}`, init)
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`${path} did not return JSON: ${text.slice(0, 120)}`) }
}
async function main() {
  const summary = await j('/api/saas-factory/options/summary')
  for (const key of ['groupPolicies', 'optionTemplates', 'options', 'optionGroups']) {
    if (!Array.isArray(summary[key])) throw new Error(`${key} must be array`)
  }
  const result = await j('/api/saas-factory/options/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_option_to_group', payload: { label: 'Smoke Group Option', groupName: 'general', type: 'select', moduleScope: ['saas-factory'], pageScope: ['/saas-factory-command/options'], modalScope: ['Create Governed Option'] }, actor: 'smoke' }),
  })
  if (!result.ok) throw new Error(result.message || 'add_option_to_group failed')
  console.log('Options group control smoke passed.')
}
main().catch((error) => { console.error(error); process.exit(1) })
