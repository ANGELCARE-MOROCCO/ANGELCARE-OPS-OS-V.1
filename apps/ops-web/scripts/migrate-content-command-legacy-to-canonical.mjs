#!/usr/bin/env node

/**
 * One-time, idempotent promotion of the retired content_command_* database estate
 * into the canonical market_content_* operating model.
 *
 * It never drops or mutates a legacy table. A compatibility-link ledger makes
 * reruns safe. Run only after 20260730_1900_content_command_canonical_consolidation.sql.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const appRoot = path.resolve(process.argv[2] || process.cwd())

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    process.env[match[1]] = value.replace(/\\n/g, '\n')
  }
}

for (const file of ['.env.local', '.env.production.local', '.env.production', '.env']) loadEnv(path.join(appRoot, file))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('FAIL — NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(2)
}

let supabaseModule
try {
  const modulePath = path.join(appRoot, 'node_modules', '@supabase', 'supabase-js', 'dist', 'main', 'index.js')
  supabaseModule = fs.existsSync(modulePath) ? await import(pathToFileURL(modulePath)) : await import('@supabase/supabase-js')
} catch (error) {
  console.error('FAIL — @supabase/supabase-js is not available. Run npm install in apps/ops-web first.')
  console.error(error?.message || error)
  process.exit(2)
}

const { createClient } = supabaseModule
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const clean = (value) => String(value ?? '').trim()
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const array = (value) => Array.isArray(value) ? value : []
const statusMap = { idea: 'ideation', draft: 'in_creation', review: 'human_review', approved: 'validated', scheduled: 'scheduled', published: 'published', revision: 'revision', archived: 'archived' }
const counts = { created: {}, skipped: {}, errors: [] }
const dossierMap = new Map()
const missionMap = new Map()

function bump(bucket, name) { bucket[name] = (bucket[name] || 0) + 1 }
function isMissing(error) { return /does not exist|schema cache|could not find/i.test(clean(error?.message || error)) }
async function safeRows(table, limit = 5000) {
  const result = await db.from(table).select('*').limit(limit)
  if (result.error) {
    if (isMissing(result.error)) { console.log(`SKIP — legacy table absent: ${table}`); return [] }
    throw result.error
  }
  return result.data || []
}
async function linked(entity, legacyId) {
  const result = await db.from('market_content_compatibility_links').select('canonical_id').eq('legacy_system', 'content_command_database').eq('legacy_entity', entity).eq('legacy_id', legacyId).maybeSingle()
  if (result.error && !isMissing(result.error)) throw result.error
  return clean(result.data?.canonical_id)
}
async function link(entity, legacyId, canonicalEntity, canonicalId, metadata = {}) {
  const result = await db.from('market_content_compatibility_links').upsert({ legacy_system: 'content_command_database', legacy_entity: entity, legacy_id: legacyId, canonical_entity: canonicalEntity, canonical_id: canonicalId, metadata, migrated_at: new Date().toISOString() }, { onConflict: 'legacy_system,legacy_entity,legacy_id' })
  if (result.error) throw result.error
}
async function nextContentCode(family, service = 'legacy') {
  const result = await db.rpc('market_content_next_content_code', { p_family: family, p_service: service })
  if (result.error) throw result.error
  return clean(result.data)
}
async function nextCode(prefix) {
  const result = await db.rpc('market_content_next_code', { p_prefix: prefix })
  if (result.error) throw result.error
  return clean(result.data)
}
function familyFor(value) {
  const text = clean(value).toLowerCase()
  if (/(print|brochure|flyer|poster|rollup|packaging|offline)/.test(text)) return 'print_offline'
  if (/(document|policy|sop|memo|presentation|governance|agreement|form)/.test(text)) return 'corporate_document'
  return 'digital'
}
async function ensureDossier(legacyId, source, fallbackTitle = 'Record Content Command importé') {
  if (dossierMap.has(legacyId)) return dossierMap.get(legacyId)
  const priorLink = await linked(source, legacyId)
  if (priorLink) { dossierMap.set(legacyId, priorLink); bump(counts.skipped, source); return priorLink }
  const existing = await db.from('market_content_dossiers').select('id').eq('legacy_origin_id', legacyId).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data?.id) { dossierMap.set(legacyId, existing.data.id); await link(source, legacyId, 'content_dossier', existing.data.id); bump(counts.skipped, source); return existing.data.id }
  const family = familyFor(source)
  const code = await nextContentCode(family)
  const insert = await db.from('market_content_dossiers').insert({
    content_code: code,
    title: fallbackTitle,
    family,
    category: 'Legacy Recovery',
    subcategory: source,
    service_key: 'legacy_content_command',
    service_label: 'Classification à confirmer',
    audience: '', city: '', language: 'fr', channel: '', journey_stage: 'recovery', objective: `Qualifier le record historique ${legacyId}`, message_pillar: '', offer: '', cta: '',
    status: 'brief', priority: 'medium', progress: 20, readiness: 0, source_state: 'legacy_reference_only', publication_state: 'not_ready', rights_state: 'not_assessed', confidentiality: 'internal',
    brief: { legacyRecovery: true }, scope_constitution: { legacyRecovery: true }, classification: { legacySource: source },
    legacy_origin_id: legacyId, legacy_origin_type: source, provenance: { source: 'content_command_database', importedAt: new Date().toISOString() },
  }).select('id').single()
  if (insert.error) throw insert.error
  dossierMap.set(legacyId, insert.data.id)
  await link(source, legacyId, 'content_dossier', insert.data.id)
  bump(counts.created, source)
  return insert.data.id
}
async function ensureMission(dossierId, legacyRef, title) {
  if (missionMap.has(dossierId)) return missionMap.get(dossierId)
  const current = await db.from('market_content_dossiers').select('mission_id,priority,owner_name,reviewer_name,due_at,objective,title').eq('id', dossierId).single()
  if (current.error) throw current.error
  if (current.data.mission_id) { missionMap.set(dossierId, current.data.mission_id); return current.data.mission_id }
  const code = await nextCode('MIS')
  const insert = await db.from('market_content_missions').insert({ code, dossier_id: dossierId, title: `Mission héritée · ${title || current.data.title}`, objective: current.data.objective || `Finaliser ${title || current.data.title}`, scope: 'Consolider le record historique dans le runtime canonique.', success_definition: 'Record qualifié, tâches clôturées, preuves et décisions persistées.', status: 'assigned', priority: current.data.priority || 'medium', origin_type: 'legacy_content_command_database', origin_ref: legacyRef, assigned_to_name: current.data.owner_name, reviewer_name: current.data.reviewer_name, due_at: current.data.due_at }).select('id,code').single()
  if (insert.error) throw insert.error
  const update = await db.from('market_content_dossiers').update({ mission_id: insert.data.id }).eq('id', dossierId)
  if (update.error) throw update.error
  missionMap.set(dossierId, insert.data.id)
  return insert.data.id
}

async function migrateDocuments() {
  for (const row of await safeRows('content_command_documents')) {
    const id = clean(row.id); if (!id) continue
    try {
      const prior = await linked('document', id); if (prior) { dossierMap.set(id, prior); bump(counts.skipped, 'documents'); continue }
      const metadata = record(row.metadata)
      const family = familyFor(`${row.document_type || ''} ${row.category || ''}`)
      const code = await nextContentCode(family)
      const insert = await db.from('market_content_dossiers').insert({
        content_code: code, title: clean(row.title) || `Document ${id}`, family, category: clean(row.category || row.document_type || 'Document'), subcategory: clean(row.subcategory || row.document_type || 'Legacy Document'), service_key: clean(metadata.service_key || 'legacy_content_command'), service_label: clean(metadata.service_label || 'Classification à confirmer'), campaign_label: clean(metadata.campaign), audience: clean(metadata.audience), city: clean(metadata.city), language: clean(metadata.language || 'fr'), channel: clean(metadata.channel || 'Corporate Document'), journey_stage: clean(metadata.journey_stage || 'brief'), objective: clean(metadata.objective || row.title), message_pillar: clean(metadata.message), offer: clean(metadata.offer), cta: clean(metadata.cta), status: statusMap[clean(row.status).toLowerCase()] || (clean(row.status).toLowerCase().includes('approve') ? 'validated' : 'brief'), priority: clean(row.priority || 'medium').toLowerCase(), owner_name: clean(row.owner), reviewer_name: clean(metadata.reviewer), due_at: row.due_at || null, progress: clean(row.status).toLowerCase().includes('approve') ? 100 : 35, readiness: Number(metadata.readiness || 0), source_state: row.storage_path ? 'legacy_reference_only' : 'missing', publication_state: 'not_ready', rights_state: clean(metadata.rights_state || 'not_assessed'), confidentiality: clean(row.confidentiality || 'internal'), brief: { title: row.title, format: row.document_type, version: row.version, storagePath: row.storage_path, ...metadata }, scope_constitution: { importedFromLegacyDatabase: true }, classification: { legacyDocumentType: row.document_type, legacyCategory: row.category, legacySubcategory: row.subcategory }, legacy_origin_id: id, legacy_origin_type: 'content_command_documents', provenance: { source: 'content_command_database', importedAt: new Date().toISOString(), originalCreatedAt: row.created_at, originalUpdatedAt: row.updated_at },
      }).select('id').single()
      if (insert.error) throw insert.error
      dossierMap.set(id, insert.data.id); await link('document', id, 'content_dossier', insert.data.id, { title: row.title }); bump(counts.created, 'documents')
    } catch (error) { counts.errors.push({ table: 'content_command_documents', id, error: clean(error?.message || error) }) }
  }
}

async function migrateTemplates() {
  for (const row of await safeRows('content_command_templates')) {
    const id = clean(row.id); if (!id) continue
    try {
      if (await linked('template', id)) { bump(counts.skipped, 'templates'); continue }
      const code = (`TPL-${id}`).toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 90)
      const result = await db.from('market_content_templates').upsert({ code, name: clean(row.name || id), family: clean(row.family || 'digital'), category: clean(row.category || 'Legacy'), status: clean(row.status || 'draft').toLowerCase(), owner_name: clean(row.owner), dna: row }, { onConflict: 'code' }).select('id').single()
      if (result.error) throw result.error
      await link('template', id, 'content_template', result.data.id); bump(counts.created, 'templates')
    } catch (error) { counts.errors.push({ table: 'content_command_templates', id, error: clean(error?.message || error) }) }
  }
}

async function migrateCategories() {
  for (const row of await safeRows('content_command_categories')) {
    const id = clean(row.id); if (!id) continue
    try {
      if (await linked('category', id)) { bump(counts.skipped, 'categories'); continue }
      const stableKey = clean(row.code || row.stable_key || row.name || id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const result = await db.from('market_content_taxonomy_nodes').upsert({ node_type: clean(row.family || row.type || 'category'), stable_key: stableKey, label: clean(row.name || row.label || id), status: clean(row.status || 'active').toLowerCase(), metadata: row }, { onConflict: 'node_type,stable_key' }).select('id').single()
      if (result.error) throw result.error
      await link('category', id, 'taxonomy_node', result.data.id); bump(counts.created, 'categories')
    } catch (error) { counts.errors.push({ table: 'content_command_categories', id, error: clean(error?.message || error) }) }
  }
}

async function migrateTasks() {
  let sequenceByMission = new Map()
  for (const row of await safeRows('content_command_tasks')) {
    const id = clean(row.id); if (!id) continue
    try {
      if (await linked('task', id)) { bump(counts.skipped, 'tasks'); continue }
      const payload = record(row.payload)
      const legacyDossier = clean(row.dossier_id || row.content_id || row.entity_id || payload.dossierId || payload.contentId)
      const dossierId = await ensureDossier(legacyDossier || `task-parent:${id}`, 'task_holding', clean(payload.contentTitle || row.title || `Tâche ${id}`))
      const missionId = await ensureMission(dossierId, id, clean(row.title))
      if (!sequenceByMission.has(missionId)) {
        const existingTasks = await db.from('market_content_mission_tasks').select('sequence_number').eq('mission_id', missionId).order('sequence_number', { ascending: false }).limit(1)
        if (existingTasks.error) throw existingTasks.error
        sequenceByMission.set(missionId, Number(existingTasks.data?.[0]?.sequence_number || 0))
      }
      const current = sequenceByMission.get(missionId) || 0
      const sequence = current + 1
      sequenceByMission.set(missionId, sequence)
      const mission = await db.from('market_content_missions').select('code').eq('id', missionId).single(); if (mission.error) throw mission.error
      const result = await db.from('market_content_mission_tasks').insert({ mission_id: missionId, dossier_id: dossierId, code: `${mission.data.code}-LT${String(sequence).padStart(3, '0')}`, title: clean(row.title || `Tâche ${id}`), description: clean(row.description || row.notes || payload.notes), status: ['todo','doing','done','blocked','cancelled'].includes(clean(row.status)) ? clean(row.status) : clean(row.status).toLowerCase().includes('complete') ? 'done' : 'todo', priority: clean(row.priority || 'medium').toLowerCase(), sequence_number: sequence, assigned_to_name: clean(row.owner || row.assigned_to_name), due_at: row.due_at || row.due_date || null, evidence_required: true, completion_definition: clean(payload.completionDefinition || 'Preuve exigée dans Dossier 360.') }).select('id').single()
      if (result.error) throw result.error
      await link('task', id, 'mission_task', result.data.id, { dossierId }); bump(counts.created, 'tasks')
    } catch (error) { counts.errors.push({ table: 'content_command_tasks', id, error: clean(error?.message || error) }) }
  }
}

async function migrateAssetsAndUploads() {
  for (const table of ['content_command_assets', 'content_command_uploads']) {
    for (const row of await safeRows(table)) {
      const id = clean(row.id); if (!id) continue
      const entity = table === 'content_command_assets' ? 'asset' : 'upload'
      try {
        if (await linked(entity, id)) { bump(counts.skipped, `${entity}s`); continue }
        const metadata = record(row.metadata)
        const legacyDossier = clean(row.dossier_id || row.linked_content_id || row.entity_id || metadata.dossierId || metadata.contentId)
        const dossierId = await ensureDossier(legacyDossier || `${entity}-parent:${id}`, `${entity}_holding`, clean(row.title || row.name || row.file_name || `Asset ${id}`))
        const result = await db.from('market_content_evidence').insert({ dossier_id: dossierId, evidence_type: clean(row.evidence_type || row.type || row.entity_type || 'legacy_asset_reference'), title: clean(row.title || row.name || row.file_name || id), note: clean(row.notes || row.description), storage_key: clean(row.storage_path) || null, content_type: clean(row.mime_type || row.content_type || row.type) || null, filename: clean(row.file_name || row.name) || null, size_bytes: Number(row.size_bytes || 0), preview_url: clean(row.preview_url || row.url) || null, progress_percent: clean(row.status).toLowerCase().includes('approve') ? 100 : 0, submitted_by_name: clean(row.owner || row.created_by || 'Legacy import'), status: clean(row.status).toLowerCase().includes('approve') ? 'accepted' : 'submitted' }).select('id').single()
        if (result.error) throw result.error
        await link(entity, id, 'evidence', result.data.id, { dossierId }); bump(counts.created, `${entity}s`)
      } catch (error) { counts.errors.push({ table, id, error: clean(error?.message || error) }) }
    }
  }
}

async function migrateCommentsAndVersions() {
  for (const table of ['content_command_comments', 'content_command_versions']) {
    for (const row of await safeRows(table)) {
      const id = clean(row.id); if (!id) continue
      const entity = table === 'content_command_comments' ? 'comment' : 'version'
      try {
        if (await linked(entity, id)) { bump(counts.skipped, `${entity}s`); continue }
        const legacyDossier = clean(row.dossier_id || row.entity_id)
        const dossierId = legacyDossier ? await ensureDossier(legacyDossier, `${entity}_parent`, clean(row.title || row.message || `${entity} ${id}`)) : null
        const result = await db.from('market_content_notes').insert({ dossier_id: dossierId, note_type: entity, body: clean(row.message || row.body || row.description || row.title || `${entity} ${id}`), status: clean(row.status || 'historical'), author_name: clean(row.author || row.created_by || 'Legacy import'), metadata: row }).select('id').single()
        if (result.error) throw result.error
        await link(entity, id, 'content_note', result.data.id, { dossierId }); bump(counts.created, `${entity}s`)
      } catch (error) { counts.errors.push({ table, id, error: clean(error?.message || error) }) }
    }
  }
}

async function migrateActivity() {
  for (const row of await safeRows('content_command_activity')) {
    const id = clean(row.id); if (!id) continue
    try {
      if (await linked('activity', id)) { bump(counts.skipped, 'activity'); continue }
      const result = await db.from('market_content_audit').insert({ actor_name: clean(row.actor || 'Legacy import'), action: `legacy.${clean(row.action || 'activity')}`, entity_type: clean(row.entity_type || 'content_command'), entity_id: null, detail: { legacyEntityId: row.entity_id, legacyPayload: row.payload, legacyCreatedAt: row.created_at } }).select('id').single()
      if (result.error) throw result.error
      await link('activity', id, 'content_audit', String(result.data.id)); bump(counts.created, 'activity')
    } catch (error) { counts.errors.push({ table: 'content_command_activity', id, error: clean(error?.message || error) }) }
  }
}

console.log('Content Command canonical migration started…')
await migrateDocuments()
await migrateTemplates()
await migrateCategories()
await migrateTasks()
await migrateAssetsAndUploads()
await migrateCommentsAndVersions()
await migrateActivity()

const report = { executedAt: new Date().toISOString(), appRoot, ...counts }
const reportPath = path.join(appRoot, 'CONTENT_COMMAND_CANONICAL_MIGRATION_REPORT.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
if (counts.errors.length) {
  console.error(`FAIL — migration completed with ${counts.errors.length} error(s). See ${reportPath}`)
  process.exit(1)
}
console.log('SUCCESS — LEGACY CONTENT COMMAND DATABASE PROMOTED TO THE CANONICAL RUNTIME.')
