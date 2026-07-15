const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init)
  const text = await response.text()
  try { return JSON.parse(text) } catch { throw new Error(`${path} did not return JSON: ${text.slice(0, 120)}`) }
}

async function main() {
  const summary = await json('/api/saas-factory/actions/summary')
  for (const key of ['actions', 'executions', 'policies', 'categories', 'modules']) {
    if (!Array.isArray(summary[key])) throw new Error(`summary.${key} must be array`)
  }

  const validation = await json('/api/saas-factory/actions/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey: 'validate_action_registry', payload: {}, actor: 'smoke' }),
  })
  if (!validation.ok) throw new Error(validation.message || 'validate_action_registry failed')

  const blocked = await json('/api/saas-factory/actions/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey: 'hard_delete_action', payload: { actionKey: 'smoke', reason: 'smoke' }, actor: 'smoke' }),
  })
  if (blocked.ok) throw new Error('hard_delete_action should be blocked')

  await json('/api/saas-factory/actions/export?format=json')
  console.log('SaaS Factory Actions smoke passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
