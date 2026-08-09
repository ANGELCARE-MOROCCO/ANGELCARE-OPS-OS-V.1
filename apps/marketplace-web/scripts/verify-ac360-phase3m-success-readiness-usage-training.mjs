#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const required = [
  'lib/ac360/customer-success-readiness-model.ts',
  'components/ac360/customer/Ac360CustomerSuccessReadinessLayer.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'AC360_PHASE3M_SUCCESS_READINESS_USAGE_TRAINING_README.md',
]

const missing = required.filter((file) => !existsSync(file))
if (missing.length) {
  console.error('❌ Missing Phase 3M files:', missing.join(', '))
  process.exit(1)
}

const model = readFileSync('lib/ac360/customer-success-readiness-model.ts', 'utf8')
const component = readFileSync('components/ac360/customer/Ac360CustomerSuccessReadinessLayer.tsx', 'utf8')
const shell = readFileSync('components/ac360/customer/Ac360CustomerExperienceShell.tsx', 'utf8')
const dedicated = readFileSync('components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx', 'utf8')
const nextConfig = existsSync('next.config.ts') ? readFileSync('next.config.ts', 'utf8') : ''
const pkg = existsSync('package.json') ? readFileSync('package.json', 'utf8') : ''
const nvmrc = existsSync('.nvmrc') ? readFileSync('.nvmrc', 'utf8') : ''

const checks = [
  ['readiness profile model', model.includes('getAc360CustomerReadinessProfile')],
  ['usage analytics', model.includes('usageAnalytics') && component.includes('Usage') || component.includes('usage')],
  ['training mode', model.includes('trainingMode') && component.includes('Mode formation client')],
  ['adoption reporting', component.includes('Rapport adoption') && component.includes('Score adoption')],
  ['friction recovery', component.includes('Friction & recovery') || component.includes('Friction')],
  ['governance proof', component.includes('Preuves gouvernance')],
  ['shell integration', shell.includes('Ac360CustomerSuccessReadinessLayer') && shell.includes('data-ac360-phase3m')],
  ['dedicated integration', dedicated.includes('Ac360CustomerSuccessReadinessLayer') && dedicated.includes('data-ac360-phase3m')],
  ['French native', component.includes('Formation guidée') && component.includes('Actions recommandées Success')],
  ['white theme', !/bg-(black|gray-9|slate-9|neutral-9)|text-white\/90/.test(component)],
  ['vercel build lock', nextConfig.includes('webpackBuildWorker: false') && nextConfig.includes('config.cache = false')],
  ['node 20 lock', pkg.includes('"node": "20.x"') && nvmrc.trim() === '20'],
  ['16gb build command', pkg.includes('NODE_OPTIONS=--max-old-space-size=16384 next build --webpack')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  console.error('❌ Phase 3M verification failed:')
  for (const [label] of failed) console.error(`- ${label}`)
  process.exit(1)
}

console.log('✅ AC360 Phase 3M success readiness, usage analytics, training mode & adoption reporting verification passed.')
console.log('✅ French-native customer success readiness, guided training, adoption reporting, governance proof and premium white UI confirmed.')
console.log('✅ Vercel build stability lock preserved: webpack cache disabled, Node 20, 16GB build command.')
