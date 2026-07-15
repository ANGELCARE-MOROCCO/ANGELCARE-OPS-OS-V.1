import { NextResponse } from 'next/server'
import { getTrainingHubContext, serializeTrainingHubMe, trainingHubErrorResponse } from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    return NextResponse.json(
      { ok: true, data: serializeTrainingHubMe(context) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub profile')
  }
}
