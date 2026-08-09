#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const file = path.join(process.cwd(), 'supabase/migrations/20260731_angelcare360_operator_commercial_growth_customer_os.sql')
const sql = fs.readFileSync(file, 'utf8')
let checks=0
const pass=(x)=>{checks++;console.log(`PASS  ${x}`)}
const fail=(x)=>{console.error(`FAIL  ${x}`);process.exitCode=1}
for (const forbidden of [/\bdrop\s+table\b/i,/\btruncate\b/i,/\bdrop\s+column\b/i,/\bdelete\s+from\s+public\.angelcare360_operator_(?!growth_)/i]) forbidden.test(sql)?fail(`destructive SQL detected: ${forbidden}`):pass(`forbidden SQL absent: ${forbidden}`)
for (const table of ['prospects','contacts','opportunities','offers','interactions','expansion','interventions']) {
  const name=`angelcare360_operator_growth_${table}`
  sql.includes(`create table if not exists public.${name}`)?pass(`additive table: ${name}`):fail(`missing table: ${name}`)
  sql.includes(`alter table public.${name} enable row level security`)?pass(`RLS enabled: ${name}`):fail(`RLS missing: ${name}`)
  sql.includes(`revoke all on public.${name} from anon, authenticated`)?pass(`direct user grants revoked: ${name}`):fail(`revoke missing: ${name}`)
  sql.includes(`grant all on public.${name} to service_role`)?pass(`service role granted: ${name}`):fail(`service role grant missing: ${name}`)
}
const balanced=(open,close)=>{let n=0;for(const c of sql){if(c===open)n++;if(c===close)n--;}return n===0}
balanced('(',')')?pass('SQL parentheses balanced'):fail('SQL parentheses unbalanced')
sql.trim().toLowerCase().startsWith('begin;')&&sql.trim().toLowerCase().endsWith('commit;')?pass('migration transaction wrapped'):fail('migration transaction missing')
if(process.exitCode)process.exit(process.exitCode)
console.log(`\n${checks} SQL safety checks passed.`)
