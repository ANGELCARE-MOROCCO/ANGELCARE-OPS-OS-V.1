import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { executeCareLinkMobileMissionAction, parseCareLinkMobileActionBody } from '@/lib/carelink/mobile-action-engine'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await parseCareLinkMobileActionBody(request)
    const result = await executeCareLinkMobileMissionAction({
      request,
      missionId: Number(id),
      action: 'request_replacement',
      body,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Replacement request failed')
  }
}
