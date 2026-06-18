import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { calculatePacojacoStats } from '@/lib/pacojaco-ops/calculations'
import { generatePacojacoDocumentNumber } from '@/lib/pacojaco-ops/numbering'
import { hasPacojacoOpsAccess, normalizePacojacoUser } from '@/lib/pacojaco-ops/security'
import { normalizePacojacoBody, normalizeText } from '@/lib/pacojaco-ops/validation'
import type { PacojacoDocumentRow, PacojacoDocumentType } from '@/lib/pacojaco-ops/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

function isValidType(value: string | null): value is PacojacoDocumentType {
  return value === 'invoice' || value === 'quote'
}

function parseLimit(value: string | null) {
  const parsed = Number(value || 120)
  if (!Number.isFinite(parsed)) return 120
  return Math.min(Math.max(Math.floor(parsed), 1), 500)
}

function parseAmount(value: string | null) {
  if (value == null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isMissingTableError(error: any) {
  return String(error?.code || '') === '42P01' || /does not exist/i.test(String(error?.message || ''))
}

function isMissingColumnError(error: any) {
  return String(error?.code || '') === '42703' || /column .* does not exist/i.test(String(error?.message || ''))
}

function textIncludes(row: PacojacoDocumentRow, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    row.document_number,
    row.client_name,
    row.client_company,
    row.contact_name,
    row.object,
    row.client_email,
    row.client_phone,
  ]
    .map((value) => normalizeText(value, '') || '')
    .join(' | ')
    .toLowerCase()

  return haystack.includes(needle)
}

async function loadRowsForStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const withClientId = await supabase
    .from('pacojaco_documents')
    .select('document_type,status,total_ttc,remaining_amount,issue_date,client_id')
    .order('updated_at', { ascending: false })

  if (!withClientId.error) return (withClientId.data || []) as any[]
  if (isMissingColumnError(withClientId.error)) {
    const fallback = await supabase
      .from('pacojaco_documents')
      .select('document_type,status,total_ttc,remaining_amount,issue_date')
      .order('updated_at', { ascending: false })
    if (fallback.error) throw new Error(fallback.error.message)
    return (fallback.data || []) as any[]
  }

  throw new Error(withClientId.error.message)
}

async function loadClientStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const [clientsRes, linkedRes] = await Promise.all([
      supabase.from('pacojaco_clients').select('id', { count: 'exact', head: true }),
      supabase.from('pacojaco_documents').select('id', { count: 'exact', head: true }).not('client_id', 'is', null),
    ])

    if (clientsRes.error) {
      if (isMissingTableError(clientsRes.error) || isMissingColumnError(clientsRes.error)) {
        return {
          totalClients: 0,
          documentsLinkedToClients: 0,
        }
      }
      throw clientsRes.error
    }

    if (linkedRes.error) {
      if (isMissingTableError(linkedRes.error) || isMissingColumnError(linkedRes.error)) {
        return {
          totalClients: clientsRes.count || 0,
          documentsLinkedToClients: 0,
        }
      }
      throw linkedRes.error
    }

    return {
      totalClients: clientsRes.count || 0,
      documentsLinkedToClients: linkedRes.count || 0,
    }
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        totalClients: 0,
        documentsLinkedToClients: 0,
      }
    }
    throw error
  }
}

