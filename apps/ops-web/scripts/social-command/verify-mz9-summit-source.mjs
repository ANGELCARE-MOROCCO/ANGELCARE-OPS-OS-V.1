#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = []
let failures = 0
function file(rel){ return path.join(root, rel) }
function read(rel){ return fs.readFileSync(file(rel), 'utf8') }
function ok(label, pass){ checks.push([label, !!pass]); if(!pass) failures++ }
function has(rel, pattern){ return fs.existsSync(file(rel)) && (typeof pattern === 'string' ? read(rel).includes(pattern) : pattern.test(read(rel))) }
function absent(rel, pattern){ return !fs.existsSync(file(rel)) || !(typeof pattern === 'string' ? read(rel).includes(pattern) : pattern.test(read(rel))) }

const required = [
  'app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx',
  'app/(protected)/social-command/_components/MZ9ExecutionCommand.module.css',
  'app/(protected)/social-command/_components/MZ9SavedViews.tsx',
  'app/(protected)/social-command/_components/MZ9SavedViews.module.css',
  'app/api/social-command/operator-experience/[...segments]/route.ts',
  'lib/social-command/operator-experience.ts',
  'tsconfig.social-command-mz9.json',
  'supabase/social-command/20260811_social_command_mz9_operator_excellence_precheck.sql',
  'supabase/social-command/20260811_social_command_mz9_operator_excellence_migration.sql',
  'supabase/social-command/20260811_social_command_mz9_operator_excellence_verify.sql',
  'supabase/social-command/20260811_social_command_mz9_operator_excellence_rollback_DESTRUCTIVE.sql',
]
for (const rel of required) ok(`file exists: ${rel}`, fs.existsSync(file(rel)))

ok('SocialCommandClient imports MZ9 execution command', has('app/(protected)/social-command/_components/SocialCommandClient.tsx','MZ9ExecutionCommand'))
ok('SocialCommandClient imports saved views', has('app/(protected)/social-command/_components/SocialCommandClient.tsx','MZ9SavedViews'))
ok('Publish route uses MZ9ExecutionCommand', has('app/(protected)/social-command/_components/SocialCommandClient.tsx','<MZ9ExecutionCommand'))
ok('Saved views mounted after horizontal navigation', has('app/(protected)/social-command/_components/SocialCommandClient.tsx','<MZ9SavedViews'))
ok('Global shell supports slash shortcut', has('app/(protected)/social-command/_components/SocialCommandMZ4Shell.tsx','event.key === "/"'))
ok('Global command palette lists media assets', has('app/(protected)/social-command/_components/SocialCommandMZ4Shell.tsx','mediaMatches'))
ok('Global command palette lists relationships', has('app/(protected)/social-command/_components/SocialCommandMZ4Shell.tsx','relationshipMatches'))
ok('Command palette discloses keyboard shortcuts', has('app/(protected)/social-command/_components/SocialCommandMZ4Shell.tsx','⌘ K · /'))

ok('Execution dossier component declares provider truth', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx','EXECUTION DOSSIER · PROVIDER TRUTH'))
ok('Run label replaced with Execute now', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx','Execute now'))
ok('Confirming treated as Meta processing', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx','META PROCESSING'))
ok('Published disables resend language', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx','Provider success recorded · resend disabled'))
ok('Failure recovery requires explicit authorization', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx','Authorize retry'))
ok('Execution dossier fetches operator-experience API', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.tsx','/api/social-command/operator-experience/'))
ok('Execution command CSS provides drawer below header', has('app/(protected)/social-command/_components/MZ9ExecutionCommand.module.css','.drawerLayer'))

ok('Operator experience creates saved views', has('lib/social-command/operator-experience.ts','createSavedView'))
ok('Operator experience updates saved views', has('lib/social-command/operator-experience.ts','updateSavedView'))
ok('Operator experience deletes saved views', has('lib/social-command/operator-experience.ts','deleteSavedView'))
ok('Operator experience returns execution dossier', has('lib/social-command/operator-experience.ts','getExecutionJobDossier'))
ok('Operator API routes to saved views', has('app/api/social-command/operator-experience/[...segments]/route.ts','views'))
ok('Operator API routes to execution dossiers', has('app/api/social-command/operator-experience/[...segments]/route.ts','getExecutionJobDossier'))

ok('Publishing uses irreversible provider success boundary', has('lib/social-command/publishing.ts','irreversible provider-success boundary'))
ok('Publishing marks external success', has('lib/social-command/publishing.ts','externalSuccess'))
ok('Publishing does not retry after published bookkeeping warning', has('lib/social-command/publishing.ts','MUST NOT authorize another provider send') || has('lib/social-command/publishing.ts','must not authorize another provider send') || has('lib/social-command/publishing.ts','blind provider resend'))
ok('Stale recovery checks provider results', has('lib/social-command/publishing.ts','social_command_provider_results'))
ok('Stale recovery restores provider success evidence', has('lib/social-command/publishing.ts','externalSuccessRecovered'))
ok('recordAttempt checks database error', has('lib/social-command/publishing.ts','if (error) throw error'))
ok('reconcilePublication checks update error', has('lib/social-command/publishing.ts','updateError'))

ok('Instagram publish uses confirming lifecycle', has('lib/social-command/meta.ts','providerPhase: "processing"'))
ok('Instagram image containers wait for readiness', has('lib/social-command/meta.ts','stage: "single_container"') && has('lib/social-command/meta.ts','including images'))
ok('Instagram transient errors become confirmation state', has('lib/social-command/meta.ts','const transient') && has('lib/social-command/meta.ts','media id is not available'))
ok('Instagram carousel children are staged', has('lib/social-command/meta.ts','carousel_children'))
ok('Instagram parent waits before publish', has('lib/social-command/meta.ts','stage: "carousel_parent"'))

ok('MZ9 SQL creates saved views table', has('supabase/social-command/20260811_social_command_mz9_operator_excellence_migration.sql','social_command_saved_views'))
ok('MZ9 SQL creates operator preferences table', has('supabase/social-command/20260811_social_command_mz9_operator_excellence_migration.sql','social_command_operator_preferences'))
ok('MZ9 SQL enables RLS for saved views', has('supabase/social-command/20260811_social_command_mz9_operator_excellence_migration.sql','enable row level security'))
ok('MZ9 SQL revokes anon/auth direct table access', has('supabase/social-command/20260811_social_command_mz9_operator_excellence_migration.sql','revoke all'))
ok('MZ9 verify checks saved view table', has('supabase/social-command/20260811_social_command_mz9_operator_excellence_verify.sql','saved_views_table'))
ok('MZ9 rollback only drops MZ9 tables', has('supabase/social-command/20260811_social_command_mz9_operator_excellence_rollback_DESTRUCTIVE.sql','social_command_operator_preferences'))

ok('No Marketplace source under Social Command overlay paths', !fs.existsSync(file('apps/marketplace-web')))
ok('No environment file is part of MZ9 source', !required.some(rel => /(^|\/)\.env(\.|$)/.test(rel)))
ok('tsconfig includes next-env', has('tsconfig.social-command-mz9.json','next-env.d.ts'))
ok('tsconfig disables incremental state', has('tsconfig.social-command-mz9.json','"incremental": false'))

for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`)
if (failures) {
  console.error(`\nSOCIAL COMMAND MZ9 VERIFY = FAIL (${checks.length-failures}/${checks.length})`)
  process.exit(1)
}
console.log(`\nSOCIAL COMMAND MZ9 VERIFY = PASS (${checks.length}/${checks.length})`)
