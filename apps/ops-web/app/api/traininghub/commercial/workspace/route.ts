import { NextResponse } from 'next/server'
import { buildTrainingHubCommercialWorkspace, createTrainingHubCommercialAdminClient } from '@/lib/traininghub/commercial/commercial-sync'
import { getTrainingHubContext, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('TrainingHub commercial workspace is reserved for internal users.', 403, 'TRAININGHUB_INTERNAL_REQUIRED')
    }
    const supabase = createTrainingHubCommercialAdminClient()
    const data = await buildTrainingHubCommercialWorkspace(supabase)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
