import { NextResponse } from 'next/server'
import { saveAgentDocument } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      documentType?: string
      status?: string
      expiresAt?: string | null
      fileUrl?: string | null
      reviewStatus?: string
      metadata?: Record<string, unknown>
    }
    const session = await requireCareLinkMobileAgent('can_view_missions')
    if (!body.documentType || !String(body.documentType).trim()) return NextResponse.json({ ok: false, error: 'Le type de document est requis.' }, { status: 400 })
    const data = await saveAgentDocument({
      caregiverId: session.caregiverId,
      documentType: String(body.documentType),
      status: body.status || 'pending',
      expiresAt: body.expiresAt ?? null,
      fileUrl: body.fileUrl ?? null,
      reviewStatus: body.reviewStatus || 'pending',
      metadata: body.metadata || {},
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Document save failed')
  }
}
