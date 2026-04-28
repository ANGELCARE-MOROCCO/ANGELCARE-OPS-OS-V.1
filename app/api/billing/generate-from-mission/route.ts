import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const contractId = Number(body.contract_id)
  const missionId = body.mission_id ? Number(body.mission_id) : null
  const amount = Number(body.amount || 0)
  const label = String(body.invoice_label || 'Mission invoice')
  const dueDate = body.due_date || null

  if (!contractId || amount <= 0) return NextResponse.json({ error: 'contract_id and positive amount required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase.from('billing_invoices').insert([{ contract_id: contractId, mission_id: missionId, amount, invoice_label: label, due_date: dueDate, status: 'pending', invoice_reference: `AC-M-${Date.now()}` }]).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'mission_invoice_generated', amount, note: missionId ? `Generated from mission #${missionId}` : label }])
  return NextResponse.json({ ok: true, invoice: data })
}
