import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeQuotePayload, validateQuotePayload } from '@/lib/b2b-marketplace/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const payload = normalizeQuotePayload(body)
  const errors = validateQuotePayload(payload)
  if (errors.length) return NextResponse.json({ ok: false, error: errors.join(', ') }, { status: 400 })

  const reference = `AC-B2B-QUOTE-${Date.now().toString(36).toUpperCase()}`
  const estimatedTotal = payload.lines.reduce((sum, line) => sum + line.quantity * line.estimatedUnitPriceMad, 0)

  try {
    const supabase = await createClient()
    const { data: quote, error } = await supabase
      .from('b2b_marketplace_quote_requests')
      .insert({
        quote_reference: reference,
        school_name: payload.schoolName,
        contact_name: payload.contactName,
        phone: payload.phone,
        email: payload.email,
        city: payload.city,
        message: payload.message || null,
        status: 'new_request',
        estimated_total_mad: estimatedTotal,
        source: String(body.source || 'public_marketplace'),
        request_type: String(body.requestType || body.request_type || 'quote_cart'),
        priority: String(body.priority || 'normal'),
        source_page: String(body.sourcePage || body.source_page || ''),
        origin_url: String(body.originUrl || body.origin_url || request.headers.get('referer') || ''),
      })
      .select('id, quote_reference')
      .single()

    if (error) throw error

    const lines = payload.lines.map((line) => ({
      quote_request_id: quote.id,
      item_type: line.itemType,
      reference_code: line.reference,
      title: line.title,
      quantity: line.quantity,
      estimated_unit_price_mad: line.estimatedUnitPriceMad,
      personalization_notes: line.personalizationNotes || null,
    }))

    const { error: lineError } = await supabase.from('b2b_marketplace_quote_lines').insert(lines)
    if (lineError) throw lineError

    try {
      await supabase.from('b2b_marketplace_quote_status_history').insert({
        quote_request_id: quote.id,
        from_status: null,
        to_status: 'new_request',
        changed_by_name: 'Public Marketplace',
        note: 'Demande créée depuis le front B2B marketplace',
      })
      await supabase.from('b2b_marketplace_quote_activity_logs').insert({
        quote_request_id: quote.id,
        activity_type: 'public_submission',
        title: 'Nouvelle demande front marketplace',
        description: `Demande envoyée par ${payload.schoolName} — ${payload.city}`,
        actor_name: 'Public Marketplace',
      })
    } catch {}

    return NextResponse.json({ ok: true, reference: quote.quote_reference, persisted: true, data: { ...payload, reference, status: 'new_request' } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: true, reference, persisted: false, warning: error instanceof Error ? error.message : 'Supabase persistence unavailable', data: { ...payload, reference, status: 'new_request' } }, { status: 201 })
  }
}
