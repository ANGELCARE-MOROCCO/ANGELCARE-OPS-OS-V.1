#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const file = path.join(process.cwd(), 'supabase/migrations/20260731_angelcare360_operator_product_full_admin_control.sql')
const sql = fs.readFileSync(file, 'utf8')
const lower = sql.toLowerCase()
let passed = 0
const pass = (message) => { passed += 1; console.log(`PASS  ${message}`) }
const expect = (token, label) => lower.includes(token.toLowerCase()) ? pass(label) : (() => { throw new Error(`Missing ${label}: ${token}`) })()
const reject = (token, label) => !lower.includes(token.toLowerCase()) ? pass(label) : (() => { throw new Error(`Forbidden ${label}: ${token}`) })()
expect('begin;', 'transaction begins')
expect('commit;', 'transaction commits')
expect('create table if not exists public.angelcare360_operator_product_revisions', 'revision table')
expect('create table if not exists public.angelcare360_operator_product_change_jobs', 'change job table')
expect('add column if not exists is_seeded', 'seed metadata columns')
expect('angelcare360_operator_replace_product_entity', 'atomic product replacement function')
expect('angelcare360_operator_replace_package_version', 'atomic package replacement function')
expect('security definer', 'controlled server functions')
expect('enable row level security', 'RLS enabled')
expect('revoke all', 'public grants revoked')
expect('grant all', 'service-role table grants')
expect('grant execute', 'service-role function grants')
for (const token of ['drop table','drop column','truncate table','delete from public.angelcare360_operator_product_modules','delete from public.angelcare360_operator_package_versions']) reject(token, 'destructive SQL')
if ((sql.match(/\(/g) || []).length !== (sql.match(/\)/g) || []).length) throw new Error('SQL parentheses are not balanced')
pass('SQL parentheses balanced')
console.log(`\n${passed} SQL safety checks passed.`)
