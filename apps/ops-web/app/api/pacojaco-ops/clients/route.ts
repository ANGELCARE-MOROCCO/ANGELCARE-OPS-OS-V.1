import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { isUuid, normalizePacojacoClientDraft, normalizeText } from '@/lib/pacojaco-ops/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

function isMissingTableError(error: any) {
  return String(error?.code || '') === '42P01' || /does not exist/i.test(String(error?.message || ''))
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const params = new URL(request.url).searchParams
    const q = normalizeText(params.get('q'), '') || ''
    const limit = Math.min(Math.max(Number(params.get('limit') || 100) || 100, 1), 500)

    let query = supabase.from('pacojaco_clients').select('*').order('updated_at', { ascending: false }).limit(limit)
    if (q) {
      query = query.or(
        [
          `client_name.ilike.%${q}%`,
          `client_company.ilike.%${q}%`,
          `client_phone.ilike.%${q}%`,
          `client_email.ilike.%${q}%`,
          `contact_name.ilike.%${q}%`,
        ].join(',')
      )
    }

    const { data, error } = await query
    if (error) {
      if (isMissingTableError(error)) {
        return jsonError('PACOJACO clients table is not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(error.message, 500)
    }

    return NextResponse.json({ ok: true, clients: data || [] })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load PACOJACO clients.', 500)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    const draft = normalizePacojacoClientDraft(body)

    if (!draft.client_name.trim()) {
      return jsonError('Client name is required.', 400)
    }

    const payload = {
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
        source: 'pacojaco_ops',
        version: 1,
        raw: body || {},
      },
      created_by: user?.id || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('pacojaco_clients').insert(payload).select('*').single()
    if (error || !data) {
      if (isMissingTableError(error)) {
        return jsonError('PACOJACO clients table is not ready yet. Apply the PACOJACO migration first.', 500)
      }
      return jsonError(error?.message || 'Unable to create client.', error?.code === '23505' ? 409 : 500)
    }

    return NextResponse.json({ ok: true, client: data }, { status: 201 })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create PACOJACO client.', 500)
  }
}
