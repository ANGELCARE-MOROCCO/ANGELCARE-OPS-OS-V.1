import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const requireFromApp = createRequire(path.join(app, 'package.json'))
let ts
try { ts = requireFromApp('typescript') } catch { ts = createRequire(import.meta.url)('typescript') }

let passed = 0
const failures = []
function pass(label) { passed += 1; console.log(`PASS  ${label}`) }
function fail(label, detail = '') { failures.push(`${label}${detail ? `: ${detail}` : ''}`); console.error(`FAIL  ${label}${detail ? `: ${detail}` : ''}`) }
function file(rel) { return path.join(app, rel) }
function text(rel) { return fs.readFileSync(file(rel), 'utf8') }
function required(rel) { fs.existsSync(file(rel)) ? pass(`file ${rel}`) : fail(`file ${rel}`, 'missing') }
function marker(rel, value) { const source = fs.existsSync(file(rel)) ? text(rel) : ''; source.includes(value) ? pass(`${rel}: ${value}`) : fail(`${rel}: marker missing`, value) }

const files = [
  'types/angelcare360/operator/tenant-access.ts',
  'lib/angelcare360/operator/tenant-access.ts',
  'app/api/angelcare360/operator/tenant-access/route.ts',
  'app/api/angelcare360/access/activate/route.ts',
  'app/api/angelcare360/access/mfa/route.ts',
  'components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx',
  'components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.module.css',
  'components/angelcare360/access/TenantAccessActivationClient.tsx',
  'components/angelcare360/access/TenantAccessActivationClient.module.css',
  'app/angelcare-360-access/activate/page.tsx',
  'app/angelcare-360-access/mfa/page.tsx',
  'supabase/migrations/20260731_angelcare360_operator_tenant_identity_access_security_command.sql',
]
files.forEach(required)

const markerChecks = [
  ['lib/angelcare360/operator/tenant-access.ts', "const ACCESS_TABLE = 'angelcare360_operator_tenant_access_accounts'"],
  ['lib/angelcare360/operator/tenant-access.ts', 'tokenDigest(token)'],
  ['lib/angelcare360/operator/tenant-access.ts', 'encryptSecret(secret)'],
  ['lib/angelcare360/operator/tenant-access.ts', 'verifyTotp'],
  ['lib/angelcare360/operator/tenant-access.ts', 'provisionMembership'],
  ['lib/angelcare360/operator/tenant-access.ts', 'angelcare360_user_roles'],
  ['lib/angelcare360/operator/tenant-access.ts', 'existingIdentity'],
  ['components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx', 'administrateurs clients sans jamais connaître leur mot de passe'],
  ['components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx', 'Permission Engineering'],
  ['components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx', 'View as tenant sans usurper le mot de passe'],
  ['components/angelcare360/access/TenantAccessActivationClient.tsx', 'Identité AngelCare existante détectée'],
  ['components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx', 'TenantIdentityAccessCommand'],
  ['components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx', 'Administrateurs & accès client'],
  ['lib/auth/session.ts', '__mfaRequired'],
  ['lib/angelcare360/server/context.ts', 'angelcare360_support_access'],
  ['lib/angelcare360/server/context.ts', 'deniedPermissions'],
  ['lib/angelcare360/module-access.ts', 'access.moduleKeys'],
  ['app/(protected)/angelcare-360-command-center/layout.tsx', 'MODE SUPPORT GOUVERNÉ'],
]
markerChecks.forEach(([rel, value]) => marker(rel, value))

