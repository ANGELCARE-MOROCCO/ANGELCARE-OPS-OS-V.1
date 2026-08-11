import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.members.manage')
  if ('error' in context) return context.error
  const userId = String(request.nextUrl.searchParams.get('user_id') || '')
  if (!userId) return fail('USER_REQUIRED', 422)
  const [member, conversations, followups, campaigns, accountAccess, queueMemberships] = await Promise.all([
    context.supabase.from('ac_whatsapp_memberships').select('*').eq('user_id', userId).maybeSingle(),
    context.supabase.from('ac_whatsapp_conversations').select('id,status,subject,queue_id,last_message_at').eq('assigned_user_id', userId).not('status', 'in', '(resolved,closed,archived)'),
    context.supabase.from('ac_whatsapp_followup_tasks').select('id,title,due_at,priority').eq('assigned_user_id', userId).eq('status', 'open'),
    context.supabase.from('ac_whatsapp_campaigns').select('id,name,status,account_id').eq('owner_user_id', userId).not('status', 'in', '(completed,cancelled,failed)'),
    context.supabase.from('ac_whatsapp_account_access').select('id,account_id,access_role,can_send,can_campaign,can_admin').eq('user_id', userId),
    context.supabase.from('ac_whatsapp_queue_memberships').select('id,queue_id,capacity,skill_level').eq('user_id', userId),
  ])
  const error = [member, conversations, followups, campaigns, accountAccess, queueMemberships].find((result) => result.error)?.error
  if (error) return fail(error.message, 500)
  if (!member.data) return fail('MEMBERSHIP_NOT_FOUND', 404)
  return ok({
    member: member.data,
    impact: {
      activeConversations: conversations.data || [],
      openFollowups: followups.data || [],
      ownedCampaigns: campaigns.data || [],
      accountAccess: accountAccess.data || [],
      queueMemberships: queueMemberships.data || [],
      counts: {
        conversations: conversations.data?.length || 0,
        followups: followups.data?.length || 0,
        campaigns: campaigns.data?.length || 0,
        accounts: accountAccess.data?.length || 0,
        queues: queueMemberships.data?.length || 0,
      },
    },
  })
}
