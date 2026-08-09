import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './ac-whatsapp-load-env.mjs'

const commit = process.argv.includes('--commit')
const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'), { auth: { persistSession: false } })
const attachments = await supabase.from('ac_whatsapp_attachments').select('*').limit(10000)
if (attachments.error) throw attachments.error
const report = { commit, ready: [], needsReview: [], updated: [] }
for (const row of attachments.data || []) {
  const storageKey = row.storage_key ?? row.storage_path
  const state = row.message_id && storageKey && (row.file_name ?? row.filename) && (row.mime_type ?? row.mimetype) ? 'ready' : 'needs_review'
  const item = { id: row.id, state }
  ;(state === 'ready' ? report.ready : report.needsReview).push(item)
  if (commit) {
    const result = await supabase.from('ac_whatsapp_attachments').update({ media_status: state, storage_backend: row.storage_backend || row.storage_provider || (storageKey ? 'windows' : null), storage_key: row.storage_key || row.storage_path || null, last_verified_at: new Date().toISOString() }).eq('id', row.id)
    if (!result.error) report.updated.push(item)
  }
}
const out = `ac-whatsapp-media-reconciliation-${Date.now()}.json`
fs.writeFileSync(out, JSON.stringify(report, null, 2))
console.log(`${commit ? 'PASS' : 'DRY RUN'}: ${out}`)
console.log({ ready: report.ready.length, needsReview: report.needsReview.length, updated: report.updated.length })
