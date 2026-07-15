import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { listTrainingHubCourseResources } from '@/lib/traininghub/resources'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = {
  params: Promise<{ ref: string }> | { ref: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const params = await Promise.resolve(context.params)
    const authContext = await getTrainingHubContext()
    const data = await listTrainingHubCourseResources(authContext, params.ref)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to list TrainingHub course resources')
  }
}
