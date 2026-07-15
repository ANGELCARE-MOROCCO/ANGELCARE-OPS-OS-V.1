import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import { normalizePacojacoBody, normalizeText, isUuid } from '@/lib/pacojaco-ops/validation'
import type { PacojacoDocumentRow } from '@/lib/pacojaco-ops/types'

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

async function loadDocument(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data: document, error: documentError } = await supabase.from('pacojaco_documents').select('*').eq('id', id).maybeSingle()

  if (documentError) throw new Error(documentError.message)
  if (!document) return null

  const [itemsRes, eventsRes, interventionsRes, dispatchesRes, clientRes] = await Promise.all([
    supabase.from('pacojaco_document_items').select('*').eq('document_id', id).order('sort_order', { ascending: true }),
    supabase.from('pacojaco_document_events').select('*').eq('document_id', id).order('created_at', { ascending: false }),
    supabase.from('pacojaco_document_interventions').select('*').eq('document_id', id).order('sort_order', { ascending: true }),
    supabase.from('pacojaco_document_dispatches').select('*').eq('document_id', id).order('created_at', { ascending: false }),
    document.client_id ? supabase.from('pacojaco_clients').select('*').eq('id', document.client_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ])

  if (itemsRes.error) throw new Error(itemsRes.error.message)
  if (eventsRes.error) throw new Error(eventsRes.error.message)
  if (interventionsRes.error && !isMissingTableError(interventionsRes.error)) throw new Error(interventionsRes.error.message)
  if (dispatchesRes.error && !isMissingTableError(dispatchesRes.error)) throw new Error(dispatchesRes.error.message)
  if (clientRes && 'error' in clientRes && clientRes.error && !isMissingTableError(clientRes.error)) throw new Error(clientRes.error.message)

  return {
    ...(document as PacojacoDocumentRow),
    items: (itemsRes.data || []) as any[],
    events: (eventsRes.data || []) as any[],
    interventions: (interventionsRes.data || []) as any[],
    dispatches: (dispatchesRes.data || []) as any[],
    client: (clientRes && 'data' in clientRes ? clientRes.data : null) || null,
  }
}

async function syncItems(supabase: Awaited<ReturnType<typeof createClient>>, documentId: string, incoming: any[]) {
  const validItems = incoming
    .filter((item) => String(item?.designation || '').trim().length > 0)
    .map((item, index) => ({
      id: isUuid(item?.id) ? String(item.id) : null,
      document_id: documentId,
      sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : index,
      ref: normalizeText(item?.ref, null),
      designation: String(item.designation || '').trim(),
      description: normalizeText(item?.description, null),
      category: normalizeText(item?.category, 'SVC') || 'SVC',
      unit_price: Number.isFinite(Number(item?.unit_price)) ? Number(item.unit_price) : 0,
      quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 1,
      unit: normalizeText(item?.unit, null),
      total: Number.isFinite(Number(item?.total)) ? Number(item.total) : 0,
    }))

  const { data: existing } = await supabase.from('pacojaco_document_items').select('id').eq('document_id', documentId)

  const incomingIds = new Set(validItems.map((item) => item.id).filter(Boolean) as string[])
  const existingIds = (existing || []).map((row: any) => String(row.id))
  const staleIds = existingIds.filter((itemId) => !incomingIds.has(itemId))

  if (staleIds.length) {
    const { error } = await supabase.from('pacojaco_document_items').delete().in('id', staleIds)
    if (error) throw new Error(error.message)
  }

  for (const item of validItems.filter((entry) => entry.id)) {
    const { error } = await supabase
      .from('pacojaco_document_items')
      .update({
        sort_order: item.sort_order,
        ref: item.ref,
        designation: item.designation,
        description: item.description,
        category: item.category,
        unit_price: item.unit_price,
        quantity: item.quantity,
        unit: item.unit,
        total: item.total,
      })
      .eq('id', item.id)
      .eq('document_id', documentId)
    if (error) throw new Error(error.message)
  }

  const newRows = validItems.filter((entry) => !entry.id).map((item) => ({
    document_id: documentId,
    sort_order: item.sort_order,
    ref: item.ref,
    designation: item.designation,
    description: item.description,
    category: item.category,
    unit_price: item.unit_price,
    quantity: item.quantity,
    unit: item.unit,
    total: item.total,
  }))

  if (newRows.length) {
    const { error } = await supabase.from('pacojaco_document_items').insert(newRows)
    if (error) throw new Error(error.message)
  }

  return validItems
}

