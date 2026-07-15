import { NextResponse } from 'next/server'
import { executeAc360DirectionCockpitCommand, getAc360DirectionCockpitProductionDashboard } from '@/lib/ac360/customer-direction-cockpit-production'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId') || undefined
  const view = url.searchParams.get('view') || undefined
  const result = await getAc360DirectionCockpitProductionDashboard({ orgId, view })
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await executeAc360DirectionCockpitCommand(body)
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await executeAc360DirectionCockpitCommand(body)
  return json(result, { status: (result as any).ok ? 200 : (result as any).status || 500 })
}
