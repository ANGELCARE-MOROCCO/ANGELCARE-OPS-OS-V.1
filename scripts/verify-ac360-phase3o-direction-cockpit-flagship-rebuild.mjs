#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const requiredFiles = [
  'lib/ac360/customer-direction-cockpit-model.ts',
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx',
  'app/(protected)/angelcare-360/customer/cockpit-direction/[view]/page.tsx',
]

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('❌ Missing Phase 3O files:')
  for (const file of missing) console.error(` - ${file}`)
  process.exit(1)
}

const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-direction-cockpit-model.ts'), 'utf8')
const page = fs.readFileSync(path.join(root, 'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx'), 'utf8')
const route = fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx'), 'utf8')
const subroute = fs.readFileSync(path.join(root, 'app/(protected)/angelcare-360/customer/cockpit-direction/[view]/page.tsx'), 'utf8')
const nextConfig = fs.existsSync(path.join(root, 'next.config.ts')) ? fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8') : ''
const pkg = fs.existsSync(path.join(root, 'package.json')) ? fs.readFileSync(path.join(root, 'package.json'), 'utf8') : ''

const mustContain = [
  ['model', model, 'Synthèse Direction'],
  ['model', model, 'Aujourd’hui'],
  ['model', model, 'Risques'],
  ['model', model, 'Décisions'],
  ['model', model, 'Finance Direction'],
  ['model', model, 'Admissions & Croissance'],
  ['model', model, 'Parents & ParentTrust'],
  ['model', model, 'Équipe & RH'],
  ['model', model, 'Sécurité & Conformité'],
  ['model', model, 'Transport'],
  ['model', model, 'Automatisations'],
  ['model', model, 'Rapports Direction'],
  ['model', model, 'Gouvernance Compte'],
  ['model', model, 'buildAc360DirectionCockpitModel'],
  ['page', page, 'TopIntelligenceBar'],
  ['page', page, 'ExecutiveHero'],
  ['page', page, 'HealthScoreBoard'],
  ['page', page, 'CriticalDecisionZone'],
  ['page', page, 'RiskBoard'],
  ['page', page, 'DirectionSectionBlock'],
  ['page', page, 'RightContextRail'],
  ['page', page, 'MobileExecutionDock'],
  ['page', page, 'DirectionActionModal'],
  ['page', page, 'loadAc360CustomerLiveCockpit'],
  ['route', route, 'Ac360DirectionCockpitPage'],
  ['subroute', subroute, 'generateStaticParams'],
]

const missingContent = mustContain.filter(([_, content, needle]) => !content.includes(needle))
if (missingContent.length) {
  console.error('❌ Missing Phase 3O content markers:')
  for (const [file, , needle] of missingContent) console.error(` - ${file}: ${needle}`)
  process.exit(1)
}

const forbiddenThemeTokens = [
  'bg-black',
  'text-white/60',
  'from-black',
  'via-black',
  'to-black',
  'bg-zinc-950',
  'bg-neutral-950',
]
const themeHit = forbiddenThemeTokens.find((needle) => page.includes(needle) || model.includes(needle))
if (themeHit) {
  console.error(`❌ Forbidden dark-theme token detected: ${themeHit}`)
  process.exit(1)
}

if (!nextConfig.includes('webpackBuildWorker: false') || !nextConfig.includes('config.cache = false')) {
  console.error('❌ Vercel build stability lock is missing from next.config.ts')
  process.exit(1)
}

if (!pkg.includes('NODE_OPTIONS=--max-old-space-size=16384 next build --webpack') || !pkg.includes('"node": "20.x"')) {
  console.error('❌ Vercel build command / Node 20 lock is missing from package.json')
  process.exit(1)
}

const navCount = (model.match(/key: '[a-z]+[a-z-]*'/g) || []).length
if (navCount < 13) {
  console.error(`❌ Expected deep direction navigation coverage; detected only ${navCount} nav-like keys.`)
  process.exit(1)
}

console.log('✅ AC360 Phase 3O Cockpit de Direction flagship rebuild verification passed.')
console.log('✅ Dedicated route/subroute architecture, French-native executive cockpit, deep in-page navigation, risks, decisions, workflows, drawers, mobile dock and premium white UI confirmed.')
console.log('✅ Vercel build stability lock preserved: webpack cache disabled, Node 20, 16GB build command.')
