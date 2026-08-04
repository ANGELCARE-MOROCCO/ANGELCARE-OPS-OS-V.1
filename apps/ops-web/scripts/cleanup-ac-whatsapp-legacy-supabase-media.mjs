#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index < 1) continue
    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (!process.env[key]) process.env[key] = value
  }
}
for (const name of ['.env.local', '.env.production.local', '.env']) loadEnv(path.resolve(process.cwd(), name))

const commit = process.argv.includes('--commit')
const limitArg = process.argv.find(value => value.startsWith('--limit='))
const limit = Math.max(1, Math.min(Number(limitArg?.split('=')[1] || 1000), 10000))
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase service credentials.')
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const rows = await supabase.from('ac_whatsapp_attachments')
  .select('id,storage_provider,storage_path,checksum,migration_status,metadata')
  .eq('storage_provider', 'windows')
  .eq('migration_status', 'migrated')
  .limit(limit)
if (rows.error) throw rows.error
let removed = 0
for (const row of rows.data || []) {
  const legacyPath = String(row.metadata?.legacy_supabase_path || '')
  if (!legacyPath) { console.log(`[SKIP] ${row.id}: no legacy_supabase_path`); continue }
  if (!commit) { console.log(`[DRY RUN DELETE] ${row.id} ${legacyPath}`); continue }
  const result = await supabase.storage.from('ac-whatsapp-media').remove([legacyPath])
  if (result.error) { console.error(`[FAILED] ${row.id}: ${result.error.message}`); process.exitCode = 1; continue }
  const metadata = { ...(row.metadata || {}), legacy_supabase_deleted_at: new Date().toISOString() }
  const updated = await supabase.from('ac_whatsapp_attachments').update({ migration_status: 'source_deleted', metadata }).eq('id', row.id)
  if (updated.error) { console.error(`[FAILED METADATA] ${row.id}: ${updated.error.message}`); process.exitCode = 1; continue }
  await supabase.from('ac_whatsapp_media_vault_events').insert({ attachment_id: row.id, event_type: 'media.legacy_supabase_deleted', status: 'completed', storage_provider: 'windows', storage_path: row.storage_path, checksum: row.checksum, details: { legacy_supabase_path: legacyPath } })
  removed += 1
  console.log(`[DELETED LEGACY SOURCE] ${row.id} ${legacyPath}`)
}
console.log(`Legacy Supabase objects removed: ${removed}`)
