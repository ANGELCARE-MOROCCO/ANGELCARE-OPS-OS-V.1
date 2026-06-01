const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
async function json(path, init) {
  const res = await fetch(`${baseUrl}${path}`, init)
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`${path} did not return JSON: ${text.slice(0, 100)}`) }
}
async function main() {
  const summary = await json('/api/saas-factory/options/summary')
  for (const key of ['options','optionGroups','modulesImpacted','pageContexts','modalContexts','workflowContexts','dependencyGraph']) {
    if (!Array.isArray(summary[key])) throw new Error(`summary.${key} is not an array`)
  }
  const create = await json('/api/saas-factory/options/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_option', payload: { label: 'Smoke Deep Option', moduleScope: ['saas-factory'], pageScope: ['/saas-factory-command/options'], modalScope: ['Create Governed Option'], workflowScope: ['validation'], allowedValues: ['on','off'] }, actor: 'smoke' }),
  })
  if (!create.ok) throw new Error(create.message || 'create_option failed')
  console.log('Options deep authoring smoke passed.')
}
main().catch((error) => { console.error(error); process.exit(1) })
