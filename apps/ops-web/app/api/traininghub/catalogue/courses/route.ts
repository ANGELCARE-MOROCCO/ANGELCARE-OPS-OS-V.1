import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { getTrainingHubCourses } from '@/lib/traininghub/catalogue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const data = await getTrainingHubCourses(context, new URL(request.url))
    return NextResponse.json(
      { ok: true, data, meta: { count: data.length } },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub courses')
  }
}
