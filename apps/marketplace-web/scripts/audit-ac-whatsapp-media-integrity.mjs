import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './ac-whatsapp-load-env.mjs'

const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'), { auth: { persistSession: false } })
const [attachments, messages] = await Promise.all([
  supabase.from('ac_whatsapp_attachments').select('*').limit(10000),
  supabase.from('ac_whatsapp_messages').select('*').limit(10000),
])
if (attachments.error) throw attachments.error
if (messages.error) throw messages.error
const ids = new Set((messages.data || []).map(row => String(row.id)))
const report = { generatedAt: new Date().toISOString(), issues: [] }
for (const row of attachments.data || []) {
  const issues = []
  if (!row.message_id) issues.push('MISSING_MESSAGE_ID')
  else if (!ids.has(String(row.message_id))) issues.push('ORPHAN_MESSAGE_ID')
  if (!(row.storage_key ?? row.storage_path)) issues.push('MISSING_STORAGE_KEY')
  if (!(row.file_name ?? row.filename)) issues.push('MISSING_FILENAME')
  if (!(row.mime_type ?? row.mimetype)) issues.push('MISSING_MIME')
  if (issues.length) report.issues.push({ id: row.id, messageId: row.message_id, issues })
}
const out = `ac-whatsapp-media-integrity-${Date.now()}.json`
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(`PASS: ${out}`)
console.log({ issues: report.issues.length })
