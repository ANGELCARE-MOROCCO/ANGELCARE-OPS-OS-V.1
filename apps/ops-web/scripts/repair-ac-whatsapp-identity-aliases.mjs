import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './ac-whatsapp-load-env.mjs'

const commit = process.argv.includes('--commit')
const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'), { auth: { persistSession: false } })
const [conversations, contacts] = await Promise.all([
  supabase.from('ac_whatsapp_conversations').select('*').limit(10000),
  supabase.from('ac_whatsapp_contacts').select('*').limit(10000),
])
if (conversations.error) throw conversations.error
if (contacts.error) throw contacts.error
const byId = new Map((contacts.data || []).map(row => [row.id, row]))
const report = { commit, planned: [], applied: [], skipped: [] }
for (const row of conversations.data || []) {
  const remote = row.remote_chat_id ?? row.chat_id ?? row.whatsapp_chat_id
  if (!remote || !row.contact_id) continue
  const identityType = /@lid$/i.test(String(remote)) ? 'lid' : /@c\.us$/i.test(String(remote)) ? 'c_us' : 'remote_chat'
  const contact = byId.get(row.contact_id)
  const e164 = contact?.phone_e164 && /^\+[1-9]\d{7,14}$/.test(contact.phone_e164) ? contact.phone_e164 : null
  const planned = { contact_id: row.contact_id, account_id: row.account_id || null, identity_type: identityType, identity_value: String(remote), canonical_e164: e164, confidence: identityType === 'lid' ? 85 : 70, source: 'mz7-safe-repair' }
  report.planned.push(planned)
  if (commit) {
    const result = await supabase.from('ac_whatsapp_contact_identities').upsert(planned, { onConflict: 'account_id,identity_type,identity_value' })
    result.error ? report.skipped.push({ row: planned, error: result.error.message }) : report.applied.push(planned)
  }
}
const out = `ac-whatsapp-identity-alias-repair-${Date.now()}.json`
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(`${commit ? 'PASS' : 'DRY RUN'}: ${out}`)
console.log({ planned: report.planned.length, applied: report.applied.length, skipped: report.skipped.length })
