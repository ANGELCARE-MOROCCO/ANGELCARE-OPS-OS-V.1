import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const id = params.id
    const [activities, outreach, calls, meetings, tasks, proposals, direct] = await Promise.all([
      db.from('b2b_activities').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(80),
      db.from('b2b_outreach_logs').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('b2b_calls').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('b2b_meetings').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('b2b_tasks').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('b2b_proposals').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('b2b_direct_actions').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(50),
    ])

    const rows = [
      ...(activities.data || []).map((x: any) => ({ id: `activity-${x.id}`, type: x.activity_type, title: x.title, description: x.description, created_at: x.created_at, source: 'activity', raw: x })),
      ...(outreach.data || []).map((x: any) => ({ id: `outreach-${x.id}`, type: 'outreach', title: `${x.channel} · ${x.outcome}`, description: x.subject || x.message_body, created_at: x.created_at || x.sent_at, source: 'outreach', raw: x })),
      ...(calls.data || []).map((x: any) => ({ id: `call-${x.id}`, type: 'call', title: x.call_result || 'Call logged', description: x.summary, created_at: x.created_at, source: 'call', raw: x })),
      ...(meetings.data || []).map((x: any) => ({ id: `meeting-${x.id}`, type: 'meeting', title: `${x.meeting_type || 'Meeting'} · ${x.status}`, description: x.agenda || x.notes, created_at: x.created_at || x.scheduled_at, source: 'meeting', raw: x })),
      ...(tasks.data || []).map((x: any) => ({ id: `task-${x.id}`, type: 'task', title: `${x.status} · ${x.title}`, description: x.description, created_at: x.created_at, source: 'task', raw: x })),
      ...(proposals.data || []).map((x: any) => ({ id: `proposal-${x.id}`, type: 'proposal', title: `${x.status} · ${x.proposal_title}`, description: x.proposal_type, created_at: x.created_at, source: 'proposal', raw: x })),
      ...(direct.data || []).map((x: any) => ({ id: `direct-${x.id}`, type: 'direct_action', title: `${x.action_channel} · ${x.outcome}`, description: x.subject || x.action_title, created_at: x.created_at, source: 'direct_action', raw: x })),
    ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    return NextResponse.json({ ok: true, data: rows })
  } catch (error) {
    console.error('[B2B_TIMELINE_GET_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to load B2B timeline.' }, { status: 500 })
  }
}
