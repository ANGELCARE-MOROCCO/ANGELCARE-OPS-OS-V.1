import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { getTrainingHubCourseByRef, updateTrainingHubCourseByRef } from '@/lib/traininghub/catalogue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = {
  params: Promise<{ ref: string }> | { ref: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const params = await Promise.resolve(context.params)
    const authContext = await getTrainingHubContext()
    const data = await getTrainingHubCourseByRef(authContext, params.ref)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub course')
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const params = await Promise.resolve(context.params)
    const authContext = await getTrainingHubContext()
    const body = await request.json()
    const data = await updateTrainingHubCourseByRef(authContext, params.ref, body)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to update TrainingHub course')
  }
}
