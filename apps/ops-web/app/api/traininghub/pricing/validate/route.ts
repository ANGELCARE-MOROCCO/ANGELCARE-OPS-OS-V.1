import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { previewTrainingHubPricing } from '@/lib/traininghub/pricing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const body = await request.json()
    const data = await previewTrainingHubPricing(context, body, { persist: false })
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to validate TrainingHub pricing')
  }
}
