import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultRecordTitle, nextStageForAction, nextStatusForAction, priorityForAction } from '@/lib/market-os/core'

export const dynamic = 'force-dynamic'

type Payload = Record<string, any>

function json(data: Payload, status = 200) { return NextResponse.json(data, { status }) }
function clean(input: any) { return input && typeof input === 'object' ? input : {} }

async function audit(supabase: any, row: Payload) {
  await supabase.from('market_os_audit_log').insert({
    action_key: row.action_key || row.action || 'market_os_action',
    title: row.title || 'Market-OS action',
    summary: row.summary || null,
    engine: row.engine || 'system',
    record_id: row.record_id || null,
    actor_name: row.actor_name || 'AngelCare Operator',
    payload: row.payload || {},
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const [records, agents, kpis, auditLog, notifications] = await Promise.all([
      supabase.from('market_os_records').select('*').order('updated_at', { ascending: false }).limit(500),
      supabase.from('market_os_agents').select('*').eq('is_active', true).order('name'),
      supabase.from('market_os_kpis').select('*').order('engine'),
      supabase.from('market_os_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('market_os_notifications').select('*').is('read_at', null).order('created_at', { ascending: false }).limit(100),
    ])
    const error = records.error || agents.error || kpis.error || auditLog.error || notifications.error
    if (error) return json({ ok: false, live: false, error: error.message, records: [], agents: [], kpis: [], audit: [], notifications: [] }, 200)
    return json({ ok: true, live: true, records: records.data || [], agents: agents.data || [], kpis: kpis.data || [], audit: auditLog.data || [], notifications: notifications.data || [] })
  } catch (error: any) {
    return json({ ok: false, live: false, error: error?.message || 'Market-OS core unavailable', records: [], agents: [], kpis: [], audit: [], notifications: [] }, 200)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = clean(await req.json().catch(() => ({})))
    const action = String(body.action || 'upsert_record')
    const supabase = await createClient()
    const now = new Date().toISOString()

    if (action === 'delete_record') {
      const id = body.recordId || body.id
      if (!id) return json({ ok: false, error: 'recordId is required' }, 400)
      const { error } = await supabase.from('market_os_records').delete().eq('id', id)
      if (error) return json({ ok: false, error: error.message }, 500)
      await audit(supabase, { action_key: action, title: 'Deleted Market-OS record', record_id: id, actor_name: body.actorName, payload: body })
      return json({ ok: true, id })
    }

    if (action === 'update_record' || action === 'update_status' || action === 'upsert_record') {
      const id = body.recordId || body.id || body.record?.id
      const record = clean(body.record)
      const patch: Payload = {
        kind: body.kind ?? record.kind ?? body.recordType ?? record.record_type ?? 'task',
        record_type: body.recordType ?? record.record_type ?? record.kind ?? 'task',
        engine: body.engine ?? record.engine ?? 'system',
        pipeline: body.pipeline ?? record.pipeline ?? null,
        title: body.title ?? record.title ?? defaultRecordTitle(action),
        description: body.description ?? record.description ?? record.notes ?? null,
        owner: body.owner ?? record.owner ?? null,
        owner_agent: body.ownerAgent ?? record.owner_agent ?? record.ownerAgent ?? null,
        status: body.status ?? record.status ?? nextStatusForAction(action, 'active'),
        priority: body.priority ?? record.priority ?? priorityForAction(action),
        stage: body.stage ?? record.stage ?? nextStageForAction(action),
        due_date: body.dueDate ?? record.due_date ?? record.dueDate ?? null,
        score: body.score ?? record.score ?? null,
        notes: body.notes ?? record.notes ?? null,
        payload: body.payload ?? record.payload ?? {},
        metadata: { ...(record.metadata || {}), source: 'market_os_core_api', lastAction: action },
        updated_at: now,
      }
      let result
      if (id) result = await supabase.from('market_os_records').update(patch).eq('id', id).select('*').single()
      else result = await supabase.from('market_os_records').insert(patch).select('*').single()
      if (result.error) return json({ ok: false, error: result.error.message }, 500)
      await supabase.from('market_os_actions').insert({ action_key: action, record_id: result.data.id, engine: patch.engine, actor_name: body.actorName || 'AngelCare Operator', owner_agent: patch.owner_agent, payload: body })
      await audit(supabase, { action_key: action, title: patch.title, summary: `Market-OS ${action} completed`, engine: patch.engine, record_id: result.data.id, actor_name: body.actorName, payload: body })
      return json({ ok: true, live: true, record: result.data })
    }

    await audit(supabase, { action_key: action, title: body.title || defaultRecordTitle(action), summary: body.description || null, engine: body.engine || 'system', actor_name: body.actorName, payload: body })
    return json({ ok: true, live: true, action })
  } catch (error: any) {
    return json({ ok: false, live: false, error: error?.message || 'Market-OS action failed' }, 500)
  }
}
