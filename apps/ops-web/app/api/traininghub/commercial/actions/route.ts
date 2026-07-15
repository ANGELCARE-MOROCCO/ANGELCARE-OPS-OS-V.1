import { NextRequest, NextResponse } from 'next/server'
import { createTrainingHubCommercialAdminClient, executeTrainingHubCommercialAction } from '@/lib/traininghub/commercial/commercial-sync'
import { getTrainingHubContext, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('TrainingHub commercial actions are reserved for internal users.', 403, 'TRAININGHUB_INTERNAL_REQUIRED')
    }
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || body.action_type || '').trim()
    if (!action) throw new TrainingHubHttpError('Commercial action is required.', 400, 'TRAININGHUB_COMMERCIAL_ACTION_REQUIRED')
    const supabase = createTrainingHubCommercialAdminClient()
    const result = await executeTrainingHubCommercialAction(supabase, action, {
      ...(body.payload || body),
      actor_profile_id: context.profile?.id || null,
      actor_email: context.authUser?.email || null,
    })
    return NextResponse.json({ ok: result.ok !== false, data: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
