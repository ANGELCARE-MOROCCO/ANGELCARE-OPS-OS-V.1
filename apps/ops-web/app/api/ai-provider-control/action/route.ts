import { requireAiProviderUser, aiProviderApiError, type AiProviderPermission } from '@/lib/ai-provider-control/auth'
import { executeAiProviderAction } from '@/lib/ai-provider-control/repository'

const permissionByAction: Record<string, AiProviderPermission> = {
  create_dossier: 'manage', update_dossier: 'manage', store_credential: 'credentials',
  test_credential: 'credentials', activate_credential: 'credentials', save_model: 'manage',
  save_assignment: 'routing', save_routing: 'routing', save_quota: 'quota',
  simulate_route: 'view', set_emergency: 'emergency', publish_configuration: 'manage',
  rollback_configuration: 'manage', save_command_policy: 'quota', save_schedule: 'schedules',
  set_schedule_status: 'schedules', cancel_governed_request: 'requests', invalidate_cache: 'force_refresh',
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
