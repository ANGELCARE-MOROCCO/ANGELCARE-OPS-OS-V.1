import fs from 'node:fs'
import path from 'node:path'
const app = path.resolve(process.argv[2] || process.cwd())
const file = path.join(app, 'supabase/migrations/20260801_angelcare360_operator_email_automation_correspondence_os.sql')
if (!fs.existsSync(file)) throw new Error(`FAIL: SQL migration missing: ${file}`)
const source = fs.readFileSync(file, 'utf8')
let checks = 0
const pass = (label) => { checks += 1; console.log(`PASS  ${label}`) }
const requireMarker = (marker, label) => source.toLowerCase().includes(marker.toLowerCase()) ? pass(label) : (() => { throw new Error(`FAIL  ${label}`) })()
requireMarker('begin;', 'atomic transaction begins')
requireMarker('commit;', 'atomic transaction commits')
const tables = [
  'angelcare360_operator_email_templates',
  'angelcare360_operator_email_automation_rules',
  'angelcare360_operator_email_automation_rule_versions',
  'angelcare360_operator_email_journeys',
  'angelcare360_operator_email_messages',
  'angelcare360_operator_email_automation_executions',
  'angelcare360_operator_email_delivery_events',
  'angelcare360_operator_email_relationship_links',
  'angelcare360_operator_email_inbound_matches',
  'angelcare360_operator_email_thread_assignments',
  'angelcare360_operator_email_approvals',
  'angelcare360_operator_email_suppressions',
  'angelcare360_operator_email_business_commitments',
  'angelcare360_operator_email_tracking_links',
]
for (const table of tables) {
  requireMarker(`create table if not exists public.${table}`, `additive table ${table}`)
  requireMarker(`alter table public.${table} enable row level security`, `RLS enabled ${table}`)
  requireMarker(`revoke all on public.${table} from anon, authenticated`, `browser roles revoked ${table}`)
  requireMarker(`grant all on public.${table} to service_role`, `service role granted ${table}`)
}
for (const forbidden of [/\bdrop\s+table\b/i,/\btruncate\b/i,/\bdrop\s+column\b/i,/\bpassword\s+(text|varchar|character varying)\b/i,/\bsmtp_password\b/i,/\bmailbox_password\b/i]) {
  if (forbidden.test(source)) throw new Error(`FAIL  destructive or secret-bearing SQL pattern: ${forbidden}`)
  pass(`forbidden SQL pattern absent: ${forbidden}`)
}
let depth = 0
let quote = false
for (let i=0;i<source.length;i++) {
  const c=source[i]
  if (c === "'" && source[i-1] !== '\\') quote = !quote
  if (!quote && c === '(') depth += 1
  if (!quote && c === ')') depth -= 1
  if (depth < 0) throw new Error('FAIL  SQL parentheses close before open')
}
if (depth !== 0) throw new Error(`FAIL  SQL parentheses imbalance: ${depth}`)
pass('SQL parentheses balanced')
console.log(`\n${checks} SQL safety checks passed.`)
