const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
async function j(path, init) {
  const r = await fetch(`${baseUrl}${path}`, init)
  const t = await r.text()
  try { return JSON.parse(t) } catch { throw new Error(`${path} did not return JSON: ${t.slice(0,120)}`) }
}
async function main() {
  const summary = await j('/api/saas-factory/actions/summary')
  for (const key of ['actions','policies','dependencies','executions']) if (!Array.isArray(summary[key])) throw new Error(`${key} must be array`)
  const dry = await j('/api/saas-factory/actions/execute', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ actionKey:'sync_options_runtime', mode:'dry_run', payload:{targetGroup:'general', reason:'smoke'} }) })
  if (!dry.execution) throw new Error('dry-run did not return execution')
  const blocked = await j('/api/saas-factory/actions/execute', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ actionKey:'hard_delete_action', payload:{actionKey:'x', reason:'smoke'} }) })
  if (blocked.ok) throw new Error('hard delete should be blocked')
  console.log('Actions operational smoke passed.')
}
main().catch((e)=>{console.error(e);process.exit(1)})
