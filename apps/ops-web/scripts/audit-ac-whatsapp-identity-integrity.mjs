import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { loadedEnvFiles, requireEnv } from './ac-whatsapp-load-env.mjs'

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')
const serviceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY')
const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

const [contacts, conversations] = await Promise.all([
  supabase.from('ac_whatsapp_contacts').select('*').limit(10000),
  supabase.from('ac_whatsapp_conversations').select('*').limit(10000),
])
if (contacts.error) throw contacts.error
if (conversations.error) throw conversations.error

const digits = value => String(value ?? '').replace(/\D/g, '')
const weakName = value => ['', 'unknown', '[unknown]', 'inconnu', '[inconnu]', 'contact', 'whatsapp'].includes(String(value ?? '').trim().toLowerCase())
const report = { generatedAt: new Date().toISOString(), envFilesLoaded: loadedEnvFiles().map(v => v.replace(process.env.HOME || '', '~')), contacts: [], conversations: [] }

for (const row of contacts.data || []) {
  const name = row.display_name ?? row.name ?? row.contact_name
  const phone = row.phone_e164 ?? row.e164 ?? row.phone
  const remote = row.remote_chat_id ?? row.whatsapp_id ?? row.remote_id
  const issues = []
  if (weakName(name)) issues.push('WEAK_NAME')
  if (remote && /@lid$/i.test(String(remote))) {
    issues.push('LID_PRESENT')
    if (digits(phone) && digits(phone) === digits(String(remote).replace(/@lid$/i, ''))) issues.push('LID_EXPOSED_AS_PHONE')
  }
  if (/^\+?\d{12,}$/.test(String(name ?? '').replace(/[\s().-]/g, ''))) issues.push('NUMERIC_DISPLAY_NAME')
  if (issues.length) report.contacts.push({ id: row.id, issues, name, phone, remote })
}
for (const row of conversations.data || []) {
  const remote = row.remote_chat_id ?? row.chat_id ?? row.whatsapp_chat_id
  if (remote && /@lid$/i.test(String(remote))) report.conversations.push({ id: row.id, contactId: row.contact_id, remoteChatId: remote })
}

const out = `ac-whatsapp-identity-audit-${Date.now()}.json`
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(`PASS: ${out}`)
console.log({ contactIssues: report.contacts.length, lidConversations: report.conversations.length })