async function syncInterventions(supabase: Awaited<ReturnType<typeof createClient>>, documentId: string, incoming: any[]) {
  const rows = (Array.isArray(incoming) ? incoming : [])
    .filter((item) =>
      [item?.title, item?.service_type, item?.region, item?.zone, item?.address, item?.contact_name, item?.imm, item?.service_dates_text, item?.schedule_text, item?.notes].some(
        (value) => String(value || '').trim().length > 0
      )
    )
    .map((item, index) => ({
      id: isUuid(item?.id) ? String(item.id) : null,
      document_id: documentId,
      sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : index,
      title: normalizeText(item?.title, null),
      service_type: normalizeText(item?.service_type, null),
      region: normalizeText(item?.region, null),
      zone: normalizeText(item?.zone, null),
      address: normalizeText(item?.address, null),
      contact_name: normalizeText(item?.contact_name, null),
      imm: normalizeText(item?.imm, null),
      service_dates_text: normalizeText(item?.service_dates_text, null),
      schedule_text: normalizeText(item?.schedule_text, null),
      notes: normalizeText(item?.notes, null),
      payload: {
        source: 'pacojaco_ops',
        version: 1,
        raw: item || {},
      },
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, index) => ({ ...item, sort_order: index }))

  const { data: existing, error: existingError } = await supabase
    .from('pacojaco_document_interventions')
    .select('id')
    .eq('document_id', documentId)

  if (existingError) {
    if (isMissingTableError(existingError)) {
      if (rows.length) {
        throw new Error('PACOJACO interventions table is not ready yet. Apply the PACOJACO migration first.')
      }
      return rows
    }
    throw new Error(existingError.message)
  }

  const incomingIds = new Set(rows.map((row) => row.id).filter(Boolean) as string[])
  const existingIds = (existing || []).map((row: any) => String(row.id))
  const staleIds = existingIds.filter((itemId) => !incomingIds.has(itemId))

  if (staleIds.length) {
    const { error } = await supabase.from('pacojaco_document_interventions').delete().in('id', staleIds)
    if (error) throw new Error(error.message)
  }

  for (const row of rows.filter((entry) => entry.id)) {
    const { error } = await supabase
      .from('pacojaco_document_interventions')
      .update({
        sort_order: row.sort_order,
        title: row.title,
        service_type: row.service_type,
        region: row.region,
        zone: row.zone,
        address: row.address,
        contact_name: row.contact_name,
        imm: row.imm,
        service_dates_text: row.service_dates_text,
        schedule_text: row.schedule_text,
        notes: row.notes,
        payload: row.payload,
      })
      .eq('id', row.id)
      .eq('document_id', documentId)
    if (error) throw new Error(error.message)
  }

  const newRows = rows.filter((entry) => !entry.id).map((row) => ({
    document_id: documentId,
    sort_order: row.sort_order,
    title: row.title,
    service_type: row.service_type,
    region: row.region,
    zone: row.zone,
    address: row.address,
    contact_name: row.contact_name,
    imm: row.imm,
    service_dates_text: row.service_dates_text,
    schedule_text: row.schedule_text,
    notes: row.notes,
    payload: row.payload,
  }))

  if (newRows.length) {
    const { error } = await supabase.from('pacojaco_document_interventions').insert(newRows)
    if (error) throw new Error(error.message)
  }

  return rows
}

export async function GET(_request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const document = await loadDocument(supabase, id)
    if (!document) return jsonError('Document not found.', 404)

    return NextResponse.json({ ok: true, document })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load document.', 500)
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const existing = await loadDocument(supabase, id)
    if (!existing) return jsonError('Document not found.', 404)
    if (existing.status === 'cancelled') return jsonError('Cancelled documents are read-only.', 409)

    const body = await request.json().catch(() => ({}))
    const merged = {
      ...existing,
      ...body,
      document_type: body.document_type || existing.document_type,
      items: Array.isArray(body.items) ? body.items : existing.items || [],
      interventions: Array.isArray(body.interventions) ? body.interventions : existing.interventions || [],
    }

    const normalized = normalizePacojacoBody(merged, existing.document_type)
    const document_number = normalizeText(body.document_number, null) || existing.document_number

    if (!normalized.document.client_name) {
      return jsonError('Client name is required.', 400)
    }

    if (normalized.document.status !== 'draft' && normalized.items.length === 0) {
      return jsonError('At least one item is required before issuing a document.', 400)
    }

    const patch = {
      ...normalized.document,
      document_number,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error } = await supabase
      .from('pacojaco_documents')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !updated) {
      return jsonError(error?.message || 'Unable to update document.', error?.code === '23505' ? 409 : 500, {
        details: error || null,
      })
    }

    const syncedItems = await syncItems(supabase, id, normalized.items)
    await syncInterventions(supabase, id, normalized.interventions)

    await supabase.from('pacojaco_document_events').insert({
      document_id: id,
      event_type: 'document.updated',
      actor_email: user?.email || user?.username || null,
      message: `Document ${document_number} updated`,
      payload: {
        document_number,
        document_type: updated.document_type,
        status: updated.status,
        item_count: syncedItems.length,
        total_ttc: updated.total_ttc,
      },
    })

    const document = await loadDocument(supabase, id)
    return NextResponse.json({ ok: true, document })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update document.', 500)
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const id = await resolveId(context)
    if (!isUuid(id)) return jsonError('Invalid document id.', 400)

    const user = await getCurrentUser()
    if (!hasPacojacoOpsAccess(user)) return jsonError('Unauthorized', 403)

    const supabase = await createClient()
    const existing = await loadDocument(supabase, id)
    if (!existing) return jsonError('Document not found.', 404)

    await supabase.from('pacojaco_document_events').insert({
      document_id: id,
      event_type: 'document.deleted',
      actor_email: user?.email || user?.username || null,
      message: `Document ${existing.document_number} deleted`,
      payload: {
        document_number: existing.document_number,
        document_type: existing.document_type,
        status: existing.status,
      },
    })

    const { error } = await supabase.from('pacojaco_documents').delete().eq('id', id)
    if (error) return jsonError(error.message, 500)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to delete document.', 500)
  }
}
