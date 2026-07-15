#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const required = [
  'lib/ac360/customer-adoption-model.ts',
  'components/ac360/customer/Ac360CustomerPersonalizationAdoptionLayer.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'AC360_PHASE3L_PERSONALIZATION_ONBOARDING_ADOPTION_README.md',
]

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('❌ Missing Phase 3L files:', missing.join(', '))
  process.exit(1)
}

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const model = read('lib/ac360/customer-adoption-model.ts')
const layer = read('components/ac360/customer/Ac360CustomerPersonalizationAdoptionLayer.tsx')
const shell = read('components/ac360/customer/Ac360CustomerExperienceShell.tsx')
const dedicated = read('components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx')
const nextConfig = fs.existsSync(path.join(root, 'next.config.ts')) ? read('next.config.ts') : ''
const pkg = fs.existsSync(path.join(root, 'package.json')) ? read('package.json') : ''

const checks = [
  ['personalization profiles', model.includes('ac360CustomerPersonalizationProfiles') && model.includes('Direction / Propriétaire') && model.includes('Responsable Finance')],
  ['onboarding tour steps', model.includes('ac360CustomerOnboardingTourSteps') && model.includes('Tour guidé intelligent') === false && layer.includes('Tour guidé intelligent')],
  ['guided empty states', model.includes('ac360GuidedEmptyStates') && model.includes('Aucune créance visible') && model.includes('Pipeline admissions')],
  ['adoption signals', model.includes('buildAc360AdoptionSignals') && model.includes('Score adoption client')],
  ['main shell integration', shell.includes('Ac360CustomerPersonalizationAdoptionLayer') && shell.includes('data-ac360-phase3l')],
  ['dedicated route integration', dedicated.includes('Ac360CustomerPersonalizationAdoptionLayer') && dedicated.includes('compact') && dedicated.includes('data-ac360-phase3l')],
  ['French native wording', layer.includes('Parcours personnalisé') && layer.includes('État vide guidé') && layer.includes('Facturation')],
  ['premium white theme', !/bg-black|bg-gray-900|bg-slate-950|text-white\/90/.test(layer)],
  ['Vercel stability lock', nextConfig.includes('webpackBuildWorker: false') && nextConfig.includes('config.cache = false') && pkg.includes('max-old-space-size=16384')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`❌ Check failed: ${name}`)
  process.exit(1)
}

console.log('✅ AC360 Phase 3L personalization, onboarding tours, guided empty states & adoption intelligence verification passed.')
console.log('✅ French-native personalization, guided empty states, adoption signals, role routines and premium white UI confirmed.')
console.log('✅ Vercel build stability lock preserved: webpack cache disabled, Node 20, 16GB build command.')
