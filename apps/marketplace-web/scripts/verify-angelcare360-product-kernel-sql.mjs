import fs from 'node:fs'
import path from 'node:path'
const file = path.join(process.cwd(), 'supabase/migrations/20260730_angelcare360_operator_product_monetization_kernel.sql')
const sql = fs.readFileSync(file, 'utf8')
const failures = []
const check = (condition, label) => condition ? console.log(`PASS  ${label}`) : (failures.push(label), console.error(`FAIL  ${label}`))
check(sql.trimStart().startsWith('-- AngelCare 360 Operator'), 'migration identity')
check(/\bbegin;[\s\S]*\bcommit;/i.test(sql), 'transaction boundary')
check((sql.match(/\(/g) || []).length === (sql.match(/\)/g) || []).length, 'balanced parentheses')
check((sql.match(/create table if not exists public\./gi) || []).length === 18, 'exactly 18 normalized kernel tables')
check((sql.match(/enable row level security/gi) || []).length >= 1, 'RLS activation loop')
check(/revoke all on table public\.%I from anon, authenticated/i.test(sql), 'direct customer roles revoked')
check(/grant all on table public\.%I to service_role/i.test(sql), 'service-role authority explicit')
check(!/drop table|truncate table|drop column/i.test(sql), 'migration is additive and non-destructive')
check(/add column if not exists package_version_id/i.test(sql), 'backward-compatible subscription extension')
if (failures.length) process.exit(1)
console.log('\nSQL static gate passed.')
