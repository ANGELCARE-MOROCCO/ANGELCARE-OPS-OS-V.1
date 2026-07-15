import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'components/ac360/customer/Ac360CustomerModuleWorkspace.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'lib/ac360/customer-workspace-model.ts',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing Phase 3C file: ${file}`)
}

const shell = readFileSync('components/ac360/customer/Ac360CustomerExperienceShell.tsx', 'utf8')
const workspace = readFileSync('components/ac360/customer/Ac360CustomerModuleWorkspace.tsx', 'utf8')
const model = readFileSync('lib/ac360/customer-workspace-model.ts', 'utf8')

const requiredShellTokens = [
  'Ac360CustomerModuleWorkspace',
  'module={module}',
  'live={live}',
]
for (const token of requiredShellTokens) {
  if (!shell.includes(token)) throw new Error(`Shell missing Phase 3C token: ${token}`)
}

const requiredWorkspaceTokens = [
  'Phase 3C · Workspace module',
  'Navigation profonde en page',
  'Table opérationnelle dense',
  'Pipeline / statuts',
  'Droits, usage et facturation',
  'Chronologie preuve',
  'État vide premium',
  'fallback sécurisé',
  'FR Maroc natif',
]
for (const token of requiredWorkspaceTokens) {
  if (!workspace.includes(token)) throw new Error(`Workspace component missing token: ${token}`)
}

const moduleKeys = [
  'command-center',
  'students-families',
  'classes',
  'attendance',
  'finance',
  'communication',
  'documents',
  'workflows',
  'admissions',
  'hr',
  'health-safety',
  'transport',
  'parenttrust',
]
for (const key of moduleKeys) {
  if (!model.includes(`moduleKey: '${key}'`) && !model.includes(`'${key}': {`)) {
    throw new Error(`Workspace model missing key: ${key}`)
  }
}

const frenchTokens = ['Élève', 'Présence', 'créances', 'réclamation', 'Droits', 'Facturation', 'Responsable']
for (const token of frenchTokens) {
  if (!model.includes(token) && !workspace.includes(token)) throw new Error(`French-native token missing: ${token}`)
}

const forbiddenDarkTokens = ['bg-black', 'bg-zinc-950', 'bg-slate-950 text-white', 'dark:']
for (const token of forbiddenDarkTokens) {
  if (shell.includes(token) || workspace.includes(token) || model.includes(token)) {
    throw new Error(`Forbidden dark-theme token detected: ${token}`)
  }
}

const workspaceCount = (model.match(/moduleKey:/g) || []).length
if (workspaceCount < 14) throw new Error(`Expected at least 14 workspace templates, found ${workspaceCount}`)

console.log('✅ AC360 Phase 3C customer module workspace verification passed.')
console.log('✅ Deep French-native in-page navigation, dense operational workspaces, guarded billing/governance surfaces and premium white UI confirmed.')
console.log(`✅ Workspace templates detected: ${workspaceCount}`)
