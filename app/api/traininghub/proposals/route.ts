import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { createTrainingHubProposal, listTrainingHubProposals } from '@/lib/traininghub/proposals'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const data = await listTrainingHubProposals(context, new URL(request.url))
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to list TrainingHub proposals')
  }
}

export async function POST(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const body = await request.json()
    const data = await createTrainingHubProposal(context, body)
    return NextResponse.json({ ok: true, data }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to create TrainingHub proposal')
  }
}
