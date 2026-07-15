import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function asError(error: any) {
  return error?.message || error?.details || error?.hint || null
}

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized', user: null }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = String(user.id)

    const [assigneeProbe, myAssigneeProbe, actionProbe, rpcProbe] = await Promise.all([
      supabase
        .from('connect_action_assignees')
        .select('id, action_id, user_id, assigned_by, assigned_at, completed_at')
        .limit(5),
      supabase
        .from('connect_action_assignees')
        .select('id, action_id, user_id, assigned_by, assigned_at, completed_at')
        .eq('user_id', userId)
        .limit(20),
      supabase
        .from('connect_actions')
        .select('id, title, status, priority, owner_id, created_by, conversation_id, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.rpc('connect_current_user_ids'),
    ])

    return NextResponse.json({
      ok: !assigneeProbe.error && !myAssigneeProbe.error && !actionProbe.error && !rpcProbe.error,
      generatedAt: new Date().toISOString(),
      user: {
        id: userId,
        email: (user as any).email || null,
        role: (user as any).role || null,
        department: (user as any).department || null,
      },
      resolvedUserIds: rpcProbe.data || [],
      probes: {
        assigneesAny: {
          ok: !assigneeProbe.error,
          error: asError(assigneeProbe.error),
          count: Array.isArray(assigneeProbe.data) ? assigneeProbe.data.length : 0,
          sample: assigneeProbe.data || [],
        },
        assigneesMine: {
          ok: !myAssigneeProbe.error,
          error: asError(myAssigneeProbe.error),
          count: Array.isArray(myAssigneeProbe.data) ? myAssigneeProbe.data.length : 0,
          sample: myAssigneeProbe.data || [],
        },
        actions: {
          ok: !actionProbe.error,
          error: asError(actionProbe.error),
          count: Array.isArray(actionProbe.data) ? actionProbe.data.length : 0,
          sample: actionProbe.data || [],
        },
      },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Connect RLS health failed',
    }, { status: 500 })
  }
}