const tsFiles = [
  'app/(protected)/angelcare-360-command-center/layout.tsx',
  'app/angelcare-360-access/activate/page.tsx',
  'app/angelcare-360-access/mfa/page.tsx',
  'app/api/angelcare360/access/activate/route.ts',
  'app/api/angelcare360/access/mfa/route.ts',
  'app/api/angelcare360/operator/tenant-access/route.ts',
  'components/angelcare360/access/TenantAccessActivationClient.tsx',
  'components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx',
  'components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx',
  'components/angelcare360/operator/product-kernel/ProductKernelStudio.tsx',
  'lib/ac360/runtime.ts',
  'lib/angelcare360/module-access.ts',
  'lib/angelcare360/operator/tenant-access.ts',
  'lib/angelcare360/permissions.ts',
  'lib/angelcare360/server/context.ts',
  'lib/auth/session.ts',
  'lib/getUser.ts',
  'types/angelcare360/module.ts',
  'types/angelcare360/operator/tenant-access.ts',
]
for (const rel of tsFiles) {
  if (!fs.existsSync(file(rel))) continue
  const result = ts.transpileModule(text(rel), { fileName: rel, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve } })
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  errors.length ? fail(`TypeScript syntax ${rel}`, errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join(' | ')) : pass(`TypeScript syntax ${rel}`)
}

function cssAudit(tsxRel, cssRel) {
  const source = text(tsxRel)
  const css = text(cssRel)
  const names = [...source.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
  for (const name of [...new Set(names)]) {
    new RegExp(`\\.${name}(?:[^A-Za-z0-9_-]|$)`).test(css) ? pass(`CSS module ${tsxRel}: ${name}`) : fail(`CSS module ${tsxRel}: ${name}`, 'missing')
  }
}
cssAudit('components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx', 'components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.module.css')
cssAudit('components/angelcare360/access/TenantAccessActivationClient.tsx', 'components/angelcare360/access/TenantAccessActivationClient.module.css')

const sqlRel = 'supabase/migrations/20260731_angelcare360_operator_tenant_identity_access_security_command.sql'
const sql = text(sqlRel)
const tables = [
  'angelcare360_operator_tenant_role_templates',
  'angelcare360_operator_tenant_access_accounts',
  'angelcare360_operator_tenant_admin_invitations',
  'angelcare360_operator_tenant_access_scopes',
  'angelcare360_operator_tenant_access_events',
  'angelcare360_operator_tenant_password_resets',
  'angelcare360_operator_tenant_support_access_sessions',
  'angelcare360_operator_tenant_owner_transfers',
]
for (const table of tables) {
  sql.includes(`create table if not exists public.${table}`) ? pass(`SQL table ${table}`) : fail(`SQL table ${table}`, 'missing')
  sql.includes(`alter table public.${table} enable row level security`) ? pass(`SQL RLS ${table}`) : fail(`SQL RLS ${table}`, 'missing')
  sql.includes(`revoke all on public.${table} from anon, authenticated`) ? pass(`SQL revoke ${table}`) : fail(`SQL revoke ${table}`, 'missing')
  sql.includes(`grant all on public.${table} to service_role`) ? pass(`SQL service role ${table}`) : fail(`SQL service role ${table}`, 'missing')
}
for (const value of ['token_hash text not null unique', 'mfa_secret_encrypted text', 'mfa_verified_at timestamptz', 'session_duration_hours', 'allowed_email_domains', 'tenant_access_one_owner_idx', 'Tenant Identity prerequisite relations missing']) {
  sql.includes(value) ? pass(`SQL marker ${value}`) : fail(`SQL marker ${value}`, 'missing')
}
const forbiddenSql = [/\bdrop\s+table\b/i, /\btruncate\s+table\b/i, /\bdrop\s+column\b/i, /\bpassword\s+text\b/i, /\btemporary_password\b/i, /\bplain(?:text)?_password\b/i]
for (const pattern of forbiddenSql) pattern.test(sql) ? fail(`SQL forbidden ${pattern}`) : pass(`SQL forbidden absent ${pattern}`)

const operatorUi = text('components/angelcare360/operator/tenant-access/TenantIdentityAccessCommand.tsx')
for (const pattern of [/placeholder=["'][^"']*uuid/i, /name=["']password/i, /temporary password/i, /mot de passe temporaire/i]) pattern.test(operatorUi) ? fail(`Operator UI forbidden ${pattern}`) : pass(`Operator UI forbidden absent ${pattern}`)

if (failures.length) {
  console.error(`\n${failures.length} verification failure(s).`)
  process.exit(1)
}
console.log(`\n${passed} checks passed. Tenant Identity, Administrator Access & Security Governance Command is statically accepted.`)
