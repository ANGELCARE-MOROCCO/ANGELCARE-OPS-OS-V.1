import { NextResponse } from 'next/server'
import { getTrainingHubContext, serializeTrainingHubMe, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { serializeTrainingHubNavigation } from '@/lib/traininghub/navigation'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    return NextResponse.json(
      {
        ok: true,
        data: {
          me: serializeTrainingHubMe(context),
          navigation: serializeTrainingHubNavigation(context),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
