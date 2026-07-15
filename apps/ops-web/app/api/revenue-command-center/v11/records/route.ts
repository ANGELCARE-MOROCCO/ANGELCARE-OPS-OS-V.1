import { NextRequest, NextResponse } from 'next/server'
import { cleanRecordPayload, getSupabase, logAction } from '../_shared'

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase()
    const module = req.nextUrl.searchParams.get('module')
    const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'
    let query = supabase.from('revenue_command_records').select('*').is('deleted_at', null).order('updated_at', { ascending: false }).limit(250)
    if (module) query = query.eq('module_key', module)
    if (!includeArchived) query = query.or('archived_at.is.null,status.neq.archived')
    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: error.message, records: [] }, { status: 500 })
    return NextResponse.json({ ok: true, records: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'records GET failed', records: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const supabase = await getSupabase()
    const row = cleanRecordPayload(payload)
    const { data, error } = await supabase.from('revenue_command_records').insert(row).select('*').single()
    await logAction(supabase, 'create_record', { ...row, record_id: data?.id }, error ? 'failed' : 'completed')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, record: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'records POST failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    if (!payload.id) return NextResponse.json({ ok: false, error: 'Missing record id' }, { status: 400 })
    const supabase = await getSupabase()
    const updates = { ...payload, updated_at: new Date().toISOString() }
    delete updates.id
    const { data, error } = await supabase.from('revenue_command_records').update(updates).eq('id', payload.id).select('*').single()
    await logAction(supabase, 'update_record', { record_id: payload.id, updates }, error ? 'failed' : 'completed')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, record: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'records PATCH failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    if (!payload.id) return NextResponse.json({ ok: false, error: 'Missing record id' }, { status: 400 })
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('revenue_command_records').update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', payload.id).select('*').single()
    await logAction(supabase, 'delete_record', { record_id: payload.id }, error ? 'failed' : 'completed')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, record: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'records DELETE failed' }, { status: 500 })
  }
}
