import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { isUuid, normalizeText } from '@/lib/pacojaco-ops/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
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
    const status = normalizeText(body?.status, '') || ''
    const allowed = new Set(['draft', 'issued', 'sent', 'accepted', 'rejected', 'paid', 'partially_paid', 'cancelled'])
    if (!allowed.has(status)) return jsonError('Invalid status.', 400)

    const supabase = await createClient()
    const { data: existing, error: loadError } = await supabase.from('pacojaco_documents').select('*').eq('id', id).maybeSingle()
    if (loadError) return jsonError(loadError.message, 500)
    if (!existing) return jsonError('Document not found.', 404)

    if (existing.status === 'cancelled' && status !== 'cancelled') {
      return jsonError('Cancelled documents are read-only.', 409)
    }

    const { data, error } = await supabase
      .from('pacojaco_documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) return jsonError(error.message, 500)

    await supabase.from('pacojaco_document_events').insert({
      document_id: id,
      event_type: 'document.status_changed',
      actor_email: user?.email || user?.username || null,
      message: `Document ${data.document_number} status changed to ${status}`,
      payload: {
        previous_status: existing.status,
        next_status: status,
        document_number: data.document_number,
      },
    })

    return NextResponse.json({ ok: true, document: data })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to change status.', 500)
  }
}
