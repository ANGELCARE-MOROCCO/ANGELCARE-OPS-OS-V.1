const action = process.argv[2] || 'verify'
const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SEED_VERSION = 'SANILA_MASTER_DEMO_SEED_2026_09_V1'

function environmentEvidence() {
  let parsed = null
  try { parsed = new URL(rawUrl) } catch {}
  const host = parsed?.hostname || 'MISSING'
  const local = ['127.0.0.1', 'localhost', '::1'].includes(host)
  const explicit = process.env.SANILA_DEMO_NON_PRODUCTION_CONFIRM === 'YES'
  const environmentId = String(process.env.SANILA_DEMO_ENVIRONMENT_ID || '').trim()
  const productionUrl = String(process.env.SANILA_PRODUCTION_SUPABASE_URL || '').trim()
  let productionHost = ''
  try { productionHost = new URL(productionUrl).hostname } catch {}
  const productionDomainAbsent = Boolean(parsed && (!productionHost || host !== productionHost))
  const remoteProof = explicit && Boolean(environmentId) && Boolean(productionHost) && productionDomainAbsent
  const nonProduction = Boolean(parsed && (local || remoteProof))
  return { database_url_scheme: parsed?.protocol || 'MISSING', database_host: host, environment_indicator: local ? 'LOCAL_LOOPBACK' : environmentId || 'UNPROVEN_REMOTE', explicit_confirmation: explicit ? 'YES' : 'NO', production_reference_present: productionHost ? 'YES' : 'NO', production_domain_absence: productionDomainAbsent ? 'YES' : 'NO', NON_PRODUCTION: nonProduction ? 'YES' : 'NO' }
}

const evidence = environmentEvidence()
for (const [name, value] of Object.entries(evidence)) console.log(`${name.toUpperCase()}=${value}`)
if (action === 'env-check') process.exit(evidence.NON_PRODUCTION === 'YES' ? 0 : 2)
if (evidence.NON_PRODUCTION !== 'YES') throw new Error('NON_PRODUCTION proof failed. No migration, provisioning, seed, verify, or reset was executed.')
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required after non-production proof.')

const base = `${rawUrl.replace(/\/$/, '')}/rest/v1`
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
async function request(path, init = {}) { const response = await fetch(`${base}/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } }); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`); return body }
async function rpc(name, body) { return request(`rpc/${name}`, { method: 'POST', body: JSON.stringify(body) }) }

const configs = await request('sanila_demo_configs?classification=eq.master_demo&active=eq.true&select=*&limit=2')
if (configs.length !== 1) throw new Error(`Exactly one active Master Demo configuration is required; found ${configs.length}.`)
const config = configs[0]
if (config.billing_mode !== 'non_billable' || config.safety_status !== 'enforced') throw new Error('Master Demo non-billable/safety classification is invalid.')

let result
if (action === 'seed') result = await rpc('sanila_seed_master_demo', { p_config_id: config.id })
else if (action === 'verify') result = await rpc('sanila_verify_master_demo', { p_config_id: config.id })
else if (action === 'reset') {
  if (process.env.SANILA_DEMO_RESET_CONFIRM !== 'RESET SANILA MASTER DEMO') throw new Error('Set SANILA_DEMO_RESET_CONFIRM="RESET SANILA MASTER DEMO" to reset.')
  result = await rpc('sanila_reset_master_demo', { p_config_id: config.id, p_requested_by: null })
} else if (action === 'certify') {
  const firstSeed = await rpc('sanila_seed_master_demo', { p_config_id: config.id })
  const secondSeed = await rpc('sanila_seed_master_demo', { p_config_id: config.id })
  assertSameCounts(firstSeed.counts, secondSeed.counts, 'SEED_IDEMPOTENCY')
  const grantsBefore = await request(`sanila_demo_access_grants?config_id=eq.${config.id}&select=id&limit=5000`)
  const eventsBefore = await request(`sanila_demo_access_events?config_id=eq.${config.id}&select=id&limit=5000`)
  await request(`angelcare360_students?school_id=eq.${config.school_id}&student_code=eq.DEMO-STU-0001`, { method: 'PATCH', body: JSON.stringify({ full_name: 'MUTATED RESET CERTIFICATION' }) })
  const mutated = await request(`angelcare360_students?school_id=eq.${config.school_id}&student_code=eq.DEMO-STU-0001&select=full_name`)
  if (mutated[0]?.full_name !== 'MUTATED RESET CERTIFICATION') throw new Error('RESET_CERTIFICATION mutation was not applied.')
  const firstReset = await rpc('sanila_reset_master_demo', { p_config_id: config.id, p_requested_by: null })
  if (!firstReset?.ok || !firstReset?.verify?.ok) throw new Error(`RESET_CERTIFICATION first reset failed: ${JSON.stringify(firstReset)}`)
  const restored = await request(`angelcare360_students?school_id=eq.${config.school_id}&student_code=eq.DEMO-STU-0001&select=full_name`)
  if (restored[0]?.full_name === 'MUTATED RESET CERTIFICATION') throw new Error('RESET_CERTIFICATION did not restore canonical state.')
  const firstCounts = firstReset.verify.counts
  const secondReset = await rpc('sanila_reset_master_demo', { p_config_id: config.id, p_requested_by: null })
  if (!secondReset?.ok || !secondReset?.verify?.ok) throw new Error(`RESET_CERTIFICATION second reset failed: ${JSON.stringify(secondReset)}`)
  assertSameCounts(firstCounts, secondReset.verify.counts, 'RESET_IDEMPOTENCY')
  const refused = await rpc('sanila_reset_master_demo', { p_config_id: '00000000-0000-4000-a000-000000000001', p_requested_by: null })
  if (refused?.ok || refused?.code !== 'RESET_REFUSED_NOT_MASTER_DEMO') throw new Error('RESET_NORMAL_SCHOOL_REFUSAL was not proven.')
  const grantsAfter = await request(`sanila_demo_access_grants?config_id=eq.${config.id}&select=id&limit=5000`)
  const eventsAfter = await request(`sanila_demo_access_events?config_id=eq.${config.id}&select=id&limit=5000`)
  if (grantsAfter.length !== grantsBefore.length || eventsAfter.length < eventsBefore.length) throw new Error('Preserved grant/audit history invariant failed.')
  result = { ok: true, verify: secondReset.verify, seedIdempotency: true, resetIdempotency: true, canonicalMutationRestored: true, normalSchoolRefused: true, grantHistoryPreserved: true, auditHistoryPreserved: true }
} else throw new Error(`Unknown action: ${action}`)

function assertSameCounts(left, right, label) {
  if (JSON.stringify(left || {}) !== JSON.stringify(right || {})) throw new Error(`${label} count mismatch: ${JSON.stringify({ left, right })}`)
}

const verify = action === 'reset' || action === 'certify' ? result?.verify : result
const counts = verify?.counts || result?.counts || {}
console.log(`ACTION=${action.toUpperCase()}`)
console.log(`SEED_VERSION=${verify?.seed_version || result?.seed_version || config.seed_version || SEED_VERSION}`)
for (const [name, value] of Object.entries(counts)) console.log(`${name.toUpperCase()}=${value}`)
console.log(JSON.stringify(result, null, 2))
if ((action === 'verify' || action === 'reset' || action === 'certify') && !verify?.ok) process.exit(1)
