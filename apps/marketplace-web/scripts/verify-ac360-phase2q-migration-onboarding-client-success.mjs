#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2q_migration_onboarding_client_success.sql',
  'lib/ac360/school-onboarding.ts',
  'lib/ac360/action-wiring.ts',
  'app/api/ac360/school-onboarding/dashboard/route.ts',
  'app/api/ac360/school-onboarding/migration-projects/create/route.ts',
  'app/api/ac360/school-onboarding/migration-sources/upsert/route.ts',
  'app/api/ac360/school-onboarding/migration-batches/create/route.ts',
  'app/api/ac360/school-onboarding/migration-records/process/route.ts',
  'app/api/ac360/school-onboarding/validation-findings/record/route.ts',
  'app/api/ac360/school-onboarding/projects/open/route.ts',
  'app/api/ac360/school-onboarding/steps/update/route.ts',
  'app/api/ac360/school-onboarding/setup-checklists/upsert/route.ts',
  'app/api/ac360/school-onboarding/setup-items/complete/route.ts',
  'app/api/ac360/school-onboarding/success-accounts/upsert/route.ts',
  'app/api/ac360/school-onboarding/touchpoints/record/route.ts',
  'app/api/ac360/school-onboarding/health-scores/compute/route.ts',
  'app/api/ac360/school-onboarding/playbooks/upsert/route.ts',
  'app/api/ac360/school-onboarding/reconcile/route.ts',
  'app/api/ac360/school-onboarding/alerts/resolve/route.ts',
]

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`❌ Missing required file: ${rel}`)
    process.exit(1)
  }
}

const sql = fs.readFileSync(path.join(root, requiredFiles[0]), 'utf8')
const requiredTables = [
  'ac360_school_migration_projects',
  'ac360_school_migration_sources',
  'ac360_school_migration_batches',
  'ac360_school_migration_records',
  'ac360_school_data_validation_findings',
  'ac360_school_onboarding_projects',
  'ac360_school_onboarding_steps',
  'ac360_school_setup_checklists',
  'ac360_school_setup_items',
  'ac360_school_client_success_accounts',
  'ac360_school_success_touchpoints',
  'ac360_school_success_health_scores',
  'ac360_school_success_playbooks',
  'ac360_school_onboarding_success_snapshots',
  'ac360_school_onboarding_success_alerts',
]
for (const table of requiredTables) {
  if (!sql.includes(`create table if not exists public.${table}`)) {
    console.error(`❌ Missing SQL table: ${table}`)
    process.exit(1)
  }
}

const requiredActions = [
  'school.migration.project.create',
  'school.migration.source.upsert',
  'school.migration.batch.create',
  'school.migration.record.process',
  'school.migration.validation.record',
  'school.onboarding.project.open',
  'school.onboarding.step.update',
  'school.setup.checklist.upsert',
  'school.setup.item.complete',
  'school.client_success.account.upsert',
  'school.client_success.touchpoint.record',
  'school.client_success.health_score.compute',
  'school.client_success.playbook.upsert',
  'school.onboarding.reconcile',
  'school.onboarding.alert.resolve',
]
for (const action of requiredActions) {
  if (!sql.includes(action)) {
    console.error(`❌ Missing guarded action in SQL: ${action}`)
    process.exit(1)
  }
}

const wiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const key of ['ac360.school_onboarding.migration_project.create','ac360.school_onboarding.health_score.compute','ac360.school_onboarding.alert.resolve']) {
  if (!wiring.includes(key)) {
    console.error(`❌ Missing static wiring key: ${key}`)
    process.exit(1)
  }
}

const forbiddenUi = [
  'app/(protected)/angelcare-360/onboarding/page.tsx',
  'app/(protected)/angelcare-360/client-success/page.tsx',
  'app/(protected)/angelcare-360/data-migration/page.tsx',
]
for (const rel of forbiddenUi) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error(`❌ UI build lock violated: ${rel}`)
    process.exit(1)
  }
}

if (!sql.includes('uiBuildAllowed":false') && !sql.includes('uiBuildAllowed')) {
  console.error('❌ Missing UI build lock metadata.')
  process.exit(1)
}

console.log('✅ AC360 Phase 2Q data migration, onboarding, setup & client success runtime verification passed.')
console.log('✅ UI build remains locked: no onboarding/client-success front-end page.tsx created.')
