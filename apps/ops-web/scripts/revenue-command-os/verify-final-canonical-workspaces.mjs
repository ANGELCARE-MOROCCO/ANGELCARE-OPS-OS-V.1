import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(root, relative))
const failures = []
const pass = []

function requireText(relative, tokens) {
  if (!exists(relative)) {
    failures.push(`missing:${relative}`)
    return
  }
  const source = read(relative)
  for (const token of tokens) {
    if (!source.includes(token)) failures.push(`${relative}:missing:${token}`)
    else pass.push(`${relative}:${token}`)
  }
}

const canonicalPages = {
  'app/(protected)/revenue-command-os/cockpit/page.tsx': ['PremiumRevenueCockpit', 'data-revenue-workspace="cockpit"'],
  'app/(protected)/revenue-command-os/strategy-engine/page.tsx': ['StrategiesHero', 'data-revenue-workspace="strategy-engine"'],
  'app/(protected)/revenue-command-os/validation-council/page.tsx': ['CouncilWorkspace', 'data-revenue-workspace="validation-council"'],
  'app/(protected)/revenue-command-os/strategy-studio/page.tsx': ['StrategyStudioWorkspace', 'data-revenue-workspace="strategy-studio"'],
  'app/(protected)/revenue-command-os/mission-compiler/page.tsx': ['MissionCompilerWorkspace', 'data-revenue-workspace="mission-compiler"'],
  'app/(protected)/revenue-command-os/execution-autopilot/page.tsx': ['ExecutionAutopilotWorkspace', 'data-revenue-workspace="execution-autopilot"'],
  'app/(protected)/revenue-command-os/mega-production/page.tsx': ['MegaProductionConsole', 'data-revenue-workspace="mega-production"'],
  'app/(protected)/revenue-command-os/command-kernel/page.tsx': ['CommandKernelWorkspace', 'CanonicalCsvImportDock', 'data-revenue-workspace="command-kernel"'],
  'app/(protected)/revenue-command-os/memory-learning/page.tsx': ['KnowledgeMemoryWorkspace', 'CanonicalCsvImportDock', 'data-revenue-workspace="memory-learning"'],
  'app/(protected)/revenue-command-os/gemini-resources/page.tsx': ['GeminiResourcesWorkspace'],
}

for (const [relative, tokens] of Object.entries(canonicalPages)) {
  requireText(relative, tokens)
  if (exists(relative) && relative !== 'app/(protected)/revenue-command-os/page.tsx' && read(relative).includes('RevenueOperatingSpine')) {
    failures.push(`${relative}:generic-operating-spine-substitution`)
  }
}

requireText('app/(protected)/revenue-command-os/_components/RevenueOsWorkspacePage.tsx', [
  '<MandateLedger />',
  '<ProgramTerrain />',
  '<MissionBinders />',
  '<ApprovalCenterWorkspace />',
  '<InterventionTower />',
  '<ForensicLedger />',
  '<GovernanceConstitution />',
  'CanonicalCsvImportDock kind="mandates"',
])

requireText('app/(protected)/revenue-command-os/intelligent-commands/page.tsx', [
  "permanentRedirect('/revenue-command-os/command-kernel')",
])
requireText('lib/revenue-command-os/constants.ts', [
  "key: 'gemini-resources'",
  "href: '/revenue-command-os/gemini-resources'",
  "key: 'intelligent-commands'",
  "href: '/revenue-command-os/command-kernel'",
])
requireText('lib/revenue-command-os/repository.ts', [
  'href: fallback?.href || row.href',
  'icon: fallback?.icon || row.icon',
])
requireText('app/api/revenue-command-os/canonical-operations/route.ts', [
  "type ImportKind = 'mandates' | 'commands' | 'doctrines' | 'gemini-resources'",
  "if (action === 'validate')",
  "if (action === 'import')",
  "if (action === 'run')",
  'runGeminiStrategyAssembly',
  'simulateRevenueCommandSituation',
  "action: 'doctrine.evaluated'",
])
requireText('app/(protected)/revenue-command-os/_components/action-center/RevenueActionCenter.tsx', [
  'data-revenue-action-center="v1"',
  'window.localStorage',
  "url.includes('/api/revenue-command-os/')",
])
requireText('app/(protected)/revenue-command-os/_components/imports/CanonicalCsvImportDock.tsx', [
  'Importer et lancer les mandats',
  'Importer et tester les commandes',
  'Importer et évaluer les doctrines',
  'Importer et exécuter les ressources Gemini',
  'createPortal(drawer, document.body)',
])
requireText('lib/revenue-command-os/operating-spine/read-model.ts', [
  'function executiveText(value: unknown)',
  'normalizedWarnings',
])

const protectedStable = [
  'app/(protected)/revenue-command-os/_components/drawer-sovereignty/DrawerPrimitives.tsx',
  'app/(protected)/revenue-command-os/signals/_components/SignalDrawer.tsx',
  'app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinEntityDrawer.tsx',
  'app/(protected)/revenue-command-os/memory-learning/_components/DoctrineDrawer.tsx',
  'app/(protected)/revenue-command-os/_components/approvals/ApprovalCenterWorkspace.tsx',
  'app/(protected)/revenue-command-os/_components/ObjectiveComposer.tsx',
]
for (const relative of protectedStable) {
  if (!exists(relative)) failures.push(`stable-workspace-missing:${relative}`)
  else pass.push(`stable-workspace-present:${relative}`)
}

const oldGenericRoutes = Object.keys(canonicalPages).filter((relative) => exists(relative) && read(relative).includes('focus="'))
for (const relative of oldGenericRoutes) failures.push(`${relative}:old-generic-focus-remains`)

const result = {
  contract: 'AC-RCOS-CANONICAL-WORKSPACE-FINAL-CLOSURE-2026.07',
  passed: pass.length,
  failed: failures.length,
  failures,
  canonicalPages: Object.keys(canonicalPages).length,
  importKinds: 4,
  protectedStableComponents: protectedStable.length,
  genericSubstitutions: oldGenericRoutes.length,
}
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exit(1)
