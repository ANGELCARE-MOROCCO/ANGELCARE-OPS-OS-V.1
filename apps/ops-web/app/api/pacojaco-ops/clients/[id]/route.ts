import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { isUuid, normalizePacojacoClientDraft } from '@/lib/pacojaco-ops/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

function isMissingTableError(error: any) {
  return String(error?.code || '') === '42P01' || /does not exist/i.test(String(error?.message || ''))
}

async function resolveId(context: Ctx) {
  const params = await context.params
  return String(params?.id || '').trim()
}

export async function GET(_request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid client id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const { data, error } = await supabase.from('pacojaco_clients').select('*').eq('id', id).maybeSingle()
    if (error) {
      if (isMissingTableError(error)) {
        return jsonError('PACOJACO clients table is not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(error.message, 500)
    }
    if (!data) return jsonError('Client not found.', 404)

    return NextResponse.json({ ok: true, client: data })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load client.', 500)
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid client id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const { data: existing, error: loadError } = await supabase.from('pacojaco_clients').select('*').eq('id', id).maybeSingle()
    if (loadError) {
      if (isMissingTableError(loadError)) {
        return jsonError('PACOJACO clients table is not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(loadError.message, 500)
    }
    if (!existing) return jsonError('Client not found.', 404)

    const body = await request.json().catch(() => ({}))
    const draft = normalizePacojacoClientDraft({ ...existing, ...body })

    if (!draft.client_name.trim()) {
      return jsonError('Client name is required.', 400)
    }

    const patch = {
      client_name: draft.client_name.trim(),
      client_company: draft.client_company || null,
      client_ice: draft.client_ice || null,
      client_email: draft.client_email || null,
      client_phone: draft.client_phone || null,
      client_address: draft.client_address || null,
      contact_name: draft.contact_name || null,
      child_name: draft.child_name || null,
      region: draft.region || null,
      zone: draft.zone || null,
      default_intervention_address: draft.default_intervention_address || null,
      default_imm: draft.default_imm || null,
      notes: draft.notes || null,
      payload: {
        ...(existing.payload || {}),
        source: 'pacojaco_ops',
        version: 1,
        raw: body || {},
      },
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('pacojaco_clients').update(patch).eq('id', id).select('*').single()
    if (error || !data) {
      if (isMissingTableError(error)) {
        return jsonError('PACOJACO clients table is not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(error?.message || 'Unable to update client.', 500)
    }

    return NextResponse.json({ ok: true, client: data })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update client.', 500)
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid client id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const { data: refs, error: refsError } = await supabase.from('pacojaco_documents').select('id').eq('client_id', id).limit(1)
    if (refsError) {
      if (isMissingTableError(refsError)) {
        return jsonError('PACOJACO tables are not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(refsError.message, 500)
    }

    if (refs && refs.length > 0) {
      return jsonError('This client is linked to documents. Clear document links before deleting the client.', 409)
    }

    const { error } = await supabase.from('pacojaco_clients').delete().eq('id', id)
    if (error) {
      if (isMissingTableError(error)) {
        return jsonError('PACOJACO clients table is not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(error.message, 500)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to delete client.', 500)
  }
}
