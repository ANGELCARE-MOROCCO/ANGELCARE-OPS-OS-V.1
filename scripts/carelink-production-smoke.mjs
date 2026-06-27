import fs from 'fs'
import path from 'path'

const root = process.cwd()
const failures = []
const warnings = []

function full(file) {
  return path.join(root, file)
}

function exists(file) {
  return fs.existsSync(full(file))
}

function read(file) {
  if (!exists(file)) {
    failures.push(`missing file: ${file}`)
    return ''
  }
  return fs.readFileSync(full(file), 'utf8')
}

function listFiles(dir, matcher = () => true) {
  const start = full(dir)
  if (!fs.existsSync(start)) return []
  const out = []
  const stack = [start]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absolute)
      } else {
        const relative = path.relative(root, absolute).replaceAll(path.sep, '/')
        if (matcher(relative)) out.push(relative)
      }
    }
  }
  return out.sort()
}

function expectIncludes(file, needles, label = file) {
  const text = read(file)
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${label} missing ${needle}`)
  }
  return text
}

function expectNotIncludes(file, needles, label = file) {
  const text = read(file)
  for (const needle of needles) {
    if (text.includes(needle)) failures.push(`${label} still contains forbidden pattern: ${needle}`)
  }
  return text
}

const lockedUiFiles = [
  'app/carelink-ops/page.tsx',
  'app/carelink-ops/missions/page.tsx',
  'app/carelink-ops/dispatch/page.tsx',
  'app/carelink-ops/agents/page.tsx',
  'app/carelink/page.tsx',
  'app/carelink/login/page.tsx',
  'app/carelink/offline/page.tsx',
  'app/carelink/missions/page.tsx',
  'app/carelink/missions/[id]/page.tsx',
]

for (const file of lockedUiFiles) {
  if (!exists(file)) failures.push(`locked UI file missing: ${file}`)
}

const packageJson = JSON.parse(read('package.json') || '{}')
const scripts = packageJson.scripts || {}
for (const script of ['carelink:verify', 'carelink:production-smoke', 'carelink:deploy-gate']) {
  if (!scripts[script]) failures.push(`package.json missing script ${script}`)
}
if (scripts['carelink:deploy-gate'] && !scripts['carelink:deploy-gate'].includes('carelink:verify')) {
  failures.push('carelink:deploy-gate must include carelink:verify')
}
if (scripts['carelink:deploy-gate'] && !scripts['carelink:deploy-gate'].includes('carelink:production-smoke')) {
  failures.push('carelink:deploy-gate must include carelink:production-smoke')
}

const pMigrations = [
  'supabase/migrations/20260627_carelink_mobile_p0_access_idempotency.sql',
  'supabase/migrations/20260627_carelink_mobile_p1_action_engine.sql',
  'supabase/migrations/20260627_carelink_mobile_p2_audit_compliance.sql',
  'supabase/migrations/20260627_carelink_mobile_p3_escalation_readiness.sql',
  'supabase/migrations/20260627_carelink_mobile_p4_device_session_governance.sql',
  'supabase/migrations/20260627_carelink_mobile_p7_enterprise_dossier.sql',
  'supabase/migrations/20260627_carelink_mobile_p8_program_activities.sql',
  'supabase/migrations/20260627_carelink_mobile_p9_mission_brief_acknowledgement.sql',
  'supabase/migrations/20260627_carelink_mobile_p10_route_transport_execution.sql',
  'supabase/migrations/20260627_carelink_mobile_p11_dynamic_service_checklists.sql',
  'supabase/migrations/20260627_carelink_mobile_p12_report_correction_validation.sql',
  'supabase/migrations/20260627_carelink_mobile_p13_attendance_presence_proof.sql',
]
for (const file of pMigrations) {
  expectNotIncludes(file, ['create policy if not exists', 'CREATE POLICY IF NOT EXISTS'], file)
}
expectIncludes(pMigrations[0], ['carelink_mobile_action_requests', 'idempotency_key text not null unique'], 'P0 migration')
expectIncludes(pMigrations[1], ['last_mobile_action', 'last_mobile_action_at'], 'P1 migration')
expectIncludes(pMigrations[2], ['carelink_agent_activity_ledger', 'carelink_mission_timeline_audit', 'carelink_dispatch_sla_audit_snapshots'], 'P2 migration')
expectIncludes(pMigrations[3], ['carelink_operational_escalations', 'carelink_ops_action_queue'], 'P3 migration')
expectIncludes(pMigrations[4], ['carelink_mobile_device_sessions', 'carelink_mobile_security_events'], 'P4 migration')
expectIncludes(pMigrations[5], ['carelink_agent_profile_requests', 'carelink_agent_policy_acknowledgements', 'carelink_agent_availability_updates', 'carelink_agent_presence_events', 'carelink_agent_document_submissions'], 'P7 migration')
expectIncludes(pMigrations[6], ['carelink_mission_program_activity_logs', 'carelink_program_activity_unique'], 'P8 migration')
expectIncludes(pMigrations[7], ['carelink_mission_brief_acknowledgements', 'carelink_mission_brief_ack_unique'], 'P9 migration')
expectIncludes(pMigrations[8], ['carelink_mission_route_execution_logs', 'carelink_route_execution_mission_idx'], 'P10 migration')
expectIncludes(pMigrations[9], ['service_type text', 'service_family text', 'evidence_required boolean', 'carelink_mission_checklist_items_service_idx'], 'P11 migration')
expectIncludes(pMigrations[10], ['carelink_mission_report_corrections', 'correction_status text', 'carelink_report_corrections_mission_idx'], 'P12 migration')
expectIncludes(pMigrations[11], ['carelink_mission_presence_proofs', 'risk_flag text', 'carelink_presence_proofs_mission_idx'], 'P13 migration')

const carelinkMigrationFiles = listFiles('supabase/migrations', (file) => /carelink/i.test(file) && file.endsWith('.sql'))
for (const file of carelinkMigrationFiles) {
  const text = read(file)
  if (/create\s+policy\s+if\s+not\s+exists/i.test(text)) {
    failures.push(`${file} uses invalid PostgreSQL syntax: CREATE POLICY IF NOT EXISTS`)
  }
}

expectIncludes('lib/carelink/mobile-login-session.ts', [
  'loginCareLinkMobileAgent',
  'upsertCareLinkMobileAppUserFromAccess',
  'carelink_agent_app_access',
  'signInWithPassword',
  'APP_SESSION_COOKIE',
], 'P6 mobile login sync')

expectIncludes('app/carelink/login/page.tsx', [
  'loginCareLinkMobileAgent',
  'CareLink AngelCare OS',
  'WhatsApp Support',
], 'P6 mobile login page')

expectIncludes('app/api/carelink/ops/agents/[id]/mobile-access/route.ts', [
  'upsertCareLinkMobileAppUserFromAccess',
  'appUserWarning',
], 'P6 OPS agent mobile access sync')

expectIncludes('proxy.ts', [
  'isCareLinkMobileProtectedPath',
  'isCareLinkMobilePublicPath',
  'buildCareLinkMobileLoginRequiredResponse',
  '/carelink/login',
], 'P6 mobile route login perimeter')

expectIncludes('lib/carelink/mobile-auth.ts', [
  'requireCareLinkMobileAgent',
  'requireCareLinkMobileMissionAccess',
  'missionBelongsToCaregiver',
  'carelink_mission_not_assigned',
  'evaluateCareLinkMobileDeviceGovernance',
  'recordCareLinkMobileGuardPass',
  'deviceContext',
], 'mobile auth guard')

expectNotIncludes('lib/carelink/mobile-adapter.ts', ['fallbackRows', ': allRecords'], 'mobile adapter')
expectIncludes('lib/carelink/mobile-adapter.ts', ['requireCareLinkMobileAgent'], 'mobile adapter')

expectIncludes('lib/carelink/mobile-action-idempotency.ts', [
  'carelink_mobile_action_requests',
  'idempotency_key',
  'beginCareLinkMobileAction',
  'completeCareLinkMobileAction',
  'failCareLinkMobileAction',
], 'idempotency helper')

expectIncludes('lib/carelink/mobile-action-engine.ts', [
  'resolveIdempotencyKey',
  'beginCareLinkMobileAction',
  'completeCareLinkMobileAction',
  'failCareLinkMobileAction',
  'requireCareLinkMobileMissionAccess(missionId, config.capability, args.request)',
  'recordCareLinkAgentActivity',
  'recordCareLinkMissionTimelineAudit',
  'recordCareLinkDispatchSlaSnapshot',
  'createCareLinkOperationalEscalation',
  'carelink_mobile_transition_blocked',
], 'mobile action engine')

expectIncludes('lib/carelink/mobile-completion-gates.ts', [
  'evaluateCareLinkCompletionGates',
  'carelink_required_checklist_missing',
  'carelink_report_required_before_completion',
], 'completion gates')

expectIncludes('lib/carelink/mobile-device-governance.ts', [
  'evaluateCareLinkMobileDeviceGovernance',
  'resolveCareLinkMobileDeviceContext',
  'carelink_mobile_device_sessions',
  'carelink_mobile_security_events',
  'carelink_mobile_session_limit_exceeded',
], 'device/session governance')

const actionRoutes = {
  'app/api/carelink/missions/[id]/accept/route.ts': 'accept',
  'app/api/carelink/missions/[id]/decline/route.ts': 'decline',
  'app/api/carelink/missions/[id]/confirm-readiness/route.ts': 'confirm_readiness',
  'app/api/carelink/missions/[id]/en-route/route.ts': 'en_route',
  'app/api/carelink/missions/[id]/arrive/route.ts': 'arrive',
  'app/api/carelink/missions/[id]/arrived/route.ts': 'arrive',
  'app/api/carelink/missions/[id]/check-in/route.ts': 'check_in',
  'app/api/carelink/missions/[id]/start/route.ts': 'start',
  'app/api/carelink/missions/[id]/report/route.ts': 'report_submit',
  'app/api/carelink/missions/[id]/complete/route.ts': 'complete',
  'app/api/carelink/missions/[id]/delay/route.ts': 'delay_report',
  'app/api/carelink/missions/[id]/incident/route.ts': 'incident_report',
  'app/api/carelink/missions/[id]/request-replacement/route.ts': 'request_replacement',
}

for (const [file, action] of Object.entries(actionRoutes)) {
  const text = expectIncludes(file, ['executeCareLinkMobileMissionAction', 'carelinkMobileErrorResponse'], file)
  if (!text.includes(`action: '${action}'`) && !text.includes(`action: "${action}"`)) {
    failures.push(`${file} does not map to canonical action ${action}`)
  }
}

expectIncludes('app/api/carelink/missions/[id]/transition/route.ts', [
  'TRANSITION_TO_ACTION',
  'executeCareLinkMobileMissionAction',
  'confirm_readiness',
  'report_submit',
  'incident_report',
], 'transition route')

expectIncludes('app/api/carelink/missions/[id]/complete/route.ts', [
  'evaluateCareLinkCompletionGates',
  'firstCareLinkCompletionBlocker',
  'action: \'complete\'',
], 'completion route')

const mobileApiFiles = listFiles('app/api/carelink', (file) => file.endsWith('/route.ts') && !file.includes('/ops/'))
for (const file of mobileApiFiles) {
  const text = read(file)
  const hasGuard = text.includes('requireCareLinkMobileAgent') || text.includes('requireCareLinkMobileMissionAccess') || text.includes('requireCareLinkMobileLinkedRowAccess') || text.includes('loadCarelinkMobileWorkspace') || text.includes('executeCareLinkMobileMissionAction') || text.includes("from '@/app/api/carelink/missions/route'")
  const isHealth = file === 'app/api/carelink/health/route.ts'
  if (!hasGuard && !isHealth) {
    failures.push(`mobile API missing CareLink mobile guard: ${file}`)
  }
}

const mobileWriteFiles = mobileApiFiles.filter((file) => {
  const text = read(file)
  return /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(text)
})
for (const file of mobileWriteFiles) {
  const text = read(file)
  const guarded = text.includes('requireCareLinkMobileAgent') || text.includes('requireCareLinkMobileMissionAccess') || text.includes('requireCareLinkMobileLinkedRowAccess') || text.includes('executeCareLinkMobileMissionAction') || text.includes("from '@/app/api/carelink/missions/route'")
  if (!guarded) failures.push(`mobile write route is not guarded: ${file}`)
  if (/body\?\.caregiverId|body\.caregiverId|caregiverId:\s*body/.test(text) && !file.includes('/ops/')) {
    failures.push(`mobile write route appears to trust client caregiverId: ${file}`)
  }
}

expectIncludes('components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx', [
  'EnterpriseAgentProfileScreen',
  'EnterpriseReadinessScreen',
  'EnterpriseScheduleScreen',
  'EnterprisePaymentsScreen',
  'EnterpriseSafetyScreen',
  'EnterpriseOfflineScreen',
  '/api/carelink/profile/corrections',
  '/api/carelink/documents/submit',
  '/api/carelink/policies/acknowledge',
  '/api/carelink/presence',
  '/api/carelink/sos',
], 'P7 enterprise agent UIX')

expectIncludes('lib/carelink/mobile-adapter.ts', [
  'enterpriseDossier',
  'profileRequests',
  'policyAcknowledgements',
  'availabilityUpdates',
  'presenceEvents',
  'documentSubmissions',
  'deviceSessions',
  'securityEvents',
  'deriveEnterpriseDossier',
], 'P7 mobile adapter enterprise sync')

for (const file of [
  'app/api/carelink/profile/corrections/route.ts',
  'app/api/carelink/policies/acknowledge/route.ts',
  'app/api/carelink/presence/route.ts',
  'app/api/carelink/documents/submit/route.ts',
  'app/api/carelink/sos/route.ts',
]) {
  expectIncludes(file, ['requireCareLinkMobileAgent', 'carelinkMobileErrorResponse'], `P7 guarded endpoint ${file}`)
}

const proxy = expectIncludes('proxy.ts', ['isCareLinkOpsProtectedPath', 'isCareLinkOpsAuthorizedActor'], 'proxy route perimeter')
if (!proxy.includes('/carelink-ops')) failures.push('proxy does not include CareLink OPS route path checks')

const verify = expectIncludes('scripts/verify-carelink-routes.mjs', ['P7', 'carelink-production-smoke.mjs', 'mobile-login-session.ts'], 'carelink verifier')
if (!verify.includes('P0 + P1 + P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9')) warnings.push('verifier success message does not show the full P0-P9 label')


const p8Migration = read('supabase/migrations/20260627_carelink_mobile_p8_program_activities.sql')
for (const expected of ['carelink_mission_program_activity_logs', 'carelink_program_activity_unique']) {
  if (!p8Migration.includes(expected)) failures.push(`P8 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p8Migration)) failures.push('P8 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

const p8ProgramRoute = read('app/api/carelink/missions/[id]/program-activity/route.ts')
for (const expected of ['requireCareLinkMobileMissionAccess', 'saveMissionProgramActivityLog', 'recordMissionEvent', 'createDispatchMessage']) {
  if (!p8ProgramRoute.includes(expected)) failures.push(`P8 program activity route missing ${expected}`)
}

const p8Persistence = read('lib/carelink/mobile-persistence.ts')
for (const expected of ['carelink_mission_program_activity_logs', 'loadMissionProgramActivityLogs', 'saveMissionProgramActivityLog']) {
  if (!p8Persistence.includes(expected)) failures.push(`P8 mobile persistence missing ${expected}`)
}

const p8MobileMission = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
for (const expected of ['ProgramExecutionSection', 'Programme et activités', 'program-activity', 'normalizeProgramActivities']) {
  if (!p8MobileMission.includes(expected)) failures.push(`P8 mobile mission UIX missing ${expected}`)
}

const p8CompletionGates = read('lib/carelink/mobile-completion-gates.ts')
for (const expected of ['loadMissionProgramActivityLogs', 'carelink_required_program_activity_missing']) {
  if (!p8CompletionGates.includes(expected)) failures.push(`P8 completion gates missing ${expected}`)
}


const p9BriefRoute = read('app/api/carelink/missions/[id]/brief-acknowledge/route.ts')
for (const expected of ['requireCareLinkMobileMissionAccess', 'saveMissionBriefAcknowledgement', 'recordCareLinkMissionTimelineAudit']) {
  if (!p9BriefRoute.includes(expected)) failures.push(`P9 brief acknowledgement route missing ${expected}`)
}

const p9Persistence = read('lib/carelink/mobile-persistence.ts')
for (const expected of ['carelink_mission_brief_acknowledgements', 'loadMissionBriefAcknowledgement', 'saveMissionBriefAcknowledgement', 'missionBriefAcknowledgementIsComplete']) {
  if (!p9Persistence.includes(expected)) failures.push(`P9 mobile persistence missing ${expected}`)
}

const p9MobileMission = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
for (const expected of ['MissionBriefAcknowledgementSection', 'Brief mission', 'brief-acknowledge', 'buildMissionBriefSections']) {
  if (!p9MobileMission.includes(expected)) failures.push(`P9 mobile mission UIX missing ${expected}`)
}



const p10RouteExecution = read('app/api/carelink/missions/[id]/route-execution/route.ts')
for (const expected of ['requireCareLinkMobileMissionAccess', 'saveMissionRouteExecutionLog', 'recordCareLinkMissionTimelineAudit', 'createDispatchMessage']) {
  if (!p10RouteExecution.includes(expected)) failures.push(`P10 route execution api missing ${expected}`)
}

const p10Persistence = read('lib/carelink/mobile-persistence.ts')
for (const expected of ['carelink_mission_route_execution_logs', 'loadMissionRouteExecutionLogs', 'saveMissionRouteExecutionLog']) {
  if (!p10Persistence.includes(expected)) failures.push(`P10 mobile persistence missing ${expected}`)
}

const p10MobileMission = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
for (const expected of ['RouteTransportExecutionSection', 'Route et transport', 'route-execution', 'normalizeMissionRoutes']) {
  if (!p10MobileMission.includes(expected)) failures.push(`P10 mobile route UIX missing ${expected}`)
}

const p10Adapter = read('lib/carelink/mobile-adapter.ts')
for (const expected of ['loadMissionRouteExecutionLogs', 'routeExecutionLogs']) {
  if (!p10Adapter.includes(expected)) failures.push(`P10 mobile adapter missing ${expected}`)
}

const p9ActionEngine = read('lib/carelink/mobile-action-engine.ts')
for (const expected of ['missionBriefAcknowledgementIsComplete', 'carelink_mission_brief_acknowledgement_required']) {
  if (!p9ActionEngine.includes(expected)) failures.push(`P9 action engine missing ${expected}`)
}

const p11ServiceChecklist = read('lib/carelink/mobile-service-checklists.ts')
for (const expected of ['buildCareLinkDynamicServiceChecklist', 'detectCareLinkServiceFamily', 'postpartum_baby_care', 'special_child_school', 'excursion']) {
  if (!p11ServiceChecklist.includes(expected)) failures.push(`P11 service checklist engine missing ${expected}`)
}

const p11ChecklistRoute = read('app/api/carelink/missions/[id]/checklist/route.ts')
for (const expected of ['buildCareLinkDynamicServiceChecklist', 'definition', 'service_checklist_source']) {
  if (!p11ChecklistRoute.includes(expected)) failures.push(`P11 checklist route missing ${expected}`)
}

const p11MobileMission = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
for (const expected of ['DynamicServiceChecklistSection', 'Checklist service dynamique', 'carelink_mobile_p11_dynamic_service_checklists']) {
  if (!p11MobileMission.includes(expected)) failures.push(`P11 mobile checklist UIX missing ${expected}`)
}



const p12ReportCorrectionRoute = read('app/api/carelink/missions/[id]/report-correction/route.ts')
for (const expected of ['requireCareLinkMobileMissionAccess', 'markMissionReportCorrectionResubmitted', 'createDispatchMessage', 'recordCareLinkMissionTimelineAudit']) {
  if (!p12ReportCorrectionRoute.includes(expected)) failures.push(`P12 report correction route missing ${expected}`)
}

const p12Persistence = read('lib/carelink/mobile-persistence.ts')
for (const expected of ['carelink_mission_report_corrections', 'loadMissionReportCorrections', 'saveMissionReportCorrectionRequest', 'markMissionReportCorrectionResubmitted', 'markMissionReportValidated', 'missionReportValidationReadyForCompletion']) {
  if (!p12Persistence.includes(expected)) failures.push(`P12 persistence missing ${expected}`)
}

const p12OpsCorrection = read('app/api/carelink/ops/reports/[id]/request-correction/route.ts')
for (const expected of ['saveMissionReportCorrectionRequest', 'createNotification', 'report_correction_requested']) {
  if (!p12OpsCorrection.includes(expected)) failures.push(`P12 OPS correction endpoint missing ${expected}`)
}

const p12OpsValidate = read('app/api/carelink/ops/reports/[id]/validate/route.ts')
for (const expected of ['markMissionReportValidated', 'report.validated_via_api']) {
  if (!p12OpsValidate.includes(expected)) failures.push(`P12 OPS validate endpoint missing ${expected}`)
}

const p12Completion = read('lib/carelink/mobile-completion-gates.ts')
for (const expected of ['missionReportValidationReadyForCompletion', 'carelink_report_correction_required', 'carelink_report_validation_required']) {
  if (!p12Completion.includes(expected)) failures.push(`P12 completion gates missing ${expected}`)
}

const p12MobileMission = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
for (const expected of ['ReportCorrectionValidationSection', 'Validation rapport OPS', 'report-correction', 'Renvoyer correction à OPS']) {
  if (!p12MobileMission.includes(expected)) failures.push(`P12 mobile report validation UIX missing ${expected}`)
}


const p13PresenceRoute = read('app/api/carelink/missions/[id]/presence-proof/route.ts')
for (const expected of ['requireCareLinkMobileMissionAccess', 'saveMissionPresenceProof', 'recordCareLinkMissionTimelineAudit', 'createDispatchMessage']) {
  if (!p13PresenceRoute.includes(expected)) failures.push(`P13 presence proof api missing ${expected}`)
}

const p13Persistence = read('lib/carelink/mobile-persistence.ts')
for (const expected of ['carelink_mission_presence_proofs', 'loadMissionPresenceProofs', 'saveMissionPresenceProof', 'missionPresenceProofReadyForCompletion']) {
  if (!p13Persistence.includes(expected)) failures.push(`P13 mobile persistence missing ${expected}`)
}

const p13MobileMission = read('components/carelink/mobile/CareLinkFieldAgentPremiumApp.tsx')
for (const expected of ['AttendancePresenceProofSection', 'Présence et pointage', 'presence-proof', 'normalizePresenceProofLog']) {
  if (!p13MobileMission.includes(expected)) failures.push(`P13 mobile presence UIX missing ${expected}`)
}

const p13CompletionGates = read('lib/carelink/mobile-completion-gates.ts')
for (const expected of ['missionPresenceProofReadyForCompletion', 'carelink_presence_proof_required']) {
  if (!p13CompletionGates.includes(expected)) failures.push(`P13 completion gates missing ${expected}`)
}


if (failures.length) {
  console.error('CareLink production smoke failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  if (warnings.length) {
    console.error('\nWarnings:')
    for (const warning of warnings) console.error(`- ${warning}`)
  }
  process.exit(1)
}

console.log('✅ CareLink P13 production smoke passed')
if (warnings.length) {
  console.log('Warnings:')
  for (const warning of warnings) console.log(`- ${warning}`)
}
