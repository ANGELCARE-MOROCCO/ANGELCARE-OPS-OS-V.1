import fs from 'node:fs'
import path from 'node:path'
import { projectRoot, walk, writeEvidence, markdownTable, normalize } from './lib.mjs'

const root = projectRoot()
const startedAt = new Date().toISOString()
const checks = []
const findings = []

function check(id, passed, details = '', severity = 'critical') {
  const entry = { id, passed: Boolean(passed), details, severity }
  checks.push(entry)
  console.log(`${entry.passed ? '  ✓' : severity === 'critical' ? '  ✗' : '  !'} ${id}${details ? ` — ${details}` : ''}`)
  return entry.passed
}

const migrations = walk('supabase/migrations').filter((file) => /angelcare_marketplace.*\.sql$/i.test(file)).sort()
const rollbacks = walk('angelcare-marketplace/database/rollback').filter((file) => /\.sql$/i.test(file)).sort()
let cumulative = ''
const migrationRecords = []

function quotedNames(value) {
  return [...value.matchAll(/'([a-zA-Z0-9_]+)'/g)].map((entry) => entry[1])
}

const createdTables = new Set()
const rlsTables = new Set()
const revokedTables = new Set()
const serviceRoleTables = new Set()
const destructive = []

for (const file of migrations) {
  const sql = fs.readFileSync(path.join(root, file), 'utf8')
  cumulative += `\n-- ${file}\n${sql}`
  const creates = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)/gi)].map((entry) => entry[1])
  creates.forEach((table) => createdTables.add(table))
  for (const match of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?public\.([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi)) rlsTables.add(match[1])
  for (const statement of sql.matchAll(/revoke\s+all\s+on(?:\s+table)?\s+([\s\S]*?)\s+from\s+anon\s*,\s*authenticated\s*;/gi)) {
    for (const match of statement[1].matchAll(/public\.([a-zA-Z0-9_]+)/gi)) revokedTables.add(match[1])
  }
  for (const statement of sql.matchAll(/grant\s+all\s+on(?:\s+table)?\s+([\s\S]*?)\s+to\s+service_role\s*;/gi)) {
    for (const match of statement[1].matchAll(/public\.([a-zA-Z0-9_]+)/gi)) serviceRoleTables.add(match[1])
  }
  for (const loop of sql.matchAll(/foreach\s+\w+\s+in\s+array\s+array\[([\s\S]*?)\]\s+loop([\s\S]*?)end loop/gi)) {
    const names = quotedNames(loop[1])
    if (/enable row level security/i.test(loop[2])) names.forEach((name) => rlsTables.add(name))
    if (/revoke all on(?: table)? public\.%I from anon, authenticated/i.test(loop[2])) names.forEach((name) => revokedTables.add(name))
    if (/grant all on(?: table)? public\.%I to service_role/i.test(loop[2])) names.forEach((name) => serviceRoleTables.add(name))
  }
  for (const [label, pattern] of [
    ['DROP TABLE', /\bdrop\s+table\b/i],
    ['DROP COLUMN', /\bdrop\s+column\b/i],
    ['TRUNCATE', /\btruncate(?:\s+table)?\b/i],
  ]) {
    if (pattern.test(sql)) destructive.push({ file, label })
  }
  migrationRecords.push({ file, creates: creates.length, bytes: Buffer.byteLength(sql) })
}

const marketplaceTables = [...createdTables].filter((table) => table.startsWith('angelcare_marketplace_')).sort()
const missingRls = marketplaceTables.filter((table) => !rlsTables.has(table))
const missingRevoke = marketplaceTables.filter((table) => !revokedTables.has(table))
const missingServiceRoleGrant = marketplaceTables.filter((table) => !serviceRoleTables.has(table))

console.log('ANGELCARE Marketplace — SQL & Security Assurance')
check('migration chronology present', migrations.length >= 25, `${migrations.length} ordered Marketplace migrations`)
check('rollback estate present', rollbacks.length >= 10, `${rollbacks.length} data-preserving rollback files`)
check('non-destructive migrations', destructive.length === 0, `${destructive.length} destructive statements`)
check('RLS coverage', missingRls.length === 0, `${marketplaceTables.length} created Marketplace tables · ${missingRls.length} missing`)
check('anon/auth direct-access revocation', missingRevoke.length === 0, `${missingRevoke.length} tables without explicit cumulative revocation`, 'warning')
check('service-role data authority', missingServiceRoleGrant.length === 0, `${missingServiceRoleGrant.length} tables without explicit cumulative grant`, 'warning')

