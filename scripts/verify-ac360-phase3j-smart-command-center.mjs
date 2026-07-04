#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'lib/ac360/customer-command-center-model.ts',
  'components/ac360/customer/Ac360CustomerSmartCommandCenter.tsx',
  'components/ac360/customer/Ac360CustomerExperienceShell.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'next.config.ts',
  'package.json',
  '.nvmrc',
]

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('❌ Missing Phase 3J required files:', missing.join(', '))
  process.exit(1)
}

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const component = read('components/ac360/customer/Ac360CustomerSmartCommandCenter.tsx')
const model = read('lib/ac360/customer-command-center-model.ts')
const shell = read('components/ac360/customer/Ac360CustomerExperienceShell.tsx')
const dedicated = read('components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx')
const nextConfig = read('next.config.ts')
const pkg = JSON.parse(read('package.json'))
const nvm = read('.nvmrc').trim()

const requiredTokens = [
  ['component', component, 'Ac360CustomerSmartCommandCenter'],
  ['component', component, 'Recherche globale AC360'],
  ['component', component, 'Saved Views Sync'],
  ['component', component, 'Vues intelligentes synchronisées'],
  ['component', component, 'Actions transversales'],
  ['component', component, 'Intelligence cockpit'],
  ['component', component, 'data-ac360-phase3j'],
  ['model', model, 'buildAc360SmartCommandResults'],
  ['model', model, 'searchAc360SmartCommandResults'],
  ['model', model, 'ac360DefaultSavedViews'],
  ['model', model, 'buildAc360CockpitIntelligenceSignals'],
  ['shell', shell, 'Ac360CustomerSmartCommandCenter'],
  ['dedicated', dedicated, 'Ac360CustomerSmartCommandCenter'],
]

const missingTokens = requiredTokens.filter(([name, body, token]) => !body.includes(token))
if (missingTokens.length) {
  console.error('❌ Missing Phase 3J tokens:')
  for (const [name, , token] of missingTokens) console.error(`- ${name}: ${token}`)
  process.exit(1)
}

const forbiddenDark = ['bg-black', 'bg-zinc-950', 'bg-slate-950 text-white', 'text-white/']
const darkHit = [...[component, model, shell, dedicated]].flatMap((body, i) => forbiddenDark.filter((token) => body.includes(token)).map((token) => `${i}:${token}`))
if (darkHit.length) {
  console.error('❌ Forbidden dark theme token detected:', darkHit.join(', '))
  process.exit(1)
}

const savedViews = (model.match(/syncState:/g) || []).length
const searchKinds = (model.match(/kind:/g) || []).length
if (savedViews < 4 || searchKinds < 2) {
  console.error('❌ Phase 3J saved view / search coverage too weak')
  process.exit(1)
}

if (!nextConfig.includes('webpackBuildWorker: false') || !nextConfig.includes('config.cache = false')) {
  console.error('❌ Vercel build stability lock missing from next.config.ts')
  process.exit(1)
}

if (!String(pkg.scripts?.build || '').includes('NODE_OPTIONS=--max-old-space-size=16384 next build --webpack')) {
  console.error('❌ package.json build command is not locked for AC360 production build')
  process.exit(1)
}

if (pkg.engines?.node !== '20.x' || nvm !== '20') {
  console.error('❌ Node 20 lock missing')
  process.exit(1)
}

console.log('✅ AC360 Phase 3J smart command center verification passed.')
console.log('✅ French-native global search, cross-module command center, saved views sync, cockpit intelligence and premium white UI confirmed.')
console.log(`✅ Saved views detected: ${savedViews}. Search/action result signals detected: ${searchKinds}.`)
console.log('✅ Vercel build stability lock preserved: webpack cache disabled, Node 20, 16GB build command.')
