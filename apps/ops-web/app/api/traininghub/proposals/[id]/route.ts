import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { getTrainingHubProposalById } from '@/lib/traininghub/proposals'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const params = await Promise.resolve(context.params)
    const authContext = await getTrainingHubContext()
    const data = await getTrainingHubProposalById(authContext, params.id)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub proposal')
  }
}
