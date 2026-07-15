import fs from 'fs'
import path from 'path'

const root = process.cwd()
const required = [
  'lib/ac360/customer-record-intelligence.ts',
  'components/ac360/customer/Ac360CustomerRecordIntelligenceDrawer.tsx',
  'components/ac360/customer/Ac360CustomerLiveRecordsTable.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'AC360_PHASE3I_RECORD_TIMELINES_CONTEXTUAL_ACTIONS_README.md',
]

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)))
if (missing.length) {
  console.error('❌ Missing Phase 3I files:', missing.join(', '))
  process.exit(1)
}

const drawer = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerRecordIntelligenceDrawer.tsx'), 'utf8')
const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-record-intelligence.ts'), 'utf8')
const table = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerLiveRecordsTable.tsx'), 'utf8')
const screen = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx'), 'utf8')

const checks = [
  ['record intelligence drawer marker', drawer.includes('data-ac360-phase3i="record-intelligence-drawer"')],
  ['timeline model', model.includes('timeline') && model.includes('buildAc360CustomerRecordIntelligence')],
  ['contextual actions', model.includes('Ac360RecordContextualAction') && drawer.includes('Actions contextuelles intelligentes')],
  ['billing impact', drawer.includes('Facturation & usage') && model.includes('billingImpact')],
  ['governance signals', drawer.includes('Gouvernance') && model.includes('auditSignals')],
  ['live table integration', table.includes('Ac360CustomerRecordIntelligenceDrawer')],
  ['dedicated screen phase marker', screen.includes('data-ac360-phase3i="record-detail-intelligence"')],
]

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) {
  console.error('❌ Phase 3I verification failed:', failed.join(', '))
  process.exit(1)
}

for (const file of required.filter((item) => item.endsWith('.tsx') || item.endsWith('.ts'))) {
  const content = fs.readFileSync(path.join(root, file), 'utf8')
  if (/bg-(black|gray-9|slate-9|zinc-9)|text-white\/80|from-black|to-black/.test(content)) {
    console.error(`❌ Forbidden dark-theme token detected in ${file}`)
    process.exit(1)
  }
}

console.log('✅ AC360 Phase 3I record timelines & contextual action intelligence verification passed.')
console.log('✅ French-native record detail drawers, timelines, contextual actions, billing/governance and premium white UI confirmed.')