const requiredPermissionKeys = [
  'marketplace.intelligence.view',
  'marketplace.intelligence.metrics.manage',
  'marketplace.growth.view',
  'marketplace.growth.experiments.manage',
  'marketplace.performance.view',
  'marketplace.security.assess',
  'marketplace.launch.approve',
  'marketplace.launch.monitoring',
]
const missingPermissionKeys = requiredPermissionKeys.filter((key) => !cumulative.includes(`'${key}'`))
check('Final Authority permission persistence', missingPermissionKeys.length === 0, `${missingPermissionKeys.length} missing permission keys`)

const requiredTables = [
  'angelcare_marketplace_catalog_items',
  'angelcare_marketplace_conversion_sessions',
  'angelcare_marketplace_journeys',
  'angelcare_marketplace_fulfillment_cases',
  'angelcare_marketplace_reconciliation_cases',
  'angelcare_marketplace_metric_definitions',
  'angelcare_marketplace_security_controls',
  'angelcare_marketplace_qa_runs',
  'angelcare_marketplace_launch_gates',
  'angelcare_marketplace_release_records',
  'angelcare_marketplace_monitoring_events',
]
const missingRequiredTables = requiredTables.filter((table) => !createdTables.has(table) && !cumulative.includes(`public.${table}`))
check('cumulative canonical authority tables', missingRequiredTables.length === 0, `${missingRequiredTables.length} required authorities missing`)

const finalMigration = migrations.find((file) => file.includes('final_launch_authority_universe'))
const finalSql = finalMigration ? fs.readFileSync(path.join(root, finalMigration), 'utf8') : ''
check('Final Authority canonical module schema', /angelcare_marketplace_modules\(\s*module_key\s*,\s*name\s*,/is.test(finalSql) && !/angelcare_marketplace_modules\(\s*module_key\s*,\s*name_fr\s*,/is.test(finalSql))
check('post-MZ20 module sequence compatibility', /introduced_by_mega_zip\s*>=\s*1/.test(finalSql) && /marketplace_final_authority_manager[\s\S]*?25/.test(finalSql))
check('release registry compatibility evolution', /marketplace_delivery_sequence/.test(finalSql) && /alter column mega_zip drop not null/i.test(finalSql))
check('evidence-backed launch gate schema', /evidence_status/.test(finalSql) && /angelcare_marketplace_launch_evidence/.test(finalSql))

const protectedPageFiles = walk('app/angelcare-marketplace').filter((file) => file.includes('/(protected)/') && /\/page\.tsx$/.test(file))
const guardPattern = /requireMarketplacePageContext|resolveMarketplaceContext|requireMarketplaceApiContext|redirect\(/
function inheritedPageGuard(file) {
  let directory = path.dirname(path.join(root, file))
  const boundary = path.join(root, 'app/angelcare-marketplace/(protected)')
  while (directory.startsWith(boundary)) {
    for (const name of ['layout.tsx', 'layout.ts']) {
      const layout = path.join(directory, name)
      if (fs.existsSync(layout) && guardPattern.test(fs.readFileSync(layout, 'utf8'))) return normalize(path.relative(root, layout))
    }
    if (directory === boundary) break
    directory = path.dirname(directory)
  }
  return null
}
const unguardedProtectedPages = []
const inheritedProtectedPages = []
for (const file of protectedPageFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  if (guardPattern.test(source)) continue
  const inherited = inheritedPageGuard(file)
  if (inherited) inheritedProtectedPages.push({ file, layout: inherited })
  else unguardedProtectedPages.push(file)
}
check('protected page server authorization markers', unguardedProtectedPages.length === 0, `${protectedPageFiles.length} pages · ${inheritedProtectedPages.length} inherit guarded layout · ${unguardedProtectedPages.length} unguarded`, 'warning')

function resolveLocalModule(specifier) {
  let base = null
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2))
  if (!base) return null
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}
function delegatedApiBoundary(source, publicMutation = false) {
  const specifiers = new Set()
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) specifiers.add(match[1])
  for (const match of source.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) specifiers.add(match[1])
  for (const specifier of specifiers) {
    const module = resolveLocalModule(specifier)
    if (!module) continue
    const delegated = fs.readFileSync(module, 'utf8')
    if (/requireMarketplaceApiContext/.test(delegated) && /apiFailure|MarketplaceError/.test(delegated)) return normalize(path.relative(root, module))
    if (publicMutation && /apiFailure/.test(delegated) && /parseJsonObject|requireText/.test(delegated)) return normalize(path.relative(root, module))
  }
  return null
}
const apiFiles = walk('app/api/angelcare-marketplace').filter((file) => /\/route\.ts$/.test(file))
const mutationApiFiles = []
const unguardedMutationApis = []
const delegatedMutationApis = []
for (const file of apiFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  if (!/export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)|export\s+const\s+(?:POST|PUT|PATCH|DELETE)|\bas\s+(?:POST|PUT|PATCH|DELETE)\b/.test(source)) continue
  mutationApiFiles.push(file)
  if (/requireMarketplaceApiContext|apiFailure/.test(source)) continue
  const delegated = delegatedApiBoundary(source, file.includes('/public/'))
  if (delegated) delegatedMutationApis.push({ file, handler: delegated })
  else unguardedMutationApis.push(file)
}
check('mutation API authorization/error boundary', unguardedMutationApis.length === 0, `${mutationApiFiles.length} mutation APIs · ${delegatedMutationApis.length} delegated to guarded handlers · ${unguardedMutationApis.length} unguarded`, 'warning')