async function syncInterventions(supabase: Awaited<ReturnType<typeof createClient>>, documentId: string, incoming: any[]) {
  const validRows = (Array.isArray(incoming) ? incoming : [])
    .map((item, index) => ({
      id: normalizeText(item?.id, null),
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
    .filter((item) =>
      [item.title, item.service_type, item.region, item.zone, item.address, item.contact_name, item.imm, item.service_dates_text, item.schedule_text, item.notes].some(
        (value) => String(value || '').trim().length > 0
      )
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, index) => ({ ...item, sort_order: index }))

  const { data: existing, error: existingError } = await supabase
    .from('pacojaco_document_interventions')
    .select('id')
    .eq('document_id', documentId)

  if (existingError) {
    if (isMissingTableError(existingError)) {
      if (validRows.length) {
        throw new Error('PACOJACO interventions table is not ready yet. Apply the PACOJACO migration first.')
      }
      return validRows
    }
    throw new Error(existingError.message)
  }

  if (validRows.length === 0) {
    if (existing?.length) {
      const { error } = await supabase.from('pacojaco_document_interventions').delete().eq('document_id', documentId)
      if (error) throw new Error(error.message)
    }
    return []
  }

  const incomingIds = new Set(validRows.map((row) => row.id).filter(Boolean))
  const existingIds = (existing || []).map((row: any) => String(row.id))
  const staleIds = existingIds.filter((itemId) => !incomingIds.has(itemId))

  if (staleIds.length) {
    const { error } = await supabase.from('pacojaco_document_interventions').delete().in('id', staleIds)
    if (error) throw new Error(error.message)
  }

  for (const row of validRows.filter((entry) => entry.id)) {
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

  const newRows = validRows.filter((entry) => !entry.id).map((row) => ({
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

  return validRows
}

async function loadDocumentRelations(supabase: Awaited<ReturnType<typeof createClient>>, documentId: string, clientId: string | null) {
  const [itemsRes, eventsRes, interventionsRes, clientRes] = await Promise.all([
    supabase.from('pacojaco_document_items').select('*').eq('document_id', documentId).order('sort_order', { ascending: true }),
    supabase.from('pacojaco_document_events').select('*').eq('document_id', documentId).order('created_at', { ascending: false }),
    supabase.from('pacojaco_document_interventions').select('*').eq('document_id', documentId).order('sort_order', { ascending: true }),
    clientId ? supabase.from('pacojaco_clients').select('*').eq('id', clientId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ])

  if (itemsRes.error) throw new Error(itemsRes.error.message)
  if (eventsRes.error) throw new Error(eventsRes.error.message)
  if (interventionsRes.error && !isMissingTableError(interventionsRes.error)) throw new Error(interventionsRes.error.message)
  if (clientRes && 'error' in clientRes && clientRes.error && !isMissingTableError(clientRes.error)) throw new Error(clientRes.error.message)

  return {
    items: (itemsRes.data || []) as any[],
    events: (eventsRes.data || []) as any[],
    interventions: (interventionsRes.data || []) as any[],
    client: (clientRes && 'data' in clientRes ? clientRes.data : null) || null,
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    const actor = normalizePacojacoUser(user)

    if (!actor.id || !hasPacojacoOpsAccess(user)) {
      return jsonError('Unauthorized', 403)
    }

    const supabase = await createClient()
    const params = new URL(request.url).searchParams
    const q = normalizeText(params.get('q'), '') || ''
    const documentType = params.get('document_type')
    const status = params.get('status')
    const dateFrom = params.get('date_from')
    const dateTo = params.get('date_to')
    const limit = parseLimit(params.get('limit'))
    const minAmount = parseAmount(params.get('min_amount'))
    const maxAmount = parseAmount(params.get('max_amount'))

    let query = supabase.from('pacojaco_documents').select('*').order('updated_at', { ascending: false })
    if (isValidType(documentType)) query = query.eq('document_type', documentType)
    if (status && status !== 'all') query = query.eq('status', status)
    if (dateFrom) query = query.gte('issue_date', dateFrom)
    if (dateTo) query = query.lte('issue_date', dateTo)
    if (minAmount != null) query = query.gte('total_ttc', minAmount)
    if (maxAmount != null) query = query.lte('total_ttc', maxAmount)
    query = query.limit(limit)

    const [statsRowsRes, documentsRes, clientStats] = await Promise.all([loadRowsForStats(supabase), query, loadClientStats(supabase)])

    if ('error' in documentsRes && documentsRes.error) {
      return jsonError(documentsRes.error.message, 500)
    }

    const documents = ((documentsRes as any).data || []) as PacojacoDocumentRow[]
    const filteredDocuments = q ? documents.filter((doc) => textIncludes(doc, q)) : documents
    const stats = {
      ...calculatePacojacoStats((statsRowsRes || []) as PacojacoDocumentRow[]),
      ...clientStats,
    }

    return NextResponse.json({
      ok: true,
      documents: filteredDocuments,
      stats,
      meta: {
        limit,
        returned: filteredDocuments.length,
        query: q || null,
      },
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load PACOJACO documents.', 500)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!hasPacojacoOpsAccess(user)) {
      return jsonError('Unauthorized', 403)
    }

    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    const normalized = normalizePacojacoBody(body, body?.document_type === 'quote' ? 'quote' : 'invoice')
    const documentNumberInput = normalizeText(body?.document_number, null)
    const document_number =
      documentNumberInput ||
      (await generatePacojacoDocumentNumber(supabase, normalized.document.document_type, Number(normalized.document.issue_date.slice(0, 4))))

    if (!normalized.document.client_name) {
      return jsonError('Client name is required.', 400)
    }

    if (normalized.document.status !== 'draft' && normalized.items.length === 0) {
      return jsonError('At least one item is required before issuing a document.', 400)
    }

    const payload = {
      ...normalized.document,
      document_number,
      created_by: user?.id || null,
      updated_at: new Date().toISOString(),
    }

    const { data: document, error } = await supabase.from('pacojaco_documents').insert(payload).select('*').single()

    if (error || !document) {
      return jsonError(error?.message || 'Unable to create PACOJACO document.', error?.code === '23505' ? 409 : 500, {
        details: error || null,
      })
    }

    if (normalized.items.length) {
      const itemsPayload = normalized.items.map((item) => ({
        document_id: document.id,
        sort_order: item.sort_order,
        ref: item.ref,
        designation: item.designation,
        description: item.description,
        category: item.category || 'SVC',
        unit_price: item.unit_price,
        quantity: item.quantity,
        unit: item.unit,
        total: item.total,
      }))
      const { error: itemsError } = await supabase.from('pacojaco_document_items').insert(itemsPayload)
      if (itemsError) {
        return jsonError(itemsError.message, 500)
      }
    }

    try {
      await syncInterventions(supabase, document.id, normalized.interventions)
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : 'Unable to save interventions.', 500)
    }

    await supabase.from('pacojaco_document_events').insert({
      document_id: document.id,
      event_type: 'document.created',
      actor_email: user?.email || user?.username || null,
      message: `Document ${document_number} created`,
      payload: {
        document_number,
        document_type: document.document_type,
        status: document.status,
        total_ttc: document.total_ttc,
      },
    })

    const [{ data: items }, relations] = await Promise.all([
      supabase.from('pacojaco_document_items').select('*').eq('document_id', document.id).order('sort_order', { ascending: true }),
      loadDocumentRelations(supabase, document.id, document.client_id),
    ])

    return NextResponse.json(
      {
        ok: true,
        document: {
          ...document,
          items: items || [],
          interventions: relations.interventions || [],
          events: relations.events || [],
          client: relations.client || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (isMissingTableError(error)) {
      return jsonError(
        'PACOJACO documents tables are not ready yet. Apply the PACOJACO migration before creating documents.',
        500
      )
    }
    return jsonError(error instanceof Error ? error.message : 'Unable to create PACOJACO document.', 500)
  }
}
