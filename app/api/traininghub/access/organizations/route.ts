import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'
import { createTrainingHubOrganization, listTrainingHubOrganizations } from '@/lib/traininghub/access'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const data = await listTrainingHubOrganizations(context, new URL(request.url))
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to list TrainingHub organizations')
  }
}

export async function POST(request: Request) {
  try {
    const context = await getTrainingHubContext()
    const body = await request.json().catch(() => ({}))
    const data = await createTrainingHubOrganization(context, body)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to create TrainingHub organization')
  }
}
