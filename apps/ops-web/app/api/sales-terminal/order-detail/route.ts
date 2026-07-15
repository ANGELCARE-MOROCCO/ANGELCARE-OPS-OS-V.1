import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function fail(message: string, status = 500) {
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return fail('Missing order id.', 400)

  const { data: order, error: orderError } = await supabase.from('sales_terminal_orders').select('*').eq('id', id).single()
  if (orderError) return fail(orderError.message)

  const [{ data: documents, error: docsError }, { data: notes, error: notesError }] = await Promise.all([
    supabase.from('sales_terminal_documents').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    supabase.from('sales_terminal_order_notes').select('*').eq('order_id', id).order('created_at', { ascending: false }),
  ])
  if (docsError) return fail(docsError.message)
  if (notesError) return fail(notesError.message)

  return NextResponse.json({ ok: true, order, documents: documents || [], notes: notes || [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { id, ...updates } = body || {}
  if (!id) return fail('Missing order id.', 400)

  if (updates.total_amount !== undefined && Number(updates.total_amount) < 0) return fail('Total amount cannot be negative.', 400)

  const { data, error } = await supabase
    .from('sales_terminal_orders')
    .update({ ...updates, updated_at: new Date().toISOString(), last_action_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return fail(error.message)

  await supabase.from('sales_terminal_order_notes').insert({
    order_id: id,
    note_type: 'system',
    message: `Order updated: ${Object.keys(updates).join(', ')}`,
    metadata: { updates },
  })

  return NextResponse.json({ ok: true, data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { action, order_id, message, note_type, cancellation_reason } = body || {}
  if (!order_id) return fail('Missing order_id.', 400)

  if (action === 'add_note') {
    if (!String(message || '').trim()) return fail('Note message is required.', 400)
    const { data, error } = await supabase.from('sales_terminal_order_notes').insert({ order_id, note_type: note_type || 'note', message }).select('*').single()
    if (error) return fail(error.message)
    return NextResponse.json({ ok: true, data })
  }

  if (action === 'cancel_order') {
    if (!String(cancellation_reason || '').trim()) return fail('Cancellation reason is required.', 400)
    const { data, error } = await supabase
      .from('sales_terminal_orders')
      .update({ status: 'cancelled', cancellation_reason, updated_at: new Date().toISOString(), last_action_at: new Date().toISOString() })
      .eq('id', order_id)
      .select('*')
      .single()
    if (error) return fail(error.message)
    await supabase.from('sales_terminal_order_notes').insert({ order_id, note_type: 'cancel', message: `Order cancelled: ${cancellation_reason}` })
    return NextResponse.json({ ok: true, data })
  }

  return fail('Unknown action.', 400)
}
