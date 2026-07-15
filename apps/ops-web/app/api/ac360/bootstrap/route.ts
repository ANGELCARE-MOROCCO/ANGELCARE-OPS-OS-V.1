import { NextResponse } from 'next/server'
import { bootstrapAc360FoundationOrg } from '@/lib/ac360/runtime'

export const dynamic = 'force-dynamic'

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  return response
}

export async function GET() {
  return json({
    ok: true,
    route: '/api/ac360/bootstrap',
    method: 'POST',
    purpose: 'Create or repair the live AC360 organization, campus, owner membership, active subscription, base item and credit wallet.',
    defaultBody: {
      orgCode: 'ANGELCARE360-INTERNAL',
      displayName: 'AngelCare 360 Internal Command',
      planKey: 'command',
      city: 'Temara',
      status: 'active',
    },
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await bootstrapAc360FoundationOrg({
    orgCode: body.orgCode,
    displayName: body.displayName,
    ownerEmail: body.ownerEmail,
    planKey: body.planKey,
    city: body.city,
    status: body.status,
  })
  return json(result, { status: result.ok ? 200 : (result as any).status || 500 })
}
