import { NextRequest, NextResponse } from 'next/server'
import { actionUpdates, getSupabase, logAction } from '../_shared'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const { action_key, record_id } = payload
    if (!action_key) return NextResponse.json({ ok: false, error: 'Missing action_key' }, { status: 400 })
    const supabase = await getSupabase()
    let record = null
    if (record_id) {
      const updates = actionUpdates(action_key, payload)
      const result = await supabase.from('revenue_command_records').update(updates).eq('id', record_id).select('*').single()
      if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })
      record = result.data
    }
    await logAction(supabase, action_key, { ...payload, record }, 'completed')
    return NextResponse.json({ ok: true, record, message: `Action completed: ${action_key}` })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'action failed' }, { status: 500 })
  }
}
