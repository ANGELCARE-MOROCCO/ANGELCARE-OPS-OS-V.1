import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '')
  }
}

loadEnv()

const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const getArg = (name, fallback = '') => {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] : fallback
}

const orgId = getArg('--org-id', '').trim()
const allowNonSmoke = has('--allow-non-smoke')
const execute = has('--execute') && has('--yes')

if (!orgId || !execute) {
  console.log('Usage:')
  console.log('  node --env-file=.env.local scripts/traininghub-hard-delete-partner-v2.mjs --org-id ORG_ID --execute --yes')
  console.log('')
  console.log('For real non-smoke partners only if you really mean permanent destruction:')
  console.log('  add --allow-non-smoke')
  process.exit(orgId ? 0 : 1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data, error } = await supabase.rpc('traininghub_force_delete_partner_v3', {
  p_organization_id: orgId,
  p_allow_non_smoke: allowNonSmoke,
})

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-hard-delete-partner-v3-report.json', JSON.stringify({ orgId, allowNonSmoke, data, error }, null, 2))

console.log('\nTrainingHub hard delete partner v3')
console.log('Org:', orgId)
console.log('Report: tmp/traininghub-hard-delete-partner-v3-report.json')

if (error) {
  console.error('\nRPC error:', error.message)
  console.error('\nMost likely fix: run database/traininghub_force_delete_partner_v3.sql in Supabase SQL editor, then rerun this command.')
  process.exit(1)
}

console.log(JSON.stringify(data, null, 2))

if (!data?.ok) {
  console.error('\nHard delete returned ok=false. Paste the JSON above, especially finalError.')
  process.exit(1)
}

console.log('\n✅ Deleted permanently.')
