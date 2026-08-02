import { NextRequest } from 'next/server'
import { acContext, actorName, canAccessConversationRow, fail, ok, scopeAccountRows, scopeAccounts, scopeQueueRows } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.view')
  if ('error' in context) return context.error
  const can = (permission: string) => context.access.permissions.includes(permission) || context.access.permissions.includes('*') || context.access.permissions.includes('ac-whatsapp.*')
  const accountQuery = scopeAccounts(context.supabase.from('ac_whatsapp_accounts').select('*'), context).order('created_at', { ascending: false })
  const queueQuery = scopeQueueRows(context.supabase.from('ac_whatsapp_queues').select('*'), context).order('priority', { ascending: false })
  const conversationQuery = scopeAccountRows(context.supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*),queue:ac_whatsapp_queues(*),labels:ac_whatsapp_conversation_labels(label_id,label:ac_whatsapp_labels(*))'), context).order('last_message_at', { ascending: false, nullsFirst: false }).limit(500)
  const campaignQuery = scopeAccountRows(context.supabase.from('ac_whatsapp_campaigns').select('*,account:ac_whatsapp_accounts(*)'), context).order('created_at', { ascending: false }).limit(200)
  const [accounts, queues, conversations, campaigns, contacts, templates, memberships, securityEvents, auditEvents, presence, users, labelsCatalog] = await Promise.all([
    accountQuery,
    queueQuery,
    conversationQuery,
    campaignQuery,
    context.supabase.from('ac_whatsapp_contacts').select('*').order('last_contact_at', { ascending: false, nullsFirst: false }).limit(1000),
    context.supabase.from('ac_whatsapp_templates').select('*').order('usage_count', { ascending: false }).limit(250),
    can('ac-whatsapp.members.manage') ? context.supabase.from('ac_whatsapp_memberships').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: context.membership ? [context.membership] : [], error: null }),
    can('ac-whatsapp.security.manage') ? context.supabase.from('ac_whatsapp_security_events').select('*').order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
    can('ac-whatsapp.audit.view') ? context.supabase.from('ac_whatsapp_audit_events').select('*').order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
    can('ac-whatsapp.members.manage') || can('ac-whatsapp.analytics.view') ? context.supabase.from('ac_whatsapp_operator_presence').select('*').order('last_seen_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    can('ac-whatsapp.members.manage') ? context.supabase.from('app_users').select('*').order('email') : Promise.resolve({ data: [], error: null }),
    context.supabase.from('ac_whatsapp_labels').select('*').eq('status', 'active').order('name'),
  ])
  const error = [accounts, queues, conversations, campaigns, contacts, templates, memberships, securityEvents, auditEvents, presence, users, labelsCatalog].find((item) => item.error)?.error
  if (error) return fail(error.message, 500)
  const userRows = [...(users.data || [])]
  const knownIds = new Set(userRows.map((user: any) => String(user.id)))
  const requiredIds = Array.from(new Set([context.user.id, ...(conversations.data || []).map((row: any) => row.assigned_user_id), ...(memberships.data || []).flatMap((row: any) => [row.user_id, row.supervisor_user_id])].filter(Boolean).map(String))).filter((id) => !knownIds.has(id))
  if (requiredIds.length) {
    const requiredUsers = await context.supabase.from('app_users').select('*').in('id', requiredIds)
    if (!requiredUsers.error) userRows.push(...(requiredUsers.data || []))
  }
  const usersById = new Map(userRows.map((user: any) => [user.id, user]))
  const conversationRows = (conversations.data || []).filter((row: any) => canAccessConversationRow(context, row)).map((row: any) => ({ ...row, assigned_user: usersById.get(row.assigned_user_id) || null }))
  const membershipRows = (memberships.data || []).map((row: any) => ({ ...row, user: usersById.get(row.user_id) || null, supervisor: usersById.get(row.supervisor_user_id) || null }))
  let health: any = { configured: openwa.configured(), openwaReachable: false }
  if (health.configured && can('ac-whatsapp.account.manage')) {
    try { health = { ...health, openwaReachable: true, details: await openwa.health() } }
    catch (cause) { health = { ...health, error: cause instanceof Error ? cause.message : 'OPENWA_UNAVAILABLE' } }
  }
  const campaignRows = campaigns.data || []
  return ok({
    actor: { id: context.user.id, name: actorName(context.user), role: String(context.membership?.role_key || context.user.role || context.user.role_key || ''), permissions: context.access.permissions },
    accounts: accounts.data || [], queues: queues.data || [], conversations: conversationRows, campaigns: campaignRows,
    contacts: contacts.data || [], templates: templates.data || [], memberships: membershipRows, labelsCatalog: labelsCatalog.data || [],
    securityEvents: securityEvents.data || [], auditEvents: auditEvents.data || [], presence: presence.data || [], users: userRows, health,
    counts: {
      accounts: (accounts.data || []).length,
      connectedAccounts: (accounts.data || []).filter((item: any) => item.status === 'connected').length,
      conversations: conversationRows.length,
      unread: conversationRows.reduce((total: number, item: any) => total + (item.unread_count || 0), 0),
      unassigned: conversationRows.filter((item: any) => !item.assigned_user_id).length,
      escalated: conversationRows.filter((item: any) => item.status === 'escalated').length,
      waiting: conversationRows.filter((item: any) => ['waiting_customer', 'waiting_internal'].includes(item.status)).length,
      campaigns: campaignRows.length,
      runningCampaigns: campaignRows.filter((item: any) => item.status === 'running').length,
      totalSent: campaignRows.reduce((total: number, item: any) => total + (item.sent_count || 0), 0),
      totalReplies: campaignRows.reduce((total: number, item: any) => total + (item.reply_count || 0), 0),
      contacts: (contacts.data || []).length,
      operators: membershipRows.filter((item: any) => item.status === 'active').length,
      securityOpen: (securityEvents.data || []).filter((item: any) => item.status === 'open').length,
    },
  })
}
