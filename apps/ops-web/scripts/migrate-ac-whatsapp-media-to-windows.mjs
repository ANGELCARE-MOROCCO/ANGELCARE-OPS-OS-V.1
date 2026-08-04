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
const deleteSource = process.argv.includes('--delete-source')
const limitArg = process.argv.find((value) => value.startsWith('--limit='))
const limit = Math.max(1, Math.min(Number(limitArg?.split('=')[1] || 1000), 10000))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const vaultBase = String(process.env.AC_WHATSAPP_MEDIA_VAULT_BASE_URL || '').replace(/\/$/, '')
const vaultSecret = process.env.AC_WHATSAPP_MEDIA_VAULT_INTERNAL_SECRET
if (!supabaseUrl || !serviceKey || !vaultBase || !vaultSecret) {
  throw new Error('Missing Supabase service credentials or AC WhatsApp Media Vault environment variables.')
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const report = { startedAt: new Date().toISOString(), commit, deleteSource, inspected: 0, migrated: 0, skipped: 0, failed: [] }

const query = await supabase
  .from('ac_whatsapp_attachments')
  .select('id,message_id,storage_provider,storage_path,file_name,mime_type,size_bytes,checksum,metadata')
  .eq('storage_provider', 'supabase')
  .not('storage_path', 'is', null)
  .order('created_at', { ascending: true })
  .limit(limit)

if (query.error) throw query.error

for (const row of query.data || []) {
  report.inspected += 1
  const storageKey = String(row.storage_path)
  try {
    if (!commit) {
      console.log(`[DRY RUN] ${row.id} ${storageKey}`)
      report.skipped += 1
      continue
    }

    const signed = await supabase.storage.from('ac-whatsapp-media').createSignedUrl(storageKey, 3600)
    if (signed.error) throw signed.error

    const response = await fetch(`${vaultBase}/v1/internal/import-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AC-Media-Vault-Secret': vaultSecret,
      },
      body: JSON.stringify({
        storageKey,
        sourceUrl: signed.data.signedUrl,
        fileName: row.file_name,
        mimeType: row.mime_type,
        maxBytes: 52_428_800,
        expectedSha256: row.checksum || null,
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok || !payload?.data) throw new Error(payload?.error || `MEDIA_VAULT_HTTP_${response.status}`)
    const receipt = payload.data

    const updated = await supabase.from('ac_whatsapp_attachments').update({
      storage_provider: 'windows',
      storage_path: receipt.storageKey,
      storage_host: vaultBase,
      file_name: receipt.fileName || row.file_name,
      mime_type: receipt.mimeType || row.mime_type,
      size_bytes: receipt.sizeBytes,
      checksum: receipt.sha256,
      verified_at: new Date().toISOString(),
      migration_status: 'migrated',
      metadata: { ...(row.metadata || {}), migrated_from_supabase_at: new Date().toISOString(), legacy_supabase_path: storageKey, primary_storage: 'windows' },
    }).eq('id', row.id)
    if (updated.error) throw updated.error

    await supabase.from('ac_whatsapp_media_vault_events').insert({
      attachment_id: row.id,
      event_type: 'media.migrated_to_windows',
      status: 'completed',
      storage_provider: 'windows',
      storage_path: receipt.storageKey,
      checksum: receipt.sha256,
      details: { source_provider: 'supabase', source_path: storageKey, size_bytes: receipt.sizeBytes },
    })

    if (deleteSource) {
      const removed = await supabase.storage.from('ac-whatsapp-media').remove([storageKey])
      if (removed.error) throw removed.error
    }

    report.migrated += 1
    console.log(`[MIGRATED] ${row.id} ${receipt.storageKey}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    report.failed.push({ id: row.id, storagePath: storageKey, error: message })
    await supabase.from('ac_whatsapp_attachments').update({ migration_status: 'migration_failed' }).eq('id', row.id)
    console.error(`[FAILED] ${row.id}: ${message}`)
  }
}

report.completedAt = new Date().toISOString()
const reportPath = path.resolve(process.cwd(), `ac-whatsapp-media-migration-${Date.now()}.json`)
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
console.log(`Report: ${reportPath}`)
if (report.failed.length) process.exitCode = 1
