#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const requiredFiles = [
  'lib/ac360/customer-table-hardening-model.ts',
  'components/ac360/customer/Ac360CustomerOutcomeDrawer.tsx',
  'components/ac360/customer/Ac360CustomerOperationalTableHardening.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
]

let ok = true
for (const file of requiredFiles) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) {
    console.error(`❌ Missing required file: ${file}`)
    ok = false
  } else {
    console.log(`✅ Found ${file}`)
  }
}

const table = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerOperationalTableHardening.tsx'), 'utf8')
const drawer = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerOutcomeDrawer.tsx'), 'utf8')
const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-table-hardening-model.ts'), 'utf8')
const screen = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx'), 'utf8')

const requiredSignals = [
  ['table bulk selection', table, 'Actions groupées'],
  ['saved views', table, 'Vues sauvegardées'],
  ['smart filters', table, 'Filtres intelligents'],
  ['density modes', table, 'Densité d’affichage'],
  ['outcome drawer mounted', table, 'Ac360CustomerOutcomeDrawer'],
  ['outcome drawer proof', drawer, 'Référence preuve'],
  ['billing impact drawer', drawer, 'Impact facturation / usage'],
  ['audit timeline drawer', drawer, 'Timeline audit'],
  ['model finance hardening', model, 'Créances > 7 jours'],
  ['model admissions hardening', model, 'Leads chauds'],
  ['model parenttrust hardening', model, 'Réclamations critiques'],
  ['screen Phase 3F marker', screen, 'data-ac360-phase3f'],
  ['screen replacement', screen, 'Ac360CustomerOperationalTableHardening'],
]

for (const [label, haystack, needle] of requiredSignals) {
  if (!haystack.includes(needle)) {
    console.error(`❌ Missing ${label}: ${needle}`)
    ok = false
  } else {
    console.log(`✅ ${label}`)
  }
}

const forbiddenDarkTokens = ['bg-slate-950', 'bg-gray-950', 'bg-zinc-950', 'bg-black', 'text-white/']
for (const file of requiredFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8')
  for (const token of forbiddenDarkTokens) {
    if (text.includes(token)) {
      console.error(`❌ Forbidden dark token ${token} in ${file}`)
      ok = false
    }
  }
}
console.log('✅ White theme enforcement checked for Phase 3F files')

const bulkActionCount = (model.match(/key: 'bulk\./g) || []).length
const savedViewSignal = (table.match(/activeView/g) || []).length
if (bulkActionCount < 4) {
  console.error(`❌ Expected at least 4 bulk actions, found ${bulkActionCount}`)
  ok = false
} else {
  console.log(`✅ Bulk actions detected: ${bulkActionCount}`)
}
if (savedViewSignal < 3) {
  console.error('❌ Saved view state appears incomplete')
  ok = false
} else {
  console.log('✅ Saved view state and UI detected')
}

if (!ok) process.exit(1)
console.log('✅ AC360 Phase 3F outcome drawers, bulk selection, saved views & table hardening verification passed.')
