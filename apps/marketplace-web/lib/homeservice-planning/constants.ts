export const HSP_ROOT = '/carelink-ops/service-design/planning'
export const OPENROUTER_FREE_ROUTE = 'openrouter/free' as const
export const MAX_PLAN_SCENARIOS = 10
export const MIN_GRID_MINUTES = 15
export const PLANNING_PERMISSIONS = {
  view:'homeservice_design.view_planning', create:'homeservice_design.create_planning_requests', edit:'homeservice_design.edit_planning_requests', sensitive:'homeservice_design.view_sensitive_beneficiary_data', feasibility:'homeservice_design.run_feasibility', generate:'homeservice_design.generate_plans', editPlans:'homeservice_design.edit_generated_plans', lock:'homeservice_design.lock_plan_blocks', regenerate:'homeservice_design.regenerate_plan_sections', compare:'homeservice_design.compare_plans', merge:'homeservice_design.merge_plans', review:'homeservice_design.review_technical_plans', approve:'homeservice_design.approve_technical_plans', reject:'homeservice_design.reject_technical_plans', templates:'homeservice_design.manage_planning_templates', documents:'homeservice_design.generate_plan_documents', audit:'homeservice_design.audit_planning', admin:'homeservice_design.admin_planning'
} as const
export const PLANNING_ROUTES = [
  ['Commandement planning', HSP_ROOT], ['Nouvelle demande', `${HSP_ROOT}/new`], ['Demandes', `${HSP_ROOT}/requests`], ['Scénarios', `${HSP_ROOT}/scenarios`], ['Validation', `${HSP_ROOT}/validation`], ['Modèles', `${HSP_ROOT}/templates`], ['Exécutions IA', `${HSP_ROOT}/runs`], ['Paramètres', `${HSP_ROOT}/settings`]
] as const
