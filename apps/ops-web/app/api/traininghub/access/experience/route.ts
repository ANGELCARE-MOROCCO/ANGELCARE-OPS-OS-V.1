import { NextResponse } from 'next/server'
import { getTrainingHubContext, serializeTrainingHubMe, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { serializeTrainingHubExperience } from '@/lib/traininghub/experience'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    return NextResponse.json(
      {
        ok: true,
        data: {
          me: serializeTrainingHubMe(context),
          experience: serializeTrainingHubExperience(context),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
