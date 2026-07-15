import fs from 'fs'
import path from 'path'

const root = process.cwd()
const requiredFiles = [
  'app/carelink/page.tsx',
  'app/carelink/login/page.tsx',
  'app/carelink/missions/page.tsx',
  'app/carelink/missions/[id]/page.tsx',
  'app/carelink/schedule/page.tsx',
  'app/carelink/messages/page.tsx',
  'app/carelink/profile/page.tsx',
  'app/carelink/offline/page.tsx',
  'app/carelink-ops/page.tsx',
  'app/carelink-ops/missions/page.tsx',
  'app/carelink-ops/dispatch/page.tsx',
  'app/carelink-ops/agents/page.tsx',
  'lib/carelink/mobile-auth.ts',
  'lib/carelink/mobile-action-idempotency.ts',
  'lib/carelink/mobile-action-engine.ts',
  'lib/carelink/mobile-audit-ledger.ts',
  'lib/carelink/mobile-operational-escalation.ts',
  'lib/carelink/mobile-completion-gates.ts',
  'lib/carelink/mobile-device-governance.ts',
  'lib/carelink/mobile-login-session.ts',
  'supabase/migrations/20260627_carelink_mobile_p0_access_idempotency.sql',
  'supabase/migrations/20260627_carelink_mobile_p1_action_engine.sql',
  'supabase/migrations/20260627_carelink_mobile_p2_audit_compliance.sql',
  'supabase/migrations/20260627_carelink_mobile_p3_escalation_readiness.sql',
  'supabase/migrations/20260627_carelink_mobile_p4_device_session_governance.sql',
  'scripts/carelink-production-smoke.mjs',
  'components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx',
  'supabase/migrations/20260627_carelink_mobile_p7_enterprise_dossier.sql',
  'supabase/migrations/20260627_carelink_mobile_p8_program_activities.sql',
  'supabase/migrations/20260627_carelink_mobile_p9_mission_brief_acknowledgement.sql',
  'supabase/migrations/20260627_carelink_mobile_p10_route_transport_execution.sql',
  'supabase/migrations/20260627_carelink_mobile_p11_dynamic_service_checklists.sql',
  'supabase/migrations/20260627_carelink_mobile_p12_report_correction_validation.sql',
  'supabase/migrations/20260627_carelink_mobile_p13_attendance_presence_proof.sql',
  'supabase/migrations/20260627_carelink_mobile_p14_availability_roster_cockpit.sql',
  'supabase/migrations/20260627_carelink_mobile_p17_payments_honoraires_disputes.sql',
  'supabase/migrations/20260627_carelink_mobile_p18_sos_incident_escalation.sql',
]

