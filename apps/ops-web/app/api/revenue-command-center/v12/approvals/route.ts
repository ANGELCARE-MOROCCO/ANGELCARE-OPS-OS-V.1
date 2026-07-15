import { NextResponse } from 'next/server'
import { getSupabase, logAction } from '../_shared'

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('revenue_command_approvals').select('*').order('created_at', { ascending: false }).limit(150)
    if (error) throw error
    return NextResponse.json({ ok: true, approvals: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to load approvals' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase()
    const body = await req.json()
    if (body.mode === 'decision') {
      const id = body.id
      const status = body.status || 'approved'
      const { data, error } = await supabase.from('revenue_command_approvals').update({ status, decision_note: body.decision_note || null, decided_at: new Date().toISOString() }).eq('id', id).select('*').single()
      if (error) throw error
      await logAction(supabase, `approval_${status}`, { approval: data })
      return NextResponse.json({ ok: true, approval: data })
    }
    const { data, error } = await supabase.from('revenue_command_approvals').insert({
      source_record_id: body.source_record_id || null,
      approval_key: body.approval_key || 'manual_approval',
      title: body.title || 'Revenue Command approval',
      requested_by: body.requested_by || 'Revenue Command',
      approver_name: body.approver_name || 'Revenue Manager',
      status: 'pending',
      payload: body.payload || {},
    }).select('*').single()
    if (error) throw error
    await logAction(supabase, 'approval_created', { approval: data })
    return NextResponse.json({ ok: true, approval: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Approval action failed' }, { status: 500 })
  }
}
