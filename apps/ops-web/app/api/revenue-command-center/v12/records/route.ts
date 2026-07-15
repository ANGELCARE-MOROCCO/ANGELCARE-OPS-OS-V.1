import { NextResponse } from 'next/server'
import { getSupabase, cleanRecordPayload, logAction, actionUpdates } from '../_shared'

export async function GET(req: Request) {
  try {
    const supabase = await getSupabase()
    const url = new URL(req.url)
    const moduleKey = url.searchParams.get('module')
    const status = url.searchParams.get('status')
    let query = supabase.from('revenue_command_records').select('*').is('deleted_at', null).order('updated_at', { ascending: false }).limit(300)
    if (moduleKey && moduleKey !== 'all') query = query.eq('module_key', moduleKey)
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true, records: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to load records' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase()
    const body = await req.json()
    const mode = body.mode || 'create'

    if (mode === 'update') {
      const id = body.id
      if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
      const updates = cleanRecordPayload(body)
      const { data, error } = await supabase.from('revenue_command_records').update(updates).eq('id', id).select('*').single()
      if (error) throw error
      await logAction(supabase, 'record_updated', { id, updates, record: data })
      return NextResponse.json({ ok: true, record: data })
    }

    if (mode === 'delete') {
      const id = body.id
      if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
      const updates = actionUpdates('delete')
      const { data, error } = await supabase.from('revenue_command_records').update(updates).eq('id', id).select('*').single()
      if (error) throw error
      await logAction(supabase, 'record_deleted_soft', { id, record: data })
      return NextResponse.json({ ok: true, record: data })
    }

    if (mode === 'action') {
      const id = body.id
      const action_key = body.action_key
      if (!id || !action_key) return NextResponse.json({ ok: false, error: 'Missing id/action_key' }, { status: 400 })
      const updates = actionUpdates(action_key, body)
      const { data, error } = await supabase.from('revenue_command_records').update(updates).eq('id', id).select('*').single()
      if (error) throw error
      await logAction(supabase, action_key, { ...body, id, updates, record: data })
      return NextResponse.json({ ok: true, record: data })
    }

    const payload = cleanRecordPayload(body)
    const { data, error } = await supabase.from('revenue_command_records').insert(payload).select('*').single()
    if (error) throw error
    await logAction(supabase, 'record_created', { record: data })
    return NextResponse.json({ ok: true, record: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to mutate record' }, { status: 500 })
  }
}
