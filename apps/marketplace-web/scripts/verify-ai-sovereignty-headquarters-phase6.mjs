#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(root, relative))
const failures = []
const passes = []
const requireFile = (relative) => exists(relative) ? passes.push(`file ${relative}`) : failures.push(`missing file ${relative}`)
const requireText = (content, marker, label = marker) => content.includes(marker) ? passes.push(label) : failures.push(`missing marker: ${label}`)
const forbidText = (content, marker, label = marker) => !content.includes(marker) ? passes.push(`absent ${label}`) : failures.push(`forbidden marker remains: ${label}`)

const requiredFiles = [
  'app/(protected)/ai-provider-control/page.tsx',
  'app/(protected)/ai-provider-control/runtime-core/page.tsx',
  'app/(protected)/ai-provider-control/manual/page.tsx',
  'components/ai-provider-control/headquarters/AiSovereigntyOperationsHeadquarters.tsx',
  'components/ai-provider-control/headquarters/AiSovereigntyOperatorAcademy.tsx',
  'components/ai-provider-control/headquarters/headquarters-primitives.tsx',
  'components/ai-provider-control/headquarters/headquarters-types.ts',
  'components/ai-provider-control/headquarters/ai-sovereignty-headquarters.module.css',
  'components/ai-provider-control/headquarters/ai-sovereignty-headquarters.module.css.d.ts',
  'lib/ai-provider-control/types.ts',
  'lib/ai-provider-control/repository.ts',
  'lib/ai-provider-control/gemini-runtime.ts',
  'app/api/ai-provider-control/action/route.ts',
  'supabase/migrations/20260727_0200_ai_sovereignty_operations_headquarters_phase6.sql',
  'supabase/ai-sovereignty-headquarters/preflight/20260727_ai_sovereignty_headquarters_phase6_preflight.sql',
  'supabase/ai-sovereignty-headquarters/verification/20260727_ai_sovereignty_headquarters_phase6_verification.sql',
  'supabase/ai-sovereignty-headquarters/rollback/20260727_ai_sovereignty_headquarters_phase6_guarded_rollback.sql',
  'tsconfig.ai-sovereignty-headquarters-phase6-ui.json',
  'scripts/ai-sovereignty-phase6-stubs.d.ts',
]
requiredFiles.forEach(requireFile)

