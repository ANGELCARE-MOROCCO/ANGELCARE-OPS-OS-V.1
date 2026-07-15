import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { updateTrainingHubLearningProgress } from '@/lib/traininghub/learning'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const body = await request.json()
    const data = await updateTrainingHubLearningProgress(context, body)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to update TrainingHub e-learning progress')
  }
}
