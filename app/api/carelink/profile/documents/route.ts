import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { saveAgentDocument } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      caregiverId?: number
      documentType?: string
      status?: string
      expiresAt?: string | null
      fileUrl?: string | null
      reviewStatus?: string
      metadata?: Record<string, unknown>
    }
    const workspace = await loadCarelinkMobileWorkspace()
    const caregiverId = body.caregiverId || (workspace.agent?.id ? Number(workspace.agent.id) : null)
    if (!caregiverId) return NextResponse.json({ ok: false, error: 'Profil agent introuvable.' }, { status: 400 })
    if (!body.documentType || !String(body.documentType).trim()) return NextResponse.json({ ok: false, error: 'Le type de document est requis.' }, { status: 400 })
    const data = await saveAgentDocument({
      caregiverId,
      documentType: String(body.documentType),
      status: body.status || 'pending',
      expiresAt: body.expiresAt ?? null,
      fileUrl: body.fileUrl ?? null,
      reviewStatus: body.reviewStatus || 'pending',
      metadata: body.metadata || {},
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Document save failed' }, { status: 500 })
  }
}
