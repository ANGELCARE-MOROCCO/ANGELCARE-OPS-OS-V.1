import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { getTrainingHubAccessDiagnostics } from '@/lib/traininghub/access'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    const data = await getTrainingHubAccessDiagnostics(context)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub access diagnostics')
  }
}