const protectedMobileApiFiles = [
  'app/api/carelink/missions/route.ts',
  'app/api/carelink/missions/[id]/route.ts',
  'app/api/carelink/missions/[id]/accept/route.ts',
  'app/api/carelink/missions/[id]/decline/route.ts',
  'app/api/carelink/missions/[id]/en-route/route.ts',
  'app/api/carelink/missions/[id]/arrive/route.ts',
  'app/api/carelink/missions/[id]/check-in/route.ts',
  'app/api/carelink/missions/[id]/start/route.ts',
  'app/api/carelink/missions/[id]/complete/route.ts',
  'app/api/carelink/missions/[id]/report/route.ts',
  'app/api/carelink/missions/[id]/program-activity/route.ts',
  'app/api/carelink/missions/[id]/brief-acknowledge/route.ts',
  'app/api/carelink/missions/[id]/route-execution/route.ts',
  'app/api/carelink/missions/[id]/presence-proof/route.ts',
  'app/api/carelink/availability/route.ts',
  'app/api/carelink/payments/disputes/route.ts',
  'app/api/carelink/missions/[id]/incident/route.ts',
  'app/api/carelink/messages/route.ts',
  'app/api/carelink/messages/[id]/read/route.ts',
  'app/api/carelink/alerts/[id]/acknowledge/route.ts',
  'app/api/carelink/notifications/[id]/acknowledge/route.ts',
  'app/api/carelink/profile/corrections/route.ts',
  'app/api/carelink/policies/acknowledge/route.ts',
  'app/api/carelink/presence/route.ts',
  'app/api/carelink/documents/submit/route.ts',
  'app/api/carelink/sos/route.ts',
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

const canonicalActionRoutes = [
  'app/api/carelink/missions/[id]/accept/route.ts',
  'app/api/carelink/missions/[id]/decline/route.ts',
  'app/api/carelink/missions/[id]/confirm-readiness/route.ts',
  'app/api/carelink/missions/[id]/en-route/route.ts',
  'app/api/carelink/missions/[id]/arrive/route.ts',
  'app/api/carelink/missions/[id]/arrived/route.ts',
  'app/api/carelink/missions/[id]/check-in/route.ts',
  'app/api/carelink/missions/[id]/start/route.ts',
  'app/api/carelink/missions/[id]/report/route.ts',
  'app/api/carelink/missions/[id]/complete/route.ts',
  'app/api/carelink/missions/[id]/delay/route.ts',
  'app/api/carelink/missions/[id]/incident/route.ts',
  'app/api/carelink/missions/[id]/request-replacement/route.ts',
  'app/api/carelink/missions/[id]/transition/route.ts',
]

const failures = []
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing file: ${file}`)
}

for (const file of protectedMobileApiFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`missing protected mobile api: ${file}`)
    continue
  }
  const text = read(file)
  if (!text.includes('mobile-auth') && !text.includes('loadCarelinkMobileWorkspace')) {
    failures.push(`mobile api is not protected by CareLink guard: ${file}`)
  }
}


for (const file of canonicalActionRoutes) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`missing canonical mobile action route: ${file}`)
    continue
  }
  const text = read(file)
  if (!text.includes('executeCareLinkMobileMissionAction')) {
    failures.push(`mobile route bypasses canonical action engine: ${file}`)
  }
}

const actionEngine = read('lib/carelink/mobile-action-engine.ts')
for (const expected of ['beginCareLinkMobileAction', 'completeCareLinkMobileAction', 'requireCareLinkMobileMissionAccess', 'recordCareLinkMissionTimelineAudit', 'recordCareLinkDispatchSlaSnapshot', 'createCareLinkOperationalEscalation', 'carelink_mobile_transition_blocked']) {
  if (!actionEngine.includes(expected)) failures.push(`mobile action engine missing ${expected}`)
}

const auditLedger = read('lib/carelink/mobile-audit-ledger.ts')
for (const expected of ['carelink_agent_activity_ledger', 'carelink_mission_timeline_audit', 'carelink_dispatch_sla_audit_snapshots']) {
  if (!auditLedger.includes(expected)) failures.push(`mobile audit ledger missing ${expected}`)
}

const p2Migration = read('supabase/migrations/20260627_carelink_mobile_p2_audit_compliance.sql')
for (const expected of ['carelink_agent_activity_ledger', 'carelink_mission_timeline_audit', 'carelink_dispatch_sla_audit_snapshots']) {
  if (!p2Migration.includes(expected)) failures.push(`P2 migration missing ${expected}`)
}

const p3Migration = read('supabase/migrations/20260627_carelink_mobile_p3_escalation_readiness.sql')
for (const expected of ['carelink_operational_escalations', 'carelink_ops_action_queue']) {
  if (!p3Migration.includes(expected)) failures.push(`P3 migration missing ${expected}`)
}

const escalationEngine = read('lib/carelink/mobile-operational-escalation.ts')
for (const expected of ['createCareLinkOperationalEscalation', 'carelink_operational_escalations', 'carelink_ops_action_queue', 'createDispatchMessage']) {
  if (!escalationEngine.includes(expected)) failures.push(`P3 escalation engine missing ${expected}`)
}

const completionGates = read('lib/carelink/mobile-completion-gates.ts')
for (const expected of ['evaluateCareLinkCompletionGates', 'carelink_required_checklist_missing', 'carelink_report_required_before_completion']) {
  if (!completionGates.includes(expected)) failures.push(`P3 completion gates missing ${expected}`)
}

const p4Migration = read('supabase/migrations/20260627_carelink_mobile_p4_device_session_governance.sql')
for (const expected of ['carelink_mobile_device_sessions', 'carelink_mobile_security_events', 'carelink_mobile_device_sessions_unique']) {
  if (!p4Migration.includes(expected)) failures.push(`P4 migration missing ${expected}`)
}

const deviceGovernance = read('lib/carelink/mobile-device-governance.ts')
for (const expected of ['evaluateCareLinkMobileDeviceGovernance', 'resolveCareLinkMobileDeviceContext', 'carelink_mobile_device_sessions', 'carelink_mobile_security_events', 'carelink_mobile_session_limit_exceeded']) {
  if (!deviceGovernance.includes(expected)) failures.push(`P4 device governance missing ${expected}`)
}

const completeRoute = read('app/api/carelink/missions/[id]/complete/route.ts')
if (!completeRoute.includes('evaluateCareLinkCompletionGates')) failures.push('mission completion route does not use P3 completion gates')


const packageJson = JSON.parse(read('package.json'))
const scripts = packageJson.scripts || {}
if (!scripts['carelink:production-smoke']) failures.push('package.json missing carelink:production-smoke script')
if (!scripts['carelink:deploy-gate']) failures.push('package.json missing carelink:deploy-gate script')
if (scripts['carelink:deploy-gate'] && !scripts['carelink:deploy-gate'].includes('carelink:verify')) failures.push('carelink:deploy-gate does not include carelink:verify')
if (scripts['carelink:deploy-gate'] && !scripts['carelink:deploy-gate'].includes('carelink:production-smoke')) failures.push('carelink:deploy-gate does not include carelink:production-smoke')

const p5Smoke = read('scripts/carelink-production-smoke.mjs')
for (const expected of ['CareLink P17 + P18 production smoke passed', 'create policy if not exists', 'mobile write route appears to trust client caregiverId', 'carelink:deploy-gate']) {
  if (!p5Smoke.includes(expected)) failures.push(`P5 production smoke missing ${expected}`)
}

const mobileLogin = read('lib/carelink/mobile-login-session.ts')
for (const expected of ['loginCareLinkMobileAgent', 'upsertCareLinkMobileAppUserFromAccess', 'carelink_agent_app_access', 'signInWithPassword', 'APP_SESSION_COOKIE']) {
  if (!mobileLogin.includes(expected)) failures.push(`P6 mobile login sync missing ${expected}`)
}

const carelinkLoginPage = read('app/carelink/login/page.tsx')
for (const expected of ['loginCareLinkMobileAgent', 'CareLink AngelCare OS', 'WhatsApp Support']) {
  if (!carelinkLoginPage.includes(expected)) failures.push(`P6 mobile login page missing ${expected}`)
}

const mobileAccessRoute = read('app/api/carelink/ops/agents/[id]/mobile-access/route.ts')
if (!mobileAccessRoute.includes('upsertCareLinkMobileAppUserFromAccess')) failures.push('OPS agent mobile access route does not sync CareLink mobile app user')

const mobileAuth = read('lib/carelink/mobile-auth.ts')
if (!mobileAuth.includes('recordCareLinkMobileGuardPass')) failures.push('mobile auth guard does not record corporate guard audit pass')
if (!mobileAuth.includes('evaluateCareLinkMobileDeviceGovernance')) failures.push('mobile auth guard does not enforce P4 device governance')
if (!mobileAuth.includes('deviceContext')) failures.push('mobile auth guard does not return P4 device context')

if (!actionEngine.includes('requireCareLinkMobileMissionAccess(missionId, config.capability, args.request)')) {
  failures.push('mobile action engine does not pass Request into P4 device/session governance')
}

const mobileAdapter = read('lib/carelink/mobile-adapter.ts')
if (mobileAdapter.includes('fallbackRows')) failures.push('mobile adapter still contains fallback caregiver lookup')
if (mobileAdapter.includes(': allRecords')) failures.push('mobile adapter still falls back to all records')
if (!mobileAdapter.includes('requireCareLinkMobileAgent')) failures.push('mobile adapter does not require authenticated mobile agent')

const proxy = read('proxy.ts')
if (!proxy.includes('isCareLinkOpsProtectedPath')) failures.push('proxy does not protect CareLink OPS route perimeter')
if (!proxy.includes('isCareLinkMobileProtectedPath')) failures.push('proxy does not redirect CareLink mobile routes to the mobile login')
if (!proxy.includes('/carelink/login')) failures.push('proxy does not include CareLink mobile login redirect')

const p7Component = read('components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx')
for (const expected of ['EnterpriseAgentProfileScreen', 'EnterpriseReadinessScreen', 'EnterpriseScheduleScreen', 'EnterprisePaymentsScreen', 'EnterpriseSafetyScreen', 'EnterpriseOfflineScreen', '/api/carelink/profile/corrections', '/api/carelink/documents/submit', '/api/carelink/policies/acknowledge', '/api/carelink/presence', '/api/carelink/sos']) {
  if (!p7Component.includes(expected)) failures.push(`P7 enterprise mobile screens missing ${expected}`)
}

const p7Migration = read('supabase/migrations/20260627_carelink_mobile_p7_enterprise_dossier.sql')
for (const expected of ['carelink_agent_profile_requests', 'carelink_agent_policy_acknowledgements', 'carelink_agent_availability_updates', 'carelink_agent_presence_events', 'carelink_agent_document_submissions']) {
  if (!p7Migration.includes(expected)) failures.push(`P7 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p7Migration)) failures.push('P7 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

const p7Adapter = read('lib/carelink/mobile-adapter.ts')
for (const expected of ['enterpriseDossier', 'profileRequests', 'policyAcknowledgements', 'availabilityUpdates', 'presenceEvents', 'documentSubmissions', 'deviceSessions', 'securityEvents', 'deriveEnterpriseDossier']) {
  if (!p7Adapter.includes(expected)) failures.push(`P7 mobile adapter missing ${expected}`)
}


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


const p9Migration = read('supabase/migrations/20260627_carelink_mobile_p9_mission_brief_acknowledgement.sql')
for (const expected of ['carelink_mission_brief_acknowledgements', 'carelink_mission_brief_ack_unique']) {
  if (!p9Migration.includes(expected)) failures.push(`P9 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p9Migration)) failures.push('P9 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

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



const p10Migration = read('supabase/migrations/20260627_carelink_mobile_p10_route_transport_execution.sql')
for (const expected of ['carelink_mission_route_execution_logs', 'carelink_route_execution_mission_idx']) {
  if (!p10Migration.includes(expected)) failures.push(`P10 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p10Migration)) failures.push('P10 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

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

const p11Migration = read('supabase/migrations/20260627_carelink_mobile_p11_dynamic_service_checklists.sql')
for (const expected of ['service_type text', 'service_family text', 'evidence_required boolean', 'carelink_mission_checklist_items_service_idx']) {
  if (!p11Migration.includes(expected)) failures.push(`P11 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p11Migration)) failures.push('P11 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

const p11ServiceChecklist = read('lib/carelink/mobile-service-checklists.ts')
for (const expected of ['buildCareLinkDynamicServiceChecklist', 'detectCareLinkServiceFamily', 'childcare_home', 'postpartum_baby_care', 'special_child_school', 'excursion']) {
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


const p13Migration = read('supabase/migrations/20260627_carelink_mobile_p13_attendance_presence_proof.sql')
for (const expected of ['carelink_mission_presence_proofs', 'carelink_presence_proofs_mission_idx', 'risk_flag text']) {
  if (!p13Migration.includes(expected)) failures.push(`P13 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p13Migration)) failures.push('P13 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

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



const p14Migration = read('supabase/migrations/20260627_carelink_mobile_p14_availability_roster_cockpit.sql')
for (const expected of ['carelink_agent_availability_updates', 'availability_type text', 'weekend_available boolean', 'carelink_availability_updates_blackout_idx']) {
  if (!p14Migration.includes(expected)) failures.push(`P14 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p14Migration)) failures.push('P14 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

const p14AvailabilityRoute = read('app/api/carelink/availability/route.ts')
for (const expected of ['normalizeAvailabilityType', 'recordCareLinkAgentActivity', 'availability_type', 'weekend_available', 'transport_ready']) {
  if (!p14AvailabilityRoute.includes(expected)) failures.push(`P14 availability api missing ${expected}`)
}

const p14ScheduleScreen = read('components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx')
for (const expected of ['Disponibilité & roster', 'blackoutDate', 'weekendAvailable', 'nightAvailable', 'emergencyAvailable', 'transportReady', 'conflictLevel']) {
  if (!p14ScheduleScreen.includes(expected)) failures.push(`P14 availability roster UIX missing ${expected}`)
}

const p14Adapter = read('lib/carelink/mobile-adapter.ts')
for (const expected of ['latestAvailabilityType', 'activeBlackouts', 'conflictWarnings', 'transportReady']) {
  if (!p14Adapter.includes(expected)) failures.push(`P14 mobile adapter missing ${expected}`)
}


const p17Migration = read('supabase/migrations/20260627_carelink_mobile_p17_payments_honoraires_disputes.sql')
for (const expected of ['carelink_payment_disputes', 'dispute_type text', 'ops_review_status text', 'carelink_payment_disputes_status_idx']) {
  if (!p17Migration.includes(expected)) failures.push(`P17 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p17Migration)) failures.push('P17 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

const p18Migration = read('supabase/migrations/20260627_carelink_mobile_p18_sos_incident_escalation.sql')
for (const expected of ['carelink_mobile_sos_events', 'emergency_type text', 'callback_requested boolean', 'carelink_mobile_sos_events_status_idx']) {
  if (!p18Migration.includes(expected)) failures.push(`P18 migration missing ${expected}`)
}
if (/create\s+policy\s+if\s+not\s+exists/i.test(p18Migration)) failures.push('P18 migration uses invalid CREATE POLICY IF NOT EXISTS syntax')

const p17PaymentsRoute = read('app/api/carelink/payments/disputes/route.ts')
for (const expected of ['createPaymentDispute', 'payment-honoraires-dispute', 'createDispatchMessage', 'recordCareLinkAgentActivity']) {
  if (!p17PaymentsRoute.includes(expected)) failures.push(`P17 payment dispute api missing ${expected}`)
}

const p18SosRoute = read('app/api/carelink/sos/route.ts')
for (const expected of ['saveMobileSosEvent', 'sos-incident-real-time-escalation', 'createCareLinkOperationalEscalation', 'callbackRequested', 'replacementRequested']) {
  if (!p18SosRoute.includes(expected)) failures.push(`P18 SOS api missing ${expected}`)
}

const p17p18Persistence = read('lib/carelink/mobile-persistence.ts')
for (const expected of ['loadMobileSosEvents', 'saveMobileSosEvent', 'amountExpected', 'opsReviewStatus', 'carelink_mobile_sos_events']) {
  if (!p17p18Persistence.includes(expected)) failures.push(`P17/P18 mobile persistence missing ${expected}`)
}

const p17p18Screens = read('components/carelink/mobile/CareLinkAgentEnterpriseScreens.tsx')
for (const expected of ['Litige honoraires', 'Décompte honoraires', 'Événements SOS', 'Escalade temps réel', 'carelink_mobile_p18_sos_incident']) {
  if (!p17p18Screens.includes(expected)) failures.push(`P17/P18 mobile UIX missing ${expected}`)
}

const p17p18Adapter = read('lib/carelink/mobile-adapter.ts')
for (const expected of ['loadMobileSosEvents', 'sosEvents']) {
  if (!p17p18Adapter.includes(expected)) failures.push(`P17/P18 mobile adapter missing ${expected}`)
}


if (failures.length) {
  console.error('CareLink verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('✅ CareLink P0 + P1 + P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9 + P10 + P11 + P12 + P13 + P14 + P17 + P18 production verification passed')
