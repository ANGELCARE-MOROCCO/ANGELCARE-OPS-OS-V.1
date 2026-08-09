import fs from 'node:fs'
import path from 'node:path'
const app = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const sqlPath = path.join(app, 'supabase/migrations/20260731_angelcare360_operator_tenant_identity_access_security_command.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')
const checks = [
  ['transaction begins', /^\s*begin\s*;/i],
  ['transaction commits', /commit\s*;\s*$/i],
  ['preflight exists', /angelcare_tenant_access_preflight/],
  ['RLS enabled', /enable row level security/i],
  ['browser grants revoked', /from anon, authenticated/i],
  ['service role granted', /to service_role/i],
  ['token hashes', /token_hash text not null unique/i],
  ['MFA encrypted', /mfa_secret_encrypted text/i],
  ['no table drop', /drop\s+table/i, true],
  ['no truncate', /truncate\s+table/i, true],
  ['no password column', /(?:^|\W)password\s+text/i, true],
]
let passed = 0
for (const [label, pattern, absent] of checks) {
  const found = pattern.test(sql)
  if ((absent && found) || (!absent && !found)) { console.error(`FAIL  ${label}`); process.exitCode = 1 } else { passed += 1; console.log(`PASS  ${label}`) }
}
let depth = 0
for (const char of sql.replace(/--.*$/gm, '').replace(/'([^']|'')*'/g, "''")) { if (char === '(') depth += 1; if (char === ')') depth -= 1; if (depth < 0) break }
if (depth !== 0) { console.error(`FAIL  SQL parentheses balance (${depth})`); process.exitCode = 1 } else { passed += 1; console.log('PASS  SQL parentheses balanced') }
if (!process.exitCode) console.log(`\n${passed} SQL safety checks passed.`)
