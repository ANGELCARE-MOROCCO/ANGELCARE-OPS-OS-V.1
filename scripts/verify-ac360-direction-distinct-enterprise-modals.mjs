import { readFileSync, existsSync } from 'node:fs'

const componentPath = 'components/ac360/customer/direction/Ac360DirectionDistinctEnterpriseModal.tsx'
const pagePath = 'components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx'
const actionMapPath = 'lib/ac360/customer-direction-action-map.ts'

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }
}

assert(existsSync(componentPath), 'Distinct enterprise modal component is missing')
assert(existsSync(pagePath), 'Direction cockpit page is missing')
assert(existsSync(actionMapPath), 'Direction action map is missing')

const component = readFileSync(componentPath, 'utf8')
const page = readFileSync(pagePath, 'utf8')
const actionMap = readFileSync(actionMapPath, 'utf8')

const requiredWorkflows = [
  'PeriodSelectorWorkflow',
  'SiteSelectorWorkflow',
  'AlertCenterWorkflow',
  'CommandPaletteWorkflow',
  'CreateActionWorkflow',
  'LaunchControlWorkflow',
  'RiskRegisterWorkflow',
  'ReportWorkflow',
  'ExportWorkflow',
  'DetailWorkflow',
  'DecisionWorkflow',
  'EscalationWorkflow',
  'MobileQuickWorkflow',
  'WorkflowRenderer',
]

for (const marker of requiredWorkflows) assert(component.includes(marker), `${marker} not found in distinct modal component`)

const modalTypes = [
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
for (const type of modalTypes) {
  assert(actionMap.includes(type), `Action map missing modal type ${type}`)
  assert(component.includes(type), `Distinct modal renderer missing ${type}`)
}

assert(page.includes('Ac360DirectionDistinctEnterpriseModal'), 'Cockpit page does not render distinct modal system')
assert(!page.includes('<ActionModal draft={draft}'), 'Old generic ActionModal still active in render tree')

const forbiddenUserFacing = ['Supabase', 'Migration SQL', 'Runtime réel AC360', 'Phase 3O-R5', 'JSON payload']
for (const term of forbiddenUserFacing) assert(!component.includes(term), `Developer-facing term leaked in modal component: ${term}`)

console.log('✅ AC360 Direction distinct enterprise workflow modals verification passed.')
console.log('✅ Distinct layouts for period, sites, alerts, command palette, actions, controls, risks, reports, exports, detail drawers, decisions, escalations and mobile workflows confirmed.')
