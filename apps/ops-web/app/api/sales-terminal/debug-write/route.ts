
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const clientPayload = {
    client_name: 'WRITE TEST CLIENT',
    client_type: 'family',
    phone: '0600000000',
    city: 'Test City',
    source: 'debug-write',
    notes: 'Created by /api/sales-terminal/debug-write'
  }

  const { data: client, error: clientError } = await supabase
    .from('sales_terminal_clients')
    .insert(clientPayload)
    .select('*')
    .single()

  if (clientError) {
    return NextResponse.json({
      ok: false,
      step: 'insert_client',
      message: clientError.message,
      hint: 'Run the real write fix SQL and make sure API routes are installed.'
    }, { status: 500 })
  }

  const orderPayload = {
    order_ref: `SO-DEBUG-${Date.now()}`,
    client_id: client.id,
    client_name: client.client_name,
    customer_type: 'family',
    service_category: 'childcare',
    service_type: 'home_childcare',
    city: 'Test City',
    quantity: 1,
    unit_price: 100,
    total_amount: 100,
    status: 'draft',
    payment_status: 'unpaid',
    fulfillment_status: 'not_started',
    next_action: 'Create/send quote',
    notes: 'Created by debug write route'
  }

  const { data: order, error: orderError } = await supabase
    .from('sales_terminal_orders')
    .insert(orderPayload)
    .select('*')
    .single()

  if (orderError) {
    return NextResponse.json({
      ok: false,
      step: 'insert_order',
      message: orderError.message,
      client_created: client
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'REAL DATABASE WRITE OK',
    client,
    order
  })
}
