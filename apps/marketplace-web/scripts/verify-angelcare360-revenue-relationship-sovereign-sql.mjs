#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = process.cwd()
const rel = 'supabase/migrations/20260731_angelcare360_operator_revenue_relationship_sovereign_os.sql'
const file = path.join(app, rel)
if (!fs.existsSync(file)) { console.error(`FAIL  missing ${rel}`); process.exit(1) }
const sql = fs.readFileSync(file, 'utf8')
let checks = 0
let failed = false
const pass = (label) => { checks += 1; console.log(`PASS  ${label}`) }
const fail = (label) => { failed = true; console.error(`FAIL  ${label}`) }
const expect = (pattern, label) => (typeof pattern === 'string' ? sql.includes(pattern) : pattern.test(sql)) ? pass(label) : fail(label)

expect(/^\s*begin\s*;/im, 'migration begins transactionally')
expect(/commit\s*;\s*$/im, 'migration commits transactionally')
for (const table of [
  'angelcare360_operator_growth_institutions',
  'angelcare360_operator_growth_stakeholders',
  'angelcare360_operator_growth_offer_versions',
  'angelcare360_operator_growth_negotiations',
  'angelcare360_operator_customer_cases',
  'angelcare360_operator_customer_case_events',
  'angelcare360_operator_customer_case_evidence',
  'angelcare360_operator_commercial_findings',
]) {
  expect(`create table if not exists public.${table}`, `additive table ${table}`)
  expect(`alter table public.${table} enable row level security`, `RLS enabled ${table}`)
  expect(`revoke all on table public.${table} from anon, authenticated`, `direct access revoked ${table}`)
  expect(`grant all on table public.${table} to service_role`, `service-role authority ${table}`)
}
for (const reference of [
  'references public.angelcare360_operator_clients(id)',
  'references public.angelcare360_operator_tenants(id)',
  'references public.angelcare360_operator_subscriptions(id)',
  'references public.angelcare360_operator_growth_opportunities(id)',
  'references public.angelcare360_operator_growth_offers(id)',
]) expect(reference, `relationship reference ${reference}`)
for (const token of ['drop table','drop column','truncate ','delete from ']) {
  sql.toLowerCase().includes(token) ? fail(`destructive SQL absent: ${token}`) : pass(`destructive SQL absent: ${token}`)
}
const opens = (sql.match(/\(/g) || []).length
const closes = (sql.match(/\)/g) || []).length
opens === closes ? pass('SQL parentheses balanced') : fail(`SQL parentheses balanced (${opens}/${closes})`)
if (failed) process.exit(1)
console.log(`\n${checks} SQL safety checks passed.`)
