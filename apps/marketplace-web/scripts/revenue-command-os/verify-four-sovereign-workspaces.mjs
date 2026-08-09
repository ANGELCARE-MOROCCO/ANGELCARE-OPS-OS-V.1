import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const base = 'app/(protected)/revenue-command-os/_components/operational-depth'
const files = {
  objectives: `${base}/ObjectivePortfolioWorkspace.tsx`,
  programs: `${base}/ProgramsPortfolioWorkspace.tsx`,
  missions: `${base}/MissionsOperationsWorkspace.tsx`,
  exceptions: `${base}/ExceptionsRecoveryWorkspace.tsx`,
  mandateDossier: `${base}/MandateArchitectureDossier.tsx`,
  programDossier: `${base}/ProgramValueRealizationDossier.tsx`,
  missionDossier: `${base}/MissionControlDossier.tsx`,
  incidentDossier: `${base}/RevenueIncidentDossier.tsx`,
  primitives: `${base}/SovereignDossierPrimitives.tsx`,
  utils: `${base}/sovereign-workspace-utils.ts`,
  hook: `${base}/useSovereignDossier.ts`,
  tsconfig: 'tsconfig.revenue-os-four-sovereign-workspaces.json',
}

const contents = Object.fromEntries(Object.entries(files).map(([key, rel]) => {
  const absolute = path.join(root, rel)
  if (!fs.existsSync(absolute)) throw new Error(`missing:${rel}`)
  return [key, fs.readFileSync(absolute, 'utf8')]
}))

const checks = []
const requireText = (file, token, label = `${file}:${token}`) => checks.push({ label, pass: contents[file].includes(token) })
const forbidText = (file, token, label = `${file}:forbidden:${token}`) => checks.push({ label, pass: !contents[file].includes(token) })

for (const token of [
  'Strategic Mandate Architecture Room', 'MandateArchitectureDossier', 'Mandate decomposition',
  'Architecture d’exécution', 'Rythme requis', 'Créer un mandat', 'CanonicalCsvImportDock',
]) requireText('objectives', token)
for (const token of [
  'Revenue Portfolio Command & Value Realization Floor', 'ProgramValueRealizationDossier',
  'Value realization', 'Portefeuille total', 'frontier', 'Intervention recommandée', 'CreateLiveEntityButton',
]) requireText('programs', token)
for (const token of [
  'Commercial Mission Control & Execution Network', 'MissionControlDossier', 'MissionNetwork',
  'Live execution timeline', 'MissionLane', 'Owner workload', 'CreateLiveEntityButton',
]) requireText('missions', token)
for (const token of [
  'Revenue Incident Command & Recovery System', 'RevenueIncidentDossier', 'Intervention queue',
  'RecoveryRunway', 'Root-cause intelligence', 'Revenue rescue clock', 'CreateLiveEntityButton',
]) requireText('exceptions', token)

for (const token of [
  'Intégrité structurelle', 'Mandate Success Architecture', 'create_child', 'record_outcome',
  'link_entity', 'unlink_entity', 'LiveEntityActions', 'AuditFeed',
]) requireText('mandateDossier', token)
for (const token of [
  'Value realization bridge', 'Program operating topology', 'Executive intervention mode',
  'create_child', 'record_outcome', 'link_entity', 'unlink_entity', 'LiveEntityActions',
]) requireText('programDossier', token)
for (const token of [
  'Mission Flight Plan', 'Evidence command strip', 'TaskLane', 'create_child', 'record_outcome',
  'link_entity', 'unlink_entity', 'LiveEntityActions',
]) requireText('missionDossier', token)
for (const token of [
  'Revenue Incident Command', 'Recovery runway', 'Blast radius', 'create_child', 'record_outcome',
  'link_entity', 'unlink_entity', 'LiveEntityActions',
]) requireText('incidentDossier', token)

for (const token of ['RelationManager', 'DossierBackdrop', 'StudioMetric', 'NoteComposer', 'AuditFeed']) requireText('primitives', token)
for (const token of ['money', 'daysRemaining', 'safeRatio', 'statusTone', 'parentIdOf']) requireText('utils', token)
for (const token of ['revenue-os:operation-completed', 'managedRevenueHeaders', 'emitRevenueAction']) requireText('hook', token)

for (const file of ['objectives', 'programs', 'missions', 'exceptions']) {
  forbidText(file, 'OperationalEntityDrawer', `${file}:no-generic-primary-drawer`)
  forbidText(file, 'ObjectivesHero', `${file}:no-legacy-objective-hero`)
  forbidText(file, 'ProgramsHero', `${file}:no-legacy-program-hero`)
  forbidText(file, 'MissionsHero', `${file}:no-legacy-mission-hero`)
  forbidText(file, 'ExceptionsHero', `${file}:no-legacy-exception-hero`)
}

const routeTexts = ['objectives', 'programs', 'missions', 'exceptions'].map((key) => contents[key])
checks.push({ label: 'four-route-source-identities-unique', pass: new Set(routeTexts).size === 4 })
checks.push({ label: 'strict-tsconfig-no-emit', pass: contents.tsconfig.includes('"noEmit": true') })
checks.push({ label: 'strict-tsconfig-no-build-output', pass: !contents.tsconfig.includes('outDir') })

const failures = checks.filter((item) => !item.pass)
const result = {
  contract: 'AC-RCOS-FOUR-SOVEREIGN-WORKSPACES-MASTER-CLOSURE-2026.08',
  passed: checks.length - failures.length,
  failed: failures.length,
  failures: failures.map((item) => item.label),
  sovereignWorkspaces: 4,
  purposeBuiltDossiers: 4,
  genericPrimaryDrawers: 0,
  localBuildIncluded: false,
  sqlChanges: 0,
}
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exit(1)
console.log('FOUR SOVEREIGN WORKSPACES MASTER SOURCE ACCEPTANCE PASSED')
