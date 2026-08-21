import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { getSupabase, actionUpdates, logAction } from '../_shared'

async function POST__angelcareGovernedImpl(req: Request) {
  try {
    const supabase = await getSupabase()
    const body = await req.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids : []
    const action_key = body.action_key || 'start'
    if (!ids.length) return NextResponse.json({ ok: false, error: 'No records selected' }, { status: 400 })
    const updates = actionUpdates(action_key, body)
    const { data, error } = await supabase.from('revenue_command_records').update(updates).in('id', ids).select('*')
    if (error) throw error
    await logAction(supabase, `bulk_${action_key}`, { ...body, ids, updates, selected_count: ids.length })
    return NextResponse.json({ ok: true, count: data?.length || 0, records: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Bulk action failed' }, { status: 500 })
  }
}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/revenue-command-center/v12/bulk',
  },
  POST__angelcareGovernedImpl,
)
