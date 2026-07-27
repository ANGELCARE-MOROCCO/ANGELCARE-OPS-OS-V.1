import { requireAiProviderUser, aiProviderApiError, type AiProviderPermission } from '@/lib/ai-provider-control/auth'
import { executeAiProviderAction } from '@/lib/ai-provider-control/repository'

const permissionByAction: Record<string, AiProviderPermission> = {
  create_dossier: 'manage', update_dossier: 'manage', store_credential: 'credentials',
  test_credential: 'credentials', activate_credential: 'credentials', save_model: 'manage',
  save_assignment: 'routing', save_routing: 'routing', save_quota: 'quota',
  simulate_route: 'view', set_emergency: 'emergency', publish_configuration: 'manage',
  rollback_configuration: 'manage', save_command_policy: 'quota', save_schedule: 'schedules',
  set_schedule_status: 'schedules', cancel_governed_request: 'requests', invalidate_cache: 'force_refresh',
  phase6_set_dossier_state: 'manage', phase6_set_credential_state: 'credentials', phase6_update_alert: 'manage',
  phase6_save_incident: 'manage', phase6_resolve_incident: 'manage', phase6_save_change_request: 'manage',
  phase6_update_change_status: 'manage', phase6_request_destruction: 'manage', phase6_approve_destruction: 'manage',
  phase6_execute_destruction: 'manage', phase6_save_registry: 'manage', phase6_save_sop_progress: 'view',
  phase6_save_operator_note: 'view', phase6_create_action_job: 'manage',
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; payload?: Record<string, unknown> }
    const action = String(body.action || '')
    if (!permissionByAction[action]) throw new Error('INVALID_ACTION')
    const actor = await requireAiProviderUser(permissionByAction[action])
    const data = await executeAiProviderAction(action, body.payload || {}, actor)
    return Response.json({ ok: true, data })
  } catch (error) {
    return aiProviderApiError(error)
  }
}
