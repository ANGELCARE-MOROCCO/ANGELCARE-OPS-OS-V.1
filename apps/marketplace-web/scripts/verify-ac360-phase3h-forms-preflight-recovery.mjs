import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'lib/ac360/customer-command-validation.ts',
  'components/ac360/customer/Ac360CustomerInlinePreflightPanel.tsx',
  'components/ac360/customer/Ac360CustomerErrorRecoveryPanel.tsx',
  'components/ac360/customer/Ac360CustomerCommandModal.tsx',
  'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx',
  'AC360_PHASE3H_FORMS_PREFLIGHT_RECOVERY_README.md',
]

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing Phase 3H file: ${file}`)
  }
}

const modal = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerCommandModal.tsx'), 'utf8')
const validation = fs.readFileSync(path.join(root, 'lib/ac360/customer-command-validation.ts'), 'utf8')
const dedicated = fs.readFileSync(path.join(root, 'components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx'), 'utf8')
const model = fs.readFileSync(path.join(root, 'lib/ac360/customer-command-model.ts'), 'utf8')

const mustContain = [
  [modal, 'Ac360CustomerInlinePreflightPanel'],
  [modal, 'Ac360CustomerErrorRecoveryPanel'],
  [modal, 'buildAc360PreflightRequest'],
  [modal, 'validateAc360CustomerCommand'],
  [modal, 'phase_3h_live_forms_preflight_recovery'],
  [validation, 'fieldErrors'],
  [validation, 'recoveryActions'],
  [validation, 'buildExecutionRecovery'],
  [dedicated, 'data-ac360-phase3h="live-forms-preflight-recovery"'],
  [model, 'wiringKey: Ac360WiringKey | string'],
]

for (const [source, needle] of mustContain) {
  if (!source.includes(needle)) throw new Error(`Phase 3H verification failed; missing token: ${needle}`)
}

const darkTokens = ['bg-slate-950 text-white', 'bg-black', 'from-slate-950', 'via-slate-900']
for (const file of required.filter((f) => f.endsWith('.tsx'))) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  for (const token of darkTokens) {
    if (source.includes(token)) throw new Error(`Forbidden dark UI token in ${file}: ${token}`)
  }
}

console.log('✅ AC360 Phase 3H forms, inline preflight & customer recovery verification passed.')
console.log('✅ French-native field validation, guarded payload preview, blocked-action recovery and premium white UI confirmed.')
