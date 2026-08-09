import fs from 'node:fs'
import path from 'node:path'
const app = process.argv[2] || process.cwd()
const file = path.join(app, 'supabase/migrations/20260731_angelcare360_operator_commercial_customer_corporate_control_layer.sql')
const sql = fs.readFileSync(file, 'utf8')
let checks = 0
const pass = (label) => { checks += 1; console.log(`PASS  ${label}`) }
const assert = (condition, label) => condition ? pass(label) : (() => { throw new Error(`FAIL  ${label}`) })()
assert(/^begin;/i.test(sql.trim()), 'atomic BEGIN')
assert(/commit;\s*$/i.test(sql.trim()), 'atomic COMMIT')
assert(!/\b(drop\s+table|truncate\s+table|drop\s+column)\b/i.test(sql), 'no destructive DDL')
assert((sql.match(/create table if not exists/gi) || []).length === 9, 'nine additive corporate tables')
assert((sql.match(/enable row level security/gi) || []).length === 9, 'RLS on all corporate tables')
assert((sql.match(/revoke all on table/gi) || []).length === 9, 'browser roles revoked')
assert((sql.match(/grant all on table/gi) || []).length === 9, 'service role granted')
let depth = 0
for (const character of sql.replace(/--.*$/gm, '')) { if (character === '(') depth += 1; if (character === ')') depth -= 1; if (depth < 0) break }
assert(depth === 0, 'SQL parentheses balanced')
console.log(`\n${checks} SQL safety checks passed.`)
