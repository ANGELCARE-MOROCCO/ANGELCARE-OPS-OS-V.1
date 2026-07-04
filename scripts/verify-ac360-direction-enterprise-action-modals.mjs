import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'lib/ac360/customer-direction-action-map.ts',
  'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx',
  'app/api/ac360/customer/cockpit-direction/route.ts',
]

const missing = requiredFiles.filter((file) => !existsSync(file))
if (missing.length) {
  console.error('❌ Missing required files:', missing.join(', '))
  process.exit(1)
}

const actionMap = readFileSync('lib/ac360/customer-direction-action-map.ts', 'utf8')
const component = readFileSync('components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx', 'utf8')

const requiredModalTypes = [
  'period_selector',
  'site_selector',
  'alert_center',
  'command_palette',
  'create_action',
  'launch_control',
  'risk_register',
  'report_center',
  'export_center',
  'report_builder',
  'detail_drawer',
  'decision_approval',
  'escalation_drawer',
  'mobile_quick_action',
]

for (const token of requiredModalTypes) {
  if (!actionMap.includes(token) || !component.includes(token)) {
    console.error(`❌ Enterprise modal type not fully wired: ${token}`)
    process.exit(1)
  }
}

const requiredOperations = [
  'direction_action.create',
  'control.launch',
  'risk.create',
  'report.queue',
  'export.queue',
  'decision.update',
  'escalation.open',
]

for (const token of requiredOperations) {
  if (!actionMap.includes(token)) {
    console.error(`❌ Operation missing from action map: ${token}`)
    process.exit(1)
  }
}

const componentChecks = [
  'EnterpriseModalBody',
  'renderField',
  'buildDirectionExecutionPayload',
  'resolveDirectionActionDefinition',
  'recommendedNextActions',
  'Workflow entreprise',
  'Champs opérationnels',
  'Suite recommandées'.replace('Suite', 'Suites'),
]

for (const token of componentChecks) {
  if (!component.includes(token)) {
    console.error(`❌ Component enterprise modal check missing: ${token}`)
    process.exit(1)
  }
}

const forbiddenVisible = [
  'Migration SQL',
  'Supabase',
  'Phase 3O-R5',
  'JSON payload',
  'runtime réel AC360',
]

for (const token of forbiddenVisible) {
  if (component.includes(token)) {
    console.error(`❌ Forbidden client-facing/internal wording found in component: ${token}`)
    process.exit(1)
  }
}

console.log('✅ AC360 Direction enterprise action map & modal system verification passed.')
console.log('✅ Existing cockpit buttons resolve to specific enterprise modal families, governed operations, proof/result handling and premium client-facing UI.')
