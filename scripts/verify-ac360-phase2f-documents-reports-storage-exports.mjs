#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2f_documents_reports_storage_exports.sql',
  'lib/ac360/school-documents.ts',
  'app/api/ac360/school-documents/dashboard/route.ts',
  'app/api/ac360/school-documents/documents/register/route.ts',
  'app/api/ac360/school-documents/documents/version/route.ts',
  'app/api/ac360/school-documents/documents/archive/route.ts',
  'app/api/ac360/school-documents/documents/access/route.ts',
  'app/api/ac360/school-documents/reviews/request/route.ts',
  'app/api/ac360/school-documents/reviews/decide/route.ts',
  'app/api/ac360/school-documents/report-templates/upsert/route.ts',
  'app/api/ac360/school-documents/reports/queue/route.ts',
  'app/api/ac360/school-documents/reports/artifact/route.ts',
  'app/api/ac360/school-documents/exports/queue/route.ts',
  'app/api/ac360/school-documents/exports/ready/route.ts',
  'app/api/ac360/school-documents/storage/reconcile/route.ts',
  'app/api/ac360/school-documents/alerts/resolve/route.ts',
]

const requiredTables = [
  'ac360_school_document_folders',
  'ac360_school_document_versions',
  'ac360_school_document_review_requests',
  'ac360_school_document_access_events',
  'ac360_school_report_templates',
  'ac360_school_report_artifacts',
  'ac360_school_report_schedules',
  'ac360_school_export_jobs',
  'ac360_school_storage_snapshots',
  'ac360_school_document_alerts',
]

const requiredFunctions = [
  'ac360_school_documents_dashboard',
  'ac360_school_register_document',
  'ac360_school_create_document_version',
  'ac360_school_archive_document',
  'ac360_school_request_document_review',
  'ac360_school_decide_document_review',
  'ac360_school_record_document_access',
  'ac360_school_upsert_report_template',
  'ac360_school_queue_report_job',
  'ac360_school_record_report_artifact',
  'ac360_school_queue_export_job',
  'ac360_school_mark_export_ready',
  'ac360_school_reconcile_storage',
  'ac360_school_resolve_document_alert',
]

const requiredActions = [
  'school.document.register',
  'school.document.version.create',
  'school.document.archive',
  'school.document.review.request',
  'school.document.review.decide',
  'school.document.access.record',
  'school.report.template.upsert',
  'school.report.job.queue',
  'school.report.artifact.record',
  'school.export.job.queue',
  'school.export.mark_ready',
  'school.storage.reconcile',
  'school.document.alert.resolve',
]

function read(rel) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) throw new Error(`Missing required file: ${rel}`)
  return fs.readFileSync(p, 'utf8')
}

let ok = true
for (const file of requiredFiles) read(file)
const sql = read('supabase/migrations/20260630_ac360_phase2f_documents_reports_storage_exports.sql')
const lib = read('lib/ac360/school-documents.ts')
const wiring = read('lib/ac360/action-wiring.ts')

for (const table of requiredTables) {
  if (!sql.includes(`public.${table}`)) throw new Error(`Migration missing table: ${table}`)
}
for (const fn of requiredFunctions) {
  if (!sql.includes(`function public.${fn}`) && !sql.includes(`function public.${fn}(`)) throw new Error(`Migration missing RPC: ${fn}`)
}
for (const action of requiredActions) {
  if (!sql.includes(action)) throw new Error(`Migration missing action seed: ${action}`)
}
if (!sql.includes("'documents_reports_storage_exports'")) throw new Error('Missing Phase 2F module matrix registration')
if (!sql.includes('uiBuildAllowed')) throw new Error('Migration missing UI build lock metadata')
if (!lib.includes('runAc360WiredAction')) throw new Error('Document runtime must use runAc360WiredAction')
if (!lib.includes('estimateStorageGbFromBytes')) throw new Error('Document runtime must estimate storage quantities')
if (!wiring.includes('ac360.school_documents.document.register')) throw new Error('Action wiring registry missing Phase 2F keys')

const forbiddenUiPages = [
  'app/(protected)/angelcare-360/documents/page.tsx',
  'app/(protected)/angelcare-360/reports/page.tsx',
  'app/(protected)/angelcare-360/storage/page.tsx',
  'app/angelcare-360/documents/page.tsx',
  'app/angelcare-360/reports/page.tsx',
  'app/angelcare-360/storage/page.tsx',
]
for (const rel of forbiddenUiPages) {
  if (fs.existsSync(path.join(root, rel))) throw new Error(`UI build is locked; found forbidden UI file: ${rel}`)
}

console.log('✅ AC360 Phase 2F documents, reports, storage & export runtime verification passed.')
console.log('✅ UI build remains locked: no document/report/storage page.tsx created.')