if (!failures.length) {
  const hq = read('components/ai-provider-control/headquarters/AiSovereigntyOperationsHeadquarters.tsx')
  const academy = read('components/ai-provider-control/headquarters/AiSovereigntyOperatorAcademy.tsx')
  const css = read('components/ai-provider-control/headquarters/ai-sovereignty-headquarters.module.css')
  const migration = read('supabase/migrations/20260727_0200_ai_sovereignty_operations_headquarters_phase6.sql')
  const repository = read('lib/ai-provider-control/repository.ts')
  const actionRoute = read('app/api/ai-provider-control/action/route.ts')
  const types = read('lib/ai-provider-control/types.ts')
  const geminiRuntime = read('lib/ai-provider-control/gemini-runtime.ts')

  const workspaceLabels = [
    'Situation souveraine','Portefeuille fournisseurs','Vault & rotations','Matrice d’alimentation',
    'Studio de routage','Laboratoire capacité','Registre modèles','Revenue AI Operations',
    'Contrôle financier','Incident Laboratory','Change Control','Operator Academy',
  ]
  workspaceLabels.forEach((label) => requireText(hq, `label: '${label}'`, `workspace ${label}`))
  if ((hq.match(/label: '/g) || []).length < 12) failures.push('fewer than 12 workspace definitions')
  else passes.push('12+ workspace definitions')

  ;['⌘ K','Ouvrir dossier 360','DUAL-CONTROL DESTRUCTION QUEUE','SAFE PRACTICE LAB','Change Control','Ouvrir la simulation live','Revenue AI Operations'].forEach((marker) => requireText(hq, marker, `HQ capability ${marker}`))
  ;['Manuel vivant, workbook et certification opérateur','SEARCHABLE SOP LIBRARY','SAFE PRACTICE LABORATORY','Terminer & certifier'].forEach((marker) => requireText(academy, marker, `academy ${marker}`))

  const tables = [
    'ai_ops_incident_cases','ai_ops_change_requests','ai_ops_destruction_requests','ai_ops_provider_adapters',
    'ai_ops_capability_registry','ai_ops_module_registry','ai_ops_sop_articles','ai_ops_sop_progress',
    'ai_ops_operator_notes','ai_ops_action_jobs','ai_ops_entity_tombstones',
  ]
  tables.forEach((name) => requireText(migration, `create table if not exists public.${name}`, `table ${name}`))
  ;['ai_ops_dependency_snapshot','ai_ops_execute_destruction'].forEach((name) => requireText(migration, `create or replace function public.${name}`, `function ${name}`))
  ;['ACTIVE_CREDENTIAL_CANNOT_BE_DESTROYED','DOSSIER_MUST_BE_ARCHIVED_AND_DISABLED','DOSSIER_HAS_ACTIVE_DEPENDENCIES','vault.secrets','ai_ops_entity_tombstones'].forEach((marker) => requireText(migration, marker, `destruction guard ${marker}`))
  const sopSeedCount = (migration.match(/^\('[-a-z0-9]+',\d+,'/gm) || []).length
  if (sopSeedCount >= 12) passes.push(`${sopSeedCount} SOP seed articles`)
  else failures.push(`expected >=12 SOP articles, found ${sopSeedCount}`)

  const actions = [
    'phase6_set_dossier_state','phase6_set_credential_state','phase6_update_alert','phase6_save_incident',
    'phase6_resolve_incident','phase6_save_change_request','phase6_update_change_status','phase6_request_destruction',
    'phase6_approve_destruction','phase6_execute_destruction','phase6_save_registry','phase6_save_sop_progress',
    'phase6_save_operator_note','phase6_create_action_job',
  ]
  actions.forEach((action) => {
    requireText(repository, `action === '${action}'`, `repository action ${action}`)
    requireText(actionRoute, `${action}:`, `permission action ${action}`)
  })
  requireText(types, 'phase6: AiOpsPhase6Snapshot', 'snapshot Phase 6 type')
  requireText(repository, 'phase6: {', 'snapshot Phase 6 loader')
  requireText(geminiRuntime, "'MINIMAL'", 'Gemini MINIMAL health level')
  requireText(repository, 'healthTokenMatched', 'non-brittle health evidence')
  forbidText(repository, 'PROVIDER_TEST_UNEXPECTED_OUTPUT', 'strict provider output assertion')

  const tsx = [hq, academy, read('components/ai-provider-control/headquarters/headquarters-primitives.tsx')].join('\n')
  const styleRefs = new Set([...tsx.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]))
  const cssClasses = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
  const missingClasses = [...styleRefs].filter((name) => !cssClasses.has(name))
  if (missingClasses.length) failures.push(`CSS classes missing: ${missingClasses.join(', ')}`)
  else passes.push(`${styleRefs.size} CSS module references resolve`)
  if (/(^|[}\s,]):root\b/m.test(css) || /(^|[}\s,])(?:html|body)\s*\{/m.test(css)) failures.push('global CSS selector found in module')
  else passes.push('CSS module global selector purity')
  if (/\n\s*\*\s*\{/.test(css)) failures.push('bare universal selector found')
  else passes.push('no bare universal selector')

  requireText(read('app/(protected)/ai-provider-control/runtime-core/page.tsx'), 'AiProviderControlWorkspace', 'stable runtime core preserved')
  requireText(read('app/(protected)/ai-provider-control/manual/page.tsx'), 'AiSovereigntyOperatorAcademy', 'manual route mounted')
}

if (failures.length) {
  console.error('AI SOVEREIGNTY HEADQUARTERS PHASE 6 VERIFICATION FAILED')
  failures.forEach((item) => console.error(`FAIL · ${item}`))
  process.exit(2)
}
console.log(`PASS · SANILA AI Sovereignty Headquarters Phase 6 · ${passes.length} checks`)
console.log('PASS · 12 unique workspaces · 11 tables · 2 protected functions · 12 SOPs')
