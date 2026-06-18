import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { isUuid } from '@/lib/pacojaco-ops/validation'
import { loadPacojacoDocumentRelations } from '@/lib/pacojaco-ops/server'
import { recordPacojacoDispatch } from '@/lib/pacojaco-ops/dispatch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

const ALLOWED_CHANNELS = new Set(['email', 'whatsapp', 'download', 'print'])

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function resolveId(context: Ctx) {
  const params = await context.params
  return String(params?.id || '').trim()
}

export async function POST(request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const body = await request.json().catch(() => ({}))
    const channel = String(body?.channel || '').trim()
    if (!ALLOWED_CHANNELS.has(channel)) return jsonError('Invalid dispatch channel.', 400)

    const supabase = await createClient()
    const document = await loadPacojacoDocumentRelations(supabase, id, { includeDispatches: false })
    if (!document) return jsonError('Document not found.', 404)

    const dispatch = await recordPacojacoDispatch(supabase, {
      documentId: id,
      channel: channel as any,
      recipient: String(body?.recipient || '').trim() || null,
      status: String(body?.status || 'pending').trim() || 'pending',
      message: String(body?.message || '').trim() || null,
      error: String(body?.error || '').trim() || null,
      payload: {
        ...(body?.payload || {}),
        document_number: document.document_number,
        document_type: document.document_type,
      },
      createdBy: user?.id || null,
      actorEmail: user?.email || user?.username || null,
    })

    return NextResponse.json({ ok: true, dispatch })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to log dispatch.', 500)
  }
}

