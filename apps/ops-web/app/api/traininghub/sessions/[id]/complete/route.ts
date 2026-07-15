import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { completeTrainingHubSession } from '@/lib/traininghub/fulfillment'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const params = await Promise.resolve(context.params)
    const authContext = await getTrainingHubContext()
    const body = await request.json()
    const data = await completeTrainingHubSession(authContext, params.id, body)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to complete TrainingHub session')
  }
}
