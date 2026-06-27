import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions')
    return NextResponse.json({ ok: true, data: session.caregiver, access: session.access }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink agent profile loading failed')
  }
}
