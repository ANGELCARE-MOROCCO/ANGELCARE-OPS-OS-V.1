import type { SupabaseClient } from '@supabase/supabase-js'
import type { PacojacoDocumentDispatch } from './types'

export type PacojacoDispatchChannel = PacojacoDocumentDispatch['channel']

export function normalizeMoroccanPhone(value: string | null | undefined) {
  const digits = String(value || '').replace(/[^\d+]/g, '')
  if (!digits) return null

  const cleaned = digits.startsWith('+') ? digits.slice(1) : digits
  const raw = cleaned.replace(/[^\d]/g, '')
  if (!raw) return null

  if (raw.startsWith('212')) return raw
  if (raw.startsWith('00') && raw.length > 2) {
    const withoutPrefix = raw.replace(/^00+/, '')
    if (withoutPrefix.startsWith('212')) return withoutPrefix
    if (withoutPrefix.startsWith('0')) return `212${withoutPrefix.slice(1)}`
    return withoutPrefix
  }
  if (raw.startsWith('0') && raw.length > 1) return `212${raw.slice(1)}`
  if (raw.length === 9) return `212${raw}`
  return raw
}

function isMissingTableError(error: any) {
  return String(error?.code || '') === '42P01' || /does not exist/i.test(String(error?.message || ''))
}

function cleanText(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
  return text || ''
}

export async function recordPacojacoDispatch(
  supabase: SupabaseClient,
  input: {
    documentId: string
    channel: PacojacoDispatchChannel
    recipient?: string | null
    status?: string
    message?: string | null
    error?: string | null
    payload?: Record<string, any>
    createdBy?: string | null
    actorEmail?: string | null
  }
) {
  const payload = input.payload || {}
  const dispatchRow = {
    document_id: input.documentId,
    channel: input.channel,
    recipient: cleanText(input.recipient) || null,
    status: cleanText(input.status) || 'pending',
    message: cleanText(input.message) || null,
    error: cleanText(input.error) || null,
    payload,
    created_by: input.createdBy || null,
  }

  let inserted: PacojacoDocumentDispatch | null = null

  const { data, error } = await supabase.from('pacojaco_document_dispatches').insert(dispatchRow).select('*').maybeSingle()
  if (error) {
    if (!isMissingTableError(error)) {
      throw new Error(error.message)
    }
  } else {
    inserted = (data || null) as PacojacoDocumentDispatch | null
  }

  const eventPayload = {
    channel: input.channel,
    recipient: dispatchRow.recipient,
    status: dispatchRow.status,
    message: dispatchRow.message,
    error: dispatchRow.error,
    payload,
    dispatch_id: inserted?.id || null,
  }

  const { error: eventError } = await supabase.from('pacojaco_document_events').insert({
    document_id: input.documentId,
    event_type: 'document.dispatch.logged',
    actor_email: input.actorEmail || null,
    message: `${input.channel} dispatch ${dispatchRow.status}`,
    payload: eventPayload,
  })

  if (eventError && !isMissingTableError(eventError)) {
    throw new Error(eventError.message)
  }

  return inserted
}
