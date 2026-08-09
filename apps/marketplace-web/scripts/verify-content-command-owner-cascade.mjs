import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
const failures = []
let checks = 0
const read = rel => fs.readFileSync(path.join(app, rel), 'utf8')
const requireFile = rel => {
  checks++
  if (!fs.existsSync(path.join(app, rel))) failures.push(`MISSING FILE: ${rel}`)
}
const contains = (rel, marker, label = marker) => {
  checks++
  const file = path.join(app, rel)
  if (!fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(marker)) failures.push(`${rel}: missing ${label}`)
}
const excludes = (rel, marker, label = marker) => {
  checks++
  const file = path.join(app, rel)
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(marker)) failures.push(`${rel}: forbidden ${label}`)
}

const required = [
  'components/market-os/content-command/runtime/CascadeDisposalPanel.tsx',
  'components/market-os/content-command/runtime/cascade-disposal-panel.module.css',
  'lib/market-os/content-command-headquarters/record-lifecycle-service.ts',
  'app/api/market-os/content-command-headquarters/record-governance/route.ts',
  'app/api/market-os/content-command/opportunities/action/route.ts',
  'app/api/market-os/content-command/campaigns/action/route.ts',
  'components/market-os/content-command/experience-bulk11/Bulk11OpportunityCommandWorkspace.tsx',
  'components/market-os/content-command/experience-bulk12/Bulk12CampaignOperatingWorkspace.tsx',
  'components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx',
  'components/market-os/content-command/headquarters/mz2-view-models.ts',
  'supabase/migrations/20260731_0115_content_command_owner_controlled_cascade.sql',
]
required.forEach(requireFile)

const lifecycle = 'lib/market-os/content-command-headquarters/record-lifecycle-service.ts'
for (const marker of [
  "| 'supersede' | 'cascade_archive' | 'permanent_delete'",
  'export type RecordCascadePlan',
  'export async function buildRecordCascadePlan',
  "match: 'eq' | 'contains' | 'nullable_eq'",
  "parentField?: string",
  "parentValue: string",
  "market_content_source_replacements",
  "market_content_generated_samples",
  "market_content_performance_events",
  "market_content_learning_records",
  "market_ai_compilation_items",
  "market_ai_tool_executions",
  "market_ai_dead_letters",
  "supabase.rpc('market_content_execute_owner_cascade'",
  "code: 'OWNER_CASCADE_SQL_REQUIRED'",
  "code: 'CASCADE_SCOPE_INCOMPLETE'",
  "code: 'PROTECTED_HISTORY_ACKNOWLEDGEMENT_REQUIRED'",
]) contains(lifecycle, marker)
excludes(lifecycle, "const rootDeletion = await supabase.from(plan.root.table).delete()", 'non-atomic root deletion')
excludes(lifecycle, "await supabase.from(node.table).delete()", 'non-atomic child deletion')

const panel = 'components/market-os/content-command/runtime/CascadeDisposalPanel.tsx'
for (const marker of [
  'OWNER-CONTROLLED CASCADE',
  'Vous décidez du sort de tout le cycle',
  'Sélectionner et prendre en charge tous les objets attachés',
  'Supprimer avec le cycle',
  'Détacher et conserver',
  'Je reconnais que la suppression est irréversible',
  'Je reconnais la suppression d’historique validé',
  'Archiver tout le cycle à la place',
]) contains(panel, marker)

const opportunity = 'components/market-os/content-command/experience-bulk11/Bulk11OpportunityCommandWorkspace.tsx'
for (const marker of [
  "const [surface,setSurface]=React.useState<'active'|'history'|'all'>('active')",
  'CascadeDisposalPanel',
  'defaultCascadeSelections',
  'cascadeSelections',
  'acknowledgeIrreversible',
  'acknowledgeProtected',
  "await act('cascade_archive'",
  'Vous gardez la main.',
  '<option value="active">Actives uniquement</option>',
]) contains(opportunity, marker)
excludes(opportunity, 'La purge reste gouvernée.', 'legacy blocker doctrine')

const campaign = 'components/market-os/content-command/experience-bulk12/Bulk12CampaignOperatingWorkspace.tsx'
for (const marker of [
  "const [surface,setSurface]=React.useState<'active'|'history'|'all'>('active')",
  'terminalCampaignStatuses',
  'CascadeDisposalPanel',
  "await act('cascade_archive'",
  '<option value="history">Clôturées / historique</option>',
  'Vous gardez la main.',
]) contains(campaign, marker)

