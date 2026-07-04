import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getActions, getMyConversations } from '@/lib/connect/connect-repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized', user: null }, { status: 401 })
    }

    const supabase = await createClient()
    const [conversationsResult, actionsResult, directMembershipResult, assigneeResult] = await Promise.allSettled([
      getMyConversations(user as any),
      getActions(user as any),
      supabase.from('connect_conversation_members').select('id, conversation_id, role, joined_at').eq('user_id', user.id).limit(25),
      supabase.from('connect_action_assignees').select('id, action_id, user_id, assigned_by, created_at').eq('user_id', user.id).limit(25),
    ])

    const conversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value : []
    const actions = actionsResult.status === 'fulfilled' ? actionsResult.value : []
    const memberships = directMembershipResult.status === 'fulfilled' && !(directMembershipResult.value as any).error
      ? ((directMembershipResult.value as any).data || [])
      : []
    const assignees = assigneeResult.status === 'fulfilled' && !(assigneeResult.value as any).error
      ? ((assigneeResult.value as any).data || [])
      : []

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: (user as any).email || null,
        role: (user as any).role || null,
        department: (user as any).department || null,
      },
      counts: {
        conversations: conversations.length,
        memberships: memberships.length,
        actions: actions.length,
        assignedTaskRows: assignees.length,
      },
      samples: {
        conversations: conversations.slice(0, 5),
        memberships: memberships.slice(0, 5),
        actions: actions.slice(0, 5),
        assignees: assignees.slice(0, 5),
      },
      errors: {
        conversations: conversationsResult.status === 'rejected' ? String(conversationsResult.reason?.message || conversationsResult.reason) : null,
        actions: actionsResult.status === 'rejected' ? String(actionsResult.reason?.message || actionsResult.reason) : null,
        memberships: directMembershipResult.status === 'rejected' ? String(directMembershipResult.reason?.message || directMembershipResult.reason) : ((directMembershipResult as any).value?.error?.message || null),
        assignees: assigneeResult.status === 'rejected' ? String(assigneeResult.reason?.message || assigneeResult.reason) : ((assigneeResult as any).value?.error?.message || null),
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Connect mobile delivery health failed' }, { status: 500 })
  }
}
