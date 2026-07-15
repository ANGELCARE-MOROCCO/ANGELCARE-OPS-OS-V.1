#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'lib/ac360/customer-role-portal-model.ts',
  'components/ac360/customer/Ac360CustomerRolePortal.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'next.config.ts',
  'package.json',
  '.nvmrc',
]

const missing = requiredFiles.filter((file) => !existsSync(file))
if (missing.length) {
  console.error('❌ Missing Phase 3K files:', missing.join(', '))
  process.exit(1)
}

const read = (file) => readFileSync(file, 'utf8')
const roleModel = read('lib/ac360/customer-role-portal-model.ts')
const roleComponent = read('components/ac360/customer/Ac360CustomerRolePortal.tsx')
const shell = read('components/ac360/customer/Ac360CustomerExperienceShell.tsx')
const dedicated = read('components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx')
const nextConfig = read('next.config.ts')
const pkg = read('package.json')
const nvmrc = read('.nvmrc')

const requiredModelTokens = [
  'Ac360CustomerPortalRoleKey',
  'ac360CustomerRolePortals',
  'getAc360RoleModulePermission',
  'getAc360RoleVisibleModules',
  'getAc360RoleMobileActions',
  'Propriétaire / Direction',
  'Responsable Finance',
  'Responsable Admissions',
  'Éducatrice / Enseignant',
  'AngelCare Success',
]

const requiredUiTokens = [
  'data-ac360-phase3k',
  'Portail rôle',
  'Navigation permission-aware',
  'Vue mobile exécution',
  'Ac360CustomerMobileExecutionDock',
  'Facturation',
  'gouvernance',
  'FR Maroc natif',
]

const missingModelTokens = requiredModelTokens.filter((token) => !roleModel.includes(token))
const missingUiTokens = requiredUiTokens.filter((token) => !(roleComponent + shell + dedicated).includes(token))
if (missingModelTokens.length || missingUiTokens.length) {
  console.error('❌ Phase 3K verification failed.')
  if (missingModelTokens.length) console.error('Missing model tokens:', missingModelTokens.join(', '))
  if (missingUiTokens.length) console.error('Missing UI tokens:', missingUiTokens.join(', '))
  process.exit(1)
}

const forbiddenDarkTokens = ['bg-slate-950', 'bg-black', 'from-slate-950', 'via-slate-900', 'text-white/']
const phase3kFiles = [roleComponent, shell, dedicated]
const darkHits = forbiddenDarkTokens.flatMap((token) => phase3kFiles.some((file) => file.includes(token)) ? [token] : [])
if (darkHits.length) {
  console.error('❌ Forbidden dark theme tokens found in Phase 3K files:', darkHits.join(', '))
  process.exit(1)
}

const roleCount = (roleModel.match(/key: '(direction|finance|admissions|teacher|success)'/g) || []).length
const mobileCount = (roleModel.match(/guardSignal:/g) || []).length
const permissionCount = (roleModel.match(/permissionRules:/g) || []).length
if (roleCount < 5 || mobileCount < 12 || permissionCount < 5) {
  console.error('❌ Role portal coverage is not deep enough.', { roleCount, mobileCount, permissionCount })
  process.exit(1)
}

if (!nextConfig.includes('webpackBuildWorker: false') || !nextConfig.includes('config.cache = false')) {
  console.error('❌ Vercel build stability lock missing from next.config.ts')
  process.exit(1)
}
if (!pkg.includes('NODE_OPTIONS=--max-old-space-size=16384 next build --webpack') || !pkg.includes('"node": "20.x"') || nvmrc.trim() !== '20') {
  console.error('❌ Node/Vercel build memory lock missing from package.json or .nvmrc')
  process.exit(1)
}

console.log('✅ AC360 Phase 3K role-based portals, permission-aware navigation & mobile execution verification passed.')
console.log('✅ French-native role portals, permission-aware module visibility, mobile execution dock, governance/billing signals and premium white UI confirmed.')
console.log('✅ Vercel build stability lock preserved: webpack cache disabled, Node 20, 16GB build command.')