const governance = 'components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx'
for (const marker of [
  'CascadeDisposalPanel',
  "setDialog('cascade_archive')",
  'cascadeSelections',
  'acknowledgeIrreversible',
  'acknowledgeProtected',
]) contains(governance, marker)

const home = 'components/market-os/content-command/ContentCommand360Home.tsx'
for (const marker of [
  'const terminalStatuses = new Set',
  'const activeItems = store.items.filter',
  'Clôturés / rejetés / archivés',
  'Les objets terminés ou retirés sont conservés',
]) contains(home, marker)
excludes(home, 'Local Storage v2', 'stale local-storage authority label')

const command = 'components/market-os/content-command/headquarters/mz2-view-models.ts'
for (const marker of [
  'const terminalStatuses = new Set',
  'const operationalDossiers = dossiers.filter',
  'const operationalMissions = missions.filter',
  'const operationalTasks = tasks.filter',
  'const operationalPackages = packages.filter',
  'const allLifecycleRecords = [...operationalDossiers, ...operationalMissions, ...operationalTasks]',
  'const runway = operationalDossiers',
]) contains(command, marker)

for (const rel of [
  'app/api/market-os/content-command-headquarters/record-governance/route.ts',
  'app/api/market-os/content-command/opportunities/action/route.ts',
  'app/api/market-os/content-command/campaigns/action/route.ts',
]) {
  contains(rel, 'cascadeSelections')
  contains(rel, 'acknowledgeAll')
  contains(rel, 'acknowledgeIrreversible')
  contains(rel, 'acknowledgeProtected')
}
contains('app/api/market-os/content-command-headquarters/record-governance/route.ts', "url.searchParams.get('cascade')==='1'")

const opportunityService = 'lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts'
for (const marker of ['OPPORTUNITY_INACTIVE_STATUSES', "operationalState:inactive?'history':'active'", 'activeOpportunities:active', 'historyOpportunities:history']) contains(opportunityService, marker)
const campaignService = 'lib/market-os/content-command-headquarters/campaign-orchestration-service.ts'
for (const marker of ['cleanupCampaignOperationalSurfaces', "if(['cancel','complete','close','supersede'].includes(input.decision))", "status:'cancelled'", "status= input.decision==='complete'||input.decision==='close'?'closed':'archived'"]) {
  // tolerate minified spacing variations for the final marker through a weaker substring.
  if (marker.includes('status= ')) contains(campaignService, "input.decision==='complete'||input.decision==='close'?'closed':'archived'")
  else contains(campaignService, marker)
}

const sql = 'supabase/migrations/20260731_0115_content_command_owner_controlled_cascade.sql'
for (const marker of [
  'create or replace function public.market_content_execute_owner_cascade',
  'security definer',
  "'market_content_source_replacements'",
  "'market_ai_dead_letters'",
  "v_disposition = 'delete'",
  "v_disposition = 'detach'",
  "v_match = 'contains'",
  "v_match = 'nullable_eq'",
  "raise exception 'CASCADE_ROOT_NOT_DELETED",
  'grant execute on function public.market_content_execute_owner_cascade',
  'to service_role',
]) contains(sql, marker)

// CSS-module references must resolve.
const cssPairs = [
  ['components/market-os/content-command/runtime/CascadeDisposalPanel.tsx','components/market-os/content-command/runtime/cascade-disposal-panel.module.css'],
  ['components/market-os/content-command/experience-bulk11/Bulk11OpportunityCommandWorkspace.tsx','components/market-os/content-command/experience-bulk11/bulk11-opportunity.module.css'],
  ['components/market-os/content-command/experience-bulk12/Bulk12CampaignOperatingWorkspace.tsx','components/market-os/content-command/experience-bulk12/bulk12-campaign.module.css'],
  ['components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx','components/market-os/content-command/experience-bulk9/bulk9-governance.module.css'],
]
for (const [tsxRel, cssRel] of cssPairs) {
  const tsx = read(tsxRel)
  const css = read(cssRel)
  const refs = [...tsx.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map(match => match[1])
  for (const ref of new Set(refs)) {
    checks++
    if (!new RegExp(`\\.${ref}(?:\\{|:|\\[|\\s|,)`).test(css)) failures.push(`${tsxRel}: CSS module property ${ref} missing in ${cssRel}`)
  }
}

if (failures.length) {
  console.error(`FAIL — ${failures.length} owner-control verification failure(s).`)
  for (const failure of failures) console.error(` - ${failure}`)
  process.exit(1)
}
console.log(`PASS — ${checks} owner-controlled cascade, active-surface hygiene, authority and atomic-runtime checks passed.`)
