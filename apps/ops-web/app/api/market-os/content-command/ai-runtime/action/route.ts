import { NextRequest } from 'next/server'
import { requireMarketingAiUser, apiErrorResponse } from '@/lib/market-os/marketing-ai/auth'
import {
  archiveRuntimeDossier, disableRuntimeAssignment, overrideRuntimeAssignment, permanentlyDeleteRuntimeAssignment,
  permanentlyDeleteRuntimeDossier, permanentlyDeleteRuntimeModel, retireGeminiMarketAssignments, testRuntimeCapability,
  updateRuntimeAssignment, updateRuntimeDossier, updateRuntimeModel,
} from '@/lib/market-os/ai-runtime/control-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>
    const action = String(body.action || '')
    const permission = action === 'test_capability' ? 'run'
      : action.startsWith('delete_') ? 'purge'
      : action === 'override_assignment' ? 'override'
      : 'govern'
    const user = await requireMarketingAiUser(permission)
    const actor = { id: user.id, name: user.name, role: user.role }
    const result = action === 'update_assignment' ? await updateRuntimeAssignment(body, actor)
      : action === 'disable_assignment' ? await disableRuntimeAssignment(body, actor)
      : action === 'override_assignment' ? await overrideRuntimeAssignment(body, actor)
      : action === 'delete_assignment' ? await permanentlyDeleteRuntimeAssignment(body, actor)
      : action === 'update_model' ? await updateRuntimeModel(body, actor)
      : action === 'update_dossier' ? await updateRuntimeDossier(body, actor)
      : action === 'archive_dossier' ? await archiveRuntimeDossier(body, actor)
      : action === 'delete_dossier' ? await permanentlyDeleteRuntimeDossier(body, actor)
      : action === 'delete_model' ? await permanentlyDeleteRuntimeModel(body, actor)
      : action === 'retire_gemini' ? await retireGeminiMarketAssignments(body, actor)
      : action === 'test_capability' ? await testRuntimeCapability(body)
      : (() => { throw new Error('RUNTIME_ACTION_UNSUPPORTED') })()
    return Response.json({ ok: true, result })
  } catch (error) { return apiErrorResponse(error) }
}
