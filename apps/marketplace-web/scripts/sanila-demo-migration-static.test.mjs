import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const files = [
  'supabase/migrations/20260903_sanila_master_demo_foundation.sql',
  'supabase/migrations/20260903_sanila_master_demo_security_hardening.sql',
]
const baseline = await readFile(new URL('../../infrastructure/database/CURRENT_PRODUCTION_SCHEMA.sql', root), 'utf8')
const sqlFiles = await Promise.all(files.map(async (file) => ({ file, sql: await readFile(new URL(file, root), 'utf8') })))

for (const { file, sql } of sqlFiles) {
  assert.match(sql, /^begin;/i, `${file}: explicit transaction missing`)
  assert.match(sql, /commit;\s*$/i, `${file}: commit missing`)
  assert.equal((sql.match(/\$\$/g) || []).length % 2, 0, `${file}: unbalanced dollar quoting`)
  assert.doesNotMatch(sql, /\b(drop\s+(table|schema|database)|truncate)\b/i, `${file}: destructive DDL is forbidden`)
  assert.doesNotMatch(sql, /angelcare-supabase\.duckdns\.org|postgres(?:ql)?:\/\//i, `${file}: environment-specific database target embedded`)
}

const foundation = sqlFiles[0].sql
const hardening = sqlFiles[1].sql
for (const dependency of ['app_users','angelcare360_schools','angelcare360_operator_tenants','angelcare_marketplace_public_inquiries']) {
  assert.match(baseline, new RegExp(`CREATE TABLE public\\.${dependency}\\b`, 'i'), `baseline dependency missing: ${dependency}`)
}
for (const table of ['sanila_demo_configs','sanila_demo_access_grants','sanila_demo_sessions','sanila_demo_access_events','sanila_demo_reset_runs','sanila_demo_side_effect_events']) {
  assert.match(foundation, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), `foundation table missing: ${table}`)
  assert.match(foundation, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `RLS missing: ${table}`)
  assert.match(foundation, new RegExp(`revoke all on public\\.${table} from anon, authenticated`, 'i'), `client revoke missing: ${table}`)
  assert.match(foundation, new RegExp(`grant all on public\\.${table} to service_role`, 'i'), `service grant missing: ${table}`)
}
assert.match(foundation, /sanila_demo_configs_one_active_idx/)
for (const constraint of ['sanila_demo_grants_formal_approval_ck','sanila_demo_grants_policy_shape_ck','sanila_demo_grants_usage_bound_ck']) assert.ok(foundation.includes(constraint), `grant constraint missing: ${constraint}`)
for (const trigger of ['sanila_demo_config_scope_guard','sanila_demo_session_scope_guard','sanila_demo_side_effect_scope_guard']) assert.ok(foundation.includes(trigger), `scope trigger missing: ${trigger}`)
for (const index of ['idx_sanila_demo_enrollments_school_status','idx_sanila_demo_attendance_school_student','idx_sanila_demo_transport_assignments_school']) assert.ok(foundation.includes(index), `high-volume index missing: ${index}`)
assert.match(foundation, /sanila_configure_master_demo/)
assert.match(foundation, /revoke all on function public\.sanila_master_demo_upsert\(uuid,text,text,jsonb,boolean\) from public, anon, authenticated/)
assert.match(foundation, /where active = true/)
assert.match(foundation, /pg_try_advisory_xact_lock/)
assert.match(foundation, /RESET_REFUSED_NOT_MASTER_DEMO/)
assert.match(foundation, /Canonical seed verification failed/)
assert.match(hardening, /Depends on 20260903_sanila_master_demo_foundation\.sql/)
assert.match(hardening, /pin_lookup_digest/)
assert.match(hardening, /sanila_demo_pin_attempts/)
assert.match(hardening, /operator\.demo\.environment\.view/)
assert.match(hardening, /operator\.demo\.environment\.manage/)

const seededTables = [...foundation.matchAll(/sanila_master_demo_upsert\(c\.id,'(angelcare360_[a-z0-9_]+)'/g)].map((match) => match[1])
assert.ok(seededTables.length >= 40, 'deep seed domain coverage is unexpectedly small')
for (const table of new Set(seededTables)) assert.match(baseline, new RegExp(`CREATE TABLE public\\.${table}\\b`, 'i'), `seed references unsupported table: ${table}`)

console.log('MIGRATION_STATIC_TESTS=PASS')
console.log(`MIGRATION_ORDER=${files.join(' -> ')}`)
