import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    return NextResponse.json(
      {
        ok: true,
        data: {
          profileId: context.profile.id,
          organizationIds: context.organizationIds,
          entitlements: context.entitlements,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub entitlements')
  }
}
