import type { SupabaseClient } from '@supabase/supabase-js'
import type { PacojacoDocumentRow } from './types'

export function isMissingTableError(error: any) {
  return String(error?.code || '') === '42P01' || /does not exist/i.test(String(error?.message || ''))
}

export async function loadPacojacoDocumentRelations(
  supabase: SupabaseClient,
  id: string,
  options: { includeDispatches?: boolean } = {}
) {
  const { data: document, error: documentError } = await supabase.from('pacojaco_documents').select('*').eq('id', id).maybeSingle()

  if (documentError) throw new Error(documentError.message)
  if (!document) return null

  const [itemsRes, eventsRes, interventionsRes, dispatchesRes, clientRes] = await Promise.all([
    supabase.from('pacojaco_document_items').select('*').eq('document_id', id).order('sort_order', { ascending: true }),
    supabase.from('pacojaco_document_events').select('*').eq('document_id', id).order('created_at', { ascending: false }),
    supabase.from('pacojaco_document_interventions').select('*').eq('document_id', id).order('sort_order', { ascending: true }),
    options.includeDispatches === false
      ? Promise.resolve({ data: [], error: null })
      : supabase.from('pacojaco_document_dispatches').select('*').eq('document_id', id).order('created_at', { ascending: false }),
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

