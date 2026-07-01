import type { Ac360Engine } from './types'

export const AC360_PHASE1_SYSTEMS = [
  'Multi-Tenant Institution System',
  'Identity, Access & Governance System',
  'Billing Core System',
  'Entitlement & Feature Control System',
  'Add-On & Growth Menu System',
  'Usage, Credits & Metering System',
  'Account Lifecycle & Restriction System',
] as const

export const AC360_MASTER_SYSTEMS = [
  ...AC360_PHASE1_SYSTEMS,
  'School Operations System',
  'Optional Module Systems',
  'Communication & Automation System',
  'National Growth & Client Success System',
  'Infrastructure, Monitoring & Security System',
] as const

export const AC360_PHASE1_TABLES = [
  'ac360_organizations',
  'ac360_campuses',
  'ac360_legal_profiles',
  'ac360_academic_years',
  'ac360_user_memberships',
  'ac360_permissions',
  'ac360_roles',
  'ac360_role_permissions',
  'ac360_user_role_assignments',
  'ac360_audit_logs',
  'ac360_foundation_engines',
  'ac360_feature_registry',
  'ac360_action_registry',
  'ac360_plans',
  'ac360_plan_versions',
  'ac360_plan_entitlements',
  'ac360_addons',
  'ac360_addon_entitlements',
  'ac360_serenite_bundles',
  'ac360_professional_services_catalog',
  'ac360_subscriptions',
  'ac360_subscription_items',
  'ac360_quotes',
  'ac360_contracts',
  'ac360_invoices',
  'ac360_invoice_lines',
  'ac360_payments',
  'ac360_usage_meters',
  'ac360_usage_events',
  'ac360_usage_summaries',
  'ac360_credit_wallets',
  'ac360_credit_ledger',
  'ac360_capacity_snapshots',
  'ac360_trials',
  'ac360_grace_periods',
  'ac360_restriction_rules',
  'ac360_restrictions',
  'ac360_recommendations',
  'ac360_automation_rules',
  'ac360_guard_decisions',
  'ac360_app_action_wiring',
  'ac360_policy_locks',
  'ac360_policy_override_requests',
  'ac360_policy_events',
  'ac360_route_coverage_audits',
  'ac360_blocked_action_messages',
  'ac360_foundation_qa_runs',
  'ac360_foundation_qa_results',
  'ac360_foundation_gate_matrix',
  'ac360_engine_coverage_matrix',
  'ac360_deployment_gates',
  'ac360_deployment_gate_events',
] as const

export const AC360_PHASE1_ENGINE_CODES = [
  'AC360-ENG-01', 'AC360-ENG-02', 'AC360-ENG-03', 'AC360-ENG-04', 'AC360-ENG-05',
  'AC360-ENG-06', 'AC360-ENG-07', 'AC360-ENG-08', 'AC360-ENG-09', 'AC360-ENG-10', 'AC360-ENG-11',
  'AC360-ENG-12', 'AC360-ENG-13', 'AC360-ENG-14', 'AC360-ENG-15', 'AC360-ENG-16', 'AC360-ENG-17', 'AC360-ENG-18', 'AC360-ENG-19', 'AC360-ENG-20', 'AC360-ENG-21',
  'AC360-ENG-22', 'AC360-ENG-23', 'AC360-ENG-24', 'AC360-ENG-25', 'AC360-ENG-26', 'AC360-ENG-27',
  'AC360-ENG-28', 'AC360-ENG-29', 'AC360-ENG-30', 'AC360-ENG-31', 'AC360-ENG-32',
  'AC360-ENG-33', 'AC360-ENG-34', 'AC360-ENG-35', 'AC360-ENG-36', 'AC360-ENG-37', 'AC360-ENG-38',
  'AC360-ENG-39', 'AC360-ENG-40', 'AC360-ENG-41', 'AC360-ENG-42', 'AC360-ENG-43', 'AC360-ENG-44',
] as const

export const AC360_FULL_ENGINE_COUNT = 52
export const AC360_PHASE1_ENGINE_COUNT = AC360_PHASE1_ENGINE_CODES.length

export const AC360_PACKAGE_PRICES_MAD = {
  start: { monthly: 790, annual: 7900, students: 60, staff: 5, campuses: 1, storageGb: 5, credits: 300 },
  pro: { monthly: 1490, annual: 14900, students: 150, staff: 15, campuses: 1, storageGb: 25, credits: 1500 },
  command: { monthly: 2900, annual: 29000, students: 350, staff: 35, campuses: 2, storageGb: 75, credits: 5000 },
} as const

export const AC360_CRITICAL_FLOW = [
  'Check organization status',
  'Check active subscription',
  'Check feature entitlement',
  'Check capacity / usage / credits',
  'Allow or block action',
  'Execute action',
  'Record usage event',
  'Update meter / wallet / invoice',
  'Trigger alerts / recommendations / restrictions',
  'Write audit log',
] as const

export const AC360_REQUIRED_SEEDS = {
  plans: ['start', 'pro', 'command'],
  meters: ['automation_credit', 'whatsapp_message', 'sms_message', 'email_message', 'ai_credit', 'report_generation', 'storage_gb'],
  featureKeys: ['billing_center', 'student_core', 'staff_core', 'campus_management', 'credit_wallet', 'audit_logs', 'rbac_advanced'],
  addonKeys: ['advanced_admissions', 'finance_power', 'workflow_builder', 'parenttrust', 'hr_staffing', 'academy_training', 'transport_module', 'ai_assistant'],
}

export function formatMAD(value: unknown) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function isPhase1Engine(engine: Pick<Ac360Engine, 'engine_code'>) {
  return (AC360_PHASE1_ENGINE_CODES as readonly string[]).includes(engine.engine_code)
}
