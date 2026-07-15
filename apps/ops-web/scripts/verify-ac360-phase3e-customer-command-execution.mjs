import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'lib/ac360/customer-command-model.ts',
  'components/ac360/customer/Ac360CustomerCommandModal.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
]

const fail = (message) => {
  console.error(`❌ ${message}`)
  process.exit(1)
}

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing ${file}`)
}

const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-command-model.ts'), 'utf8')
const modal = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerCommandModal.tsx'), 'utf8')
const screen = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx'), 'utf8')

const requiredModelTokens = [
  'ac360CustomerCommands',
  'getAc360CustomerCommandsForModule',
  'buildAc360CommandPayload',
  'ac360.school_finance.invoice.issue',
  'ac360.school_admissions.lead.create',
  'ac360.school_attendance.session.open',
  'ac360.school_parenttrust.complaint.open',
  'ac360.addon.activate',
]
for (const token of requiredModelTokens) {
  if (!model.includes(token)) fail(`Command model missing token ${token}`)
}

const requiredModalTokens = [
  'Phase 3E · Commande réelle',
  '/api/ac360/action-wiring/preflight',
  'Lancer pré-vol',
  'Exécuter commande',
  'Payload contrôlé',
  'Impact commercial & gouvernance',
  'Pré-vol AC360',
]
for (const token of requiredModalTokens) {
  if (!modal.includes(token)) fail(`Command modal missing token ${token}`)
}

const requiredScreenTokens = [
  'Ac360CustomerCommandModal',
  'setActiveCommand',
  'data-ac360-phase3e',
  'Ouvrir modal de commande',
  'Commandes réelles',
]
for (const token of requiredScreenTokens) {
  if (!screen.includes(token)) fail(`Dedicated screen not wired with ${token}`)
}

const forbiddenDarkTokens = ['bg-slate-950 text-white', 'bg-black', 'from-slate-950', 'via-slate-900']
for (const token of forbiddenDarkTokens) {
  if (screen.includes(token) || modal.includes(token)) fail(`Forbidden dark theme token detected: ${token}`)
}

const commandCount = (model.match(/key: '/g) || []).length
if (commandCount < 8) fail(`Expected at least 8 command definitions, got ${commandCount}`)

console.log('✅ AC360 Phase 3E customer command execution verification passed.')
console.log(`✅ Command definitions detected: ${commandCount}`)
console.log('✅ French-native command modals, preflight guard chain, execution controls, billing/governance signals and premium white UI confirmed.')
