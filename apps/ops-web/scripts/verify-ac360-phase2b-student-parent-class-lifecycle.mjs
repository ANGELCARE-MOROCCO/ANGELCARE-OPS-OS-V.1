#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let ts = null
try { ts = require('typescript') } catch {
  try { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js') } catch { ts = null }
}

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2b_student_parent_class_lifecycle.sql',
  'lib/ac360/school-lifecycle.ts',
  'lib/ac360/action-wiring.ts',
  'app/api/ac360/school-lifecycle/dashboard/route.ts',
  'app/api/ac360/school-lifecycle/integrity-check/route.ts',
  'app/api/ac360/school-lifecycle/students/transition/route.ts',
  'app/api/ac360/school-lifecycle/students/archive/route.ts',
  'app/api/ac360/school-lifecycle/guardians/link/route.ts',
  'app/api/ac360/school-lifecycle/guardians/portal-status/route.ts',
  'app/api/ac360/school-lifecycle/classes/transfer/route.ts',
  'app/api/ac360/school-lifecycle/classes/capacity-reconcile/route.ts',
  'app/api/ac360/school-lifecycle/classes/close/route.ts',
]

let ok = true
function fail(message) {
  console.error(`❌ ${message}`)
  ok = false
}
function pass(message) {
  console.log(`✅ ${message}`)
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`)
}
if (!ok) process.exit(1)
pass('Required Phase 2B files present')

const sql = read('supabase/migrations/20260630_ac360_phase2b_student_parent_class_lifecycle.sql')
const requiredSql = [
  'ac360_school_lifecycle_rules',
  'ac360_school_lifecycle_events',
  'ac360_school_class_transfer_events',
  'ac360_school_capacity_snapshots',
  'ac360_school_integrity_runs',
  'ac360_school_integrity_findings',
  'ac360_school_transition_student',
  'ac360_school_archive_student',
  'ac360_school_link_guardian',
  'ac360_school_update_guardian_portal_status',
  'ac360_school_transfer_student_class',
  'ac360_school_reconcile_class_capacity',
  'ac360_school_close_class',
  'ac360_school_run_lifecycle_integrity_check',
  'ac360_school_lifecycle_dashboard',
  'school.student.transition',
  'school.student.archive',
  'school.guardian.link',
  'school.guardian.portal_status.update',
  'school.class.transfer_student',
  'school.class.capacity.reconcile',
  'school.class.close',
  'school.lifecycle.integrity_check',
]
for (const token of requiredSql) {
  if (!sql.includes(token)) fail(`SQL missing token: ${token}`)
}
if (!sql.includes('ui_build_allowed":false') && !sql.includes('uiBuildAllowed')) fail('SQL must keep UI build locked')
if (!sql.includes('archive_not_delete')) fail('SQL must preserve archive-not-delete strategy')
if (!sql.includes('enable row level security')) fail('SQL must enable RLS for new lifecycle tables')
if (!sql.includes('service_role_all')) fail('SQL must create service-role policies for backend API control')
if (ok) pass('SQL lifecycle tables/RPCs/action wiring/policy seeds verified')

const wiring = read('lib/ac360/action-wiring.ts')
const requiredWiring = [
  'ac360.school_lifecycle.student.transition',
  'ac360.school_lifecycle.student.archive',
  'ac360.school_lifecycle.guardian.link',
  'ac360.school_lifecycle.guardian.portal_status',
  'ac360.school_lifecycle.class.transfer',
  'ac360.school_lifecycle.class.capacity_reconcile',
  'ac360.school_lifecycle.class.close',
  'ac360.school_lifecycle.integrity_check',
]
for (const token of requiredWiring) {
  if (!wiring.includes(token)) fail(`action-wiring.ts missing ${token}`)
}
if (ok) pass('Static action wiring includes all Phase 2B guarded lifecycle actions')

const lifecycleLib = read('lib/ac360/school-lifecycle.ts')
const requiredLib = [
  'transitionAc360Student',
  'archiveAc360Student',
  'linkAc360Guardian',
  'updateAc360GuardianPortalStatus',
  'transferAc360StudentClass',
  'reconcileAc360ClassCapacity',
  'closeAc360Class',
  'runAc360SchoolLifecycleIntegrityCheck',
  'runAc360WiredAction',
  'phase_2b_student_parent_class_lifecycle',
]
for (const token of requiredLib) {
  if (!lifecycleLib.includes(token)) fail(`school-lifecycle.ts missing ${token}`)
}
if (ok) pass('Lifecycle runtime library exposes guarded backend functions')

const forbiddenUiPaths = [
  'app/angelcare-360/school-lifecycle/page.tsx',
  'app/angelcare-360/students/page.tsx',
  'app/angelcare-360/classes/page.tsx',
  'app/(protected)/angelcare-360/school-lifecycle/page.tsx',
]
for (const rel of forbiddenUiPaths) {
  if (fs.existsSync(path.join(root, rel))) fail(`Phase 2B must not create front-end UI page yet: ${rel}`)
}
if (ok) pass('No school lifecycle front-end UI pages created')

if (ts) {
  const tsFiles = requiredFiles.filter((rel) => rel.endsWith('.ts'))
  for (const rel of tsFiles) {
    const source = read(rel)
    const result = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        strict: false,
        noEmitOnError: false,
      },
      fileName: rel,
      reportDiagnostics: true,
    })
    const diagnostics = result.diagnostics || []
    const blocking = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error)
    if (blocking.length) {
      fail(`TypeScript transpile diagnostics in ${rel}: ${blocking.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ')}`)
    }
  }
  if (ok) pass('Phase 2B TypeScript/route transpile check passed')
} else {
  console.warn('⚠️ TypeScript package not available; structural verification completed without transpile check.')
}

if (!ok) process.exit(1)
console.log('✅ AC360 Phase 2B student/parent/class lifecycle runtime hardening verification passed.')
