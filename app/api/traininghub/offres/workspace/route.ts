import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'
import { buildOffersWorkspace, createOffersAdminClient } from '@/lib/traininghub/offres/offers-sync'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('TrainingHub offers management is reserved for internal users.', 403, 'TRAININGHUB_INTERNAL_REQUIRED')
    }
    const supabase = createOffersAdminClient()
    const data = await buildOffersWorkspace(supabase)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
