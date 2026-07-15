import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { createTrainingHubSession, listTrainingHubSessions } from '@/lib/traininghub/fulfillment'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const data = await listTrainingHubSessions(context, new URL(request.url))
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to list TrainingHub sessions')
  }
}

export async function POST(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const body = await request.json()
    const data = await createTrainingHubSession(context, body)
    return NextResponse.json({ ok: true, data }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to create TrainingHub session')
  }
}
