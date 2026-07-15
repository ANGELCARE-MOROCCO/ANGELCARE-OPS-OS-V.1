import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'
import { buildTrainingHubPartnerPortalSummary } from '@/lib/traininghub/partner-portal-sync'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    const supabase = await createTrainingHubUserClient()
    const data = await buildTrainingHubPartnerPortalSummary(supabase, context)

    return NextResponse.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
