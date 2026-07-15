import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { generatePacojacoDocumentNumber } from '@/lib/pacojaco-ops/numbering'
import { isUuid, normalizeText } from '@/lib/pacojaco-ops/validation'
import { round2 } from '@/lib/pacojaco-ops/calculations'

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

export async function POST(_request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const { data: source, error: sourceError } = await supabase.from('pacojaco_documents').select('*').eq('id', id).maybeSingle()
    if (sourceError) return jsonError(sourceError.message, 500)
    if (!source) return jsonError('Document not found.', 404)

    const [sourceItemsRes, sourceInterventionsRes] = await Promise.all([
      supabase.from('pacojaco_document_items').select('*').eq('document_id', id).order('sort_order', { ascending: true }),
      supabase.from('pacojaco_document_interventions').select('*').eq('document_id', id).order('sort_order', { ascending: true }),
    ])

    if (sourceItemsRes.error) return jsonError(sourceItemsRes.error.message, 500)
    if (sourceInterventionsRes.error && !isMissingTableError(sourceInterventionsRes.error)) {
      return jsonError(sourceInterventionsRes.error.message, 500)
    }

    const documentNumber = await generatePacojacoDocumentNumber(
      supabase,
      source.document_type,
      Number(String(source.issue_date || new Date().toISOString()).slice(0, 4))
    )

    const { id: _sourceId, created_at, updated_at, document_number: _sourceNumber, status: _sourceStatus, ...rest } = source as any

    const payload = {
      ...rest,
      document_type: source.document_type,
      document_number: documentNumber,
      status: 'draft',
      created_by: user?.id || null,
      issue_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
      payload: {
        ...(source.payload || {}),
        duplicated_from: source.id,
      },
    }

    const { data: duplicated, error } = await supabase.from('pacojaco_documents').insert(payload).select('*').single()
    if (error || !duplicated) {
      return jsonError(error?.message || 'Unable to duplicate document.', error?.code === '23505' ? 409 : 500)
    }

    const itemsPayload = (sourceItemsRes.data || []).map((item: any, index: number) => ({
      document_id: duplicated.id,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
      ref: normalizeText(item.ref, null),
      designation: String(item.designation || '').trim(),
      description: normalizeText(item.description, null),
      category: normalizeText(item.category, 'SVC') || 'SVC',
      unit_price: round2(item.unit_price),
      quantity: round2(item.quantity || 1),
      unit: normalizeText(item.unit, null),
      total: round2(item.total),
    }))

    if (itemsPayload.length) {
      const { error: insertItemsError } = await supabase.from('pacojaco_document_items').insert(itemsPayload)
      if (insertItemsError) return jsonError(insertItemsError.message, 500)
    }

    const interventionsPayload = (sourceInterventionsRes.data || []).map((item: any, index: number) => ({
      document_id: duplicated.id,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
      title: normalizeText(item.title, null),
      service_type: normalizeText(item.service_type, null),
      region: normalizeText(item.region, null),
      zone: normalizeText(item.zone, null),
      address: normalizeText(item.address, null),
      contact_name: normalizeText(item.contact_name, null),
      imm: normalizeText(item.imm, null),
      service_dates_text: normalizeText(item.service_dates_text, null),
      schedule_text: normalizeText(item.schedule_text, null),
      notes: normalizeText(item.notes, null),
      payload: {
        ...(item.payload || {}),
        duplicated_from: item.id,
      },
    }))

    if (interventionsPayload.length) {
      const { error: insertInterventionsError } = await supabase.from('pacojaco_document_interventions').insert(interventionsPayload)
      if (insertInterventionsError) return jsonError(insertInterventionsError.message, 500)
    }

    await supabase.from('pacojaco_document_events').insert({
      document_id: duplicated.id,
      event_type: 'document.duplicated',
      actor_email: user?.email || user?.username || null,
      message: `Document duplicated from ${source.document_number}`,
      payload: {
        source_document_id: source.id,
        source_document_number: source.document_number,
        new_document_number: documentNumber,
      },
    })

    const [items, interventions, client] = await Promise.all([
      supabase.from('pacojaco_document_items').select('*').eq('document_id', duplicated.id).order('sort_order', { ascending: true }),
      supabase.from('pacojaco_document_interventions').select('*').eq('document_id', duplicated.id).order('sort_order', { ascending: true }),
      duplicated.client_id ? supabase.from('pacojaco_clients').select('*').eq('id', duplicated.client_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ])

    if (items.error) return jsonError(items.error.message, 500)
    if (interventions.error && !isMissingTableError(interventions.error)) return jsonError(interventions.error.message, 500)
    if (client && 'error' in client && client.error && !isMissingTableError(client.error)) return jsonError(client.error.message, 500)

    return NextResponse.json(
      {
        ok: true,
        document: {
          ...duplicated,
          items: items.data || [],
          interventions: interventions.data || [],
          client: (client && 'data' in client ? client.data : null) || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to duplicate document.', 500)
  }
}