const clientSecretFindings = []
for (const file of [
  ...walk('angelcare-marketplace').filter((entry) => /\.(?:ts|tsx)$/.test(entry)),
  ...walk('app/angelcare-marketplace').filter((entry) => /\.(?:ts|tsx)$/.test(entry)),
]) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  if (/['"]use client['"][\s\S]*?(?:SUPABASE_SERVICE_ROLE_KEY|service_role)/i.test(source)) clientSecretFindings.push(file)
}
check('client service-role secret boundary', clientSecretFindings.length === 0, `${clientSecretFindings.length} findings`)

for (const finding of destructive) findings.push({ category: 'destructive-sql', ...finding })
for (const table of missingRls) findings.push({ category: 'missing-rls', table })
for (const table of missingRevoke) findings.push({ category: 'missing-revoke', table })
for (const table of missingServiceRoleGrant) findings.push({ category: 'missing-service-grant', table })
for (const file of unguardedProtectedPages) findings.push({ category: 'unguarded-protected-page', file })
for (const entry of inheritedProtectedPages) findings.push({ category: 'inherited-page-guard', ...entry })
for (const file of unguardedMutationApis) findings.push({ category: 'unguarded-mutation-api', file })
for (const entry of delegatedMutationApis) findings.push({ category: 'delegated-api-guard', ...entry })
for (const file of clientSecretFindings) findings.push({ category: 'client-secret', file })

const criticalFailures = checks.filter((entry) => !entry.passed && entry.severity === 'critical')
const warnings = checks.filter((entry) => !entry.passed && entry.severity === 'warning')
const status = criticalFailures.length ? 'FAIL' : warnings.length ? 'CONDITIONAL' : 'PASS'
const completedAt = new Date().toISOString()
const evidence = {
  programme: 'ANGELCARE Marketplace SQL & Security Assurance',
  startedAt,
  completedAt,
  status,
  summary: {
    migrations: migrations.length,
    rollbackFiles: rollbacks.length,
    createdMarketplaceTables: marketplaceTables.length,
    rlsTables: rlsTables.size,
    revokedTables: revokedTables.size,
    serviceRoleTables: serviceRoleTables.size,
    protectedPages: protectedPageFiles.length,
    mutationApis: mutationApiFiles.length,
    criticalFailures: criticalFailures.length,
    warnings: warnings.length,
  },
  checks,
  findings,
  migrations: migrationRecords,
}
const markdown = `# ANGELCARE Marketplace SQL & Security Assurance

**Status:** ${status}
**Migrations:** ${migrations.length}
**Marketplace tables created:** ${marketplaceTables.length}
**Protected pages reviewed:** ${protectedPageFiles.length}
**Mutation APIs reviewed:** ${mutationApiFiles.length}

${markdownTable(['Gate', 'Result', 'Details'], checks.map((entry) => [entry.id, entry.passed ? 'PASS' : entry.severity === 'warning' ? 'WARNING' : 'FAIL', entry.details]))}

## Evidence boundary

This is a source-level migration and authorization audit. Definitive database acceptance still requires executing the supplied read-only Supabase preflight against the selected production project and testing allowed and denied runtime identities.
`
const paths = writeEvidence('SQL_SECURITY_ASSURANCE', evidence, markdown)
console.log(`\nRESULT: ${status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = criticalFailures.length ? 1 : 0
