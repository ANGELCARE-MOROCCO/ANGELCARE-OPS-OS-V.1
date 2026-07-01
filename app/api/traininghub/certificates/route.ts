import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { listTrainingHubCertificates } from '@/lib/traininghub/learning'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const data = await listTrainingHubCertificates(context, new URL(request.url))
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to list TrainingHub certificates')
  }
}
