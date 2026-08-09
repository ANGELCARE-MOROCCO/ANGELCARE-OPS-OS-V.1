#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const requiredFiles = [
  'lib/ac360/customer-live-records-model.ts',
  'components/ac360/customer/Ac360CustomerLiveRecordsTable.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'lib/ac360/customer-command-model.ts',
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

const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-live-records-model.ts'), 'utf8')
const table = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerLiveRecordsTable.tsx'), 'utf8')
const screen = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx'), 'utf8')

const checks = [
  ['phase marker', table, 'data-ac360-phase3g="live-records-real-tables"'],
  ['live normalizer', model, 'normalizeAc360CustomerLiveRecords'],
  ['module action forms', model, 'Ac360CustomerModuleActionForm'],
  ['form preview', model, 'buildAc360CustomerFormPreview'],
  ['finance deep form', model, 'Formulaire métier · facture gouvernée'],
  ['admissions deep form', model, 'Formulaire métier · lead admissions'],
  ['attendance deep form', model, 'Formulaire métier · événement présence'],
  ['students deep form', model, 'Formulaire métier · dossier Élève 360'],
  ['parenttrust deep form', model, 'Formulaire métier · réclamation ParentTrust'],
  ['growth menu deep form', model, 'Formulaire métier · activation add-on'],
  ['real fetch route endpoint', table, 'fetch(route.endpoint'],
  ['records table mounted', screen, 'Ac360CustomerLiveRecordsTable'],
  ['French live records label', table, 'Données live'],
  ['fallback sécurisé', table, 'fallback sécurisé'],
  ['payload preview', table, 'Aperçu payload gardé'],
]

for (const [label, haystack, needle] of checks) {
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
console.log('✅ White theme enforcement checked for Phase 3G files')

const formCount = (model.match(/Formulaire métier ·/g) || []).length
const endpointCount = (model.match(/endpointHint:/g) || []).length
if (formCount < 6) {
  console.error(`❌ Expected at least 6 module-specific forms, found ${formCount}`)
  ok = false
} else {
  console.log(`✅ Module-specific forms detected: ${formCount}`)
}
if (endpointCount < 6) {
  console.error(`❌ Expected endpoint hints for module forms, found ${endpointCount}`)
  ok = false
} else {
  console.log(`✅ Endpoint hints detected: ${endpointCount}`)
}

if (!ok) process.exit(1)
console.log('✅ AC360 Phase 3G advanced live records, module-specific action forms & real data tables verification passed.')
