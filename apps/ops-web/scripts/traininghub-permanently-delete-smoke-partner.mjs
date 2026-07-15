import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) process.env[key] = rest.join('=').replace(/^["']|["']$/g, '')
  }
}

loadEnv()

const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const getArg = (name, fallback = '') => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const orgId = getArg('--org-id', '').trim()
const force = has('--force-confirmed')
const execute = has('--execute') && has('--yes')

if (!orgId || !execute) {
  console.log('Usage:')
  console.log('  node --env-file=.env.local scripts/traininghub-permanently-delete-smoke-partner.mjs --org-id ORG_ID --execute --yes')
  console.log('  node --env-file=.env.local scripts/traininghub-permanently-delete-smoke-partner.mjs --org-id ORG_ID --force-confirmed --execute --yes')
  process.exit(orgId ? 0 : 1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data, error } = await supabase.rpc('traininghub_hard_delete_partner_cascade', {
  p_org_id: orgId,
  p_confirm_text: force ? 'I_UNDERSTAND_DELETE_PARTNER_PERMANENTLY' : null,
})

if (error) {
  console.error('RPC failed:', error.message)
  console.error('Run database/traininghub_smoke_partner_hard_delete.sql in Supabase SQL editor, then retry.')
  process.exit(1)
}

console.log('\nTrainingHub permanent partner delete result')
console.log(JSON.stringify(data, null, 2))

if (data?.ok === false) process.exit(1)
console.log('\n✅ Partner permanently deleted or already absent.')
