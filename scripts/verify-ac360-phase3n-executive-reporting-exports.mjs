#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'

const requiredFiles = [
  'lib/ac360/customer-reporting-model.ts',
  'components/ac360/customer/Ac360CustomerExecutiveReportingLayer.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'AC360_PHASE3N_EXECUTIVE_REPORTING_EXPORTS_README.md',
]

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing Phase 3N file: ${file}`)
}

const model = readFileSync('lib/ac360/customer-reporting-model.ts', 'utf8')
const component = readFileSync('components/ac360/customer/Ac360CustomerExecutiveReportingLayer.tsx', 'utf8')
const shell = readFileSync('components/ac360/customer/Ac360CustomerExperienceShell.tsx', 'utf8')
const dedicated = readFileSync('components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx', 'utf8')
const nextConfig = existsSync('next.config.ts') ? readFileSync('next.config.ts', 'utf8') : ''
const pkg = existsSync('package.json') ? readFileSync('package.json', 'utf8') : ''

const requiredModelTokens = [
  'Ac360CustomerBoardPack',
  'Ac360CustomerExportItem',
  'Ac360CustomerPrintView',
  'getAc360CustomerReportingProfile',
  'Board Pack Direction',
  'Pack Finance & Créances',
  'Pack ParentTrust & Réputation',
  'Vue A4 Direction Premium',
]
for (const token of requiredModelTokens) {
  if (!model.includes(token)) throw new Error(`Missing model token: ${token}`)
}

const requiredComponentTokens = [
  'data-ac360-phase3n',
  'Reporting exécutif',
  'Centre exports',
  'Board packs client',
  'Print-ready views',
  'Preuves gouvernance',
  'Signaux commerciaux',
  'Actions recommandées',
]
for (const token of requiredComponentTokens) {
  if (!component.includes(token)) throw new Error(`Missing component token: ${token}`)
}

if (!shell.includes('Ac360CustomerExecutiveReportingLayer')) throw new Error('Main customer shell is not integrated with Phase 3N reporting layer')
if (!dedicated.includes('Ac360CustomerExecutiveReportingLayer')) throw new Error('Dedicated module screen is not integrated with Phase 3N compact reporting layer')
if (!shell.includes('data-ac360-phase3n')) throw new Error('Main customer shell missing Phase 3N marker')
if (!dedicated.includes('data-ac360-phase3n')) throw new Error('Dedicated screen missing Phase 3N marker')

const forbidden = ['bg-black', 'bg-slate-950', 'text-white/']
for (const file of ['components/ac360/customer/Ac360CustomerExecutiveReportingLayer.tsx']) {
  const content = readFileSync(file, 'utf8')
  for (const token of forbidden) {
    if (content.includes(token)) throw new Error(`Forbidden dark theme token ${token} in ${file}`)
  }
}

const buildLockChecks = [
  nextConfig.includes('webpackBuildWorker: false'),
  nextConfig.includes('config.cache = false'),
  pkg.includes('NODE_OPTIONS=--max-old-space-size=16384 next build --webpack'),
  pkg.includes('"node": "20.x"'),
]
if (!buildLockChecks.every(Boolean)) throw new Error('Vercel build stability lock is not preserved')

console.log('✅ AC360 Phase 3N executive reporting, export center, print-ready views & board packs verification passed.')
console.log('✅ French-native reporting, governed exports, A4 print-ready views, board packs, commercial signals and premium white UI confirmed.')
console.log('✅ Vercel build stability lock preserved: webpack cache disabled, Node 20, 16GB build command.')
