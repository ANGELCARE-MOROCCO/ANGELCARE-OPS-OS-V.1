import { NextRequest } from 'next/server'
import { acContext, actorName, actorRole, audit, canAccessConversationRow, fail, hasQueueAccess, ok } from '@/lib/ac-whatsapp/server'

function displayName(user: any) {
  return user ? actorName(user) : null
}

async function usersById(context: any, ids: Array<string | null | undefined>) {
  const unique = Array.from(new Set(ids.filter(Boolean).map(String)))
  if (!unique.length) return new Map<string, any>()
  const result = await context.supabase.from('app_users').select('*').in('id', unique)
  if (result.error) return new Map<string, any>()
  return new Map((result.data || []).map((user: any) => [String(user.id), user]))
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await acContext(request, 'ac-whatsapp.inbox.view')
  if ('error' in context) return context.error
  const { id } = await params
  const conversation = await context.supabase
    .from('ac_whatsapp_conversations')
    .select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*),queue:ac_whatsapp_queues(*),labels:ac_whatsapp_conversation_labels(label_id,label:ac_whatsapp_labels(*))')
    .eq('id', id)
    .maybeSingle()
  if (conversation.error) return fail(conversation.error.message, 500)
  if (!conversation.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, conversation.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)

  const [messages, events, links, followups] = await Promise.all([
    context.supabase.from('ac_whatsapp_messages').select('*,attachments:ac_whatsapp_attachments(*)').eq('conversation_id', id).order('created_at', { ascending: true }).limit(2000),
    context.supabase.from('ac_whatsapp_conversation_events').select('*').eq('conversation_id', id).order('created_at', { ascending: false }).limit(250),
    context.supabase.from('ac_whatsapp_context_links').select('*').eq('conversation_id', id).order('linked_at', { ascending: false }),
    context.supabase.from('ac_whatsapp_followup_tasks').select('*').eq('conversation_id', id).order('due_at', { ascending: true }).limit(100),
  ])
  const error = [messages, events, links, followups].find((item) => item.error)?.error
  if (error) return fail(error.message, 500)

  const userMap = await usersById(context, [
    conversation.data.assigned_user_id,
    ...(messages.data || []).flatMap((message: any) => [message.sender_user_id, message.responsible_user_id]),
    ...(events.data || []).map((event: any) => event.actor_user_id),
  ])

  const contactName = conversation.data.contact?.display_name || conversation.data.contact?.phone_number_e164 || 'Contact non identifié'
  const accountName = conversation.data.account?.name || 'Compte WhatsApp AngelCare'
  const messageRows = (messages.data || []).map((message: any) => {
    const user = userMap.get(String(message.sender_user_id || ''))
    const responsible = userMap.get(String(message.responsible_user_id || ''))
    const fallbackName = message.direction === 'inbound' ? contactName : message.direction === 'internal' ? 'Note interne AngelCare' : accountName
    const fallbackType = message.direction === 'inbound' ? 'contact' : message.direction === 'internal' ? 'internal_user' : 'whatsapp_account'
    return {
      ...message,
      sender_identity: {
        display_name: message.sender_display_name_snapshot || displayName(user) || fallbackName,
        role: message.sender_role_snapshot || (user ? actorRole(user) : message.direction === 'inbound' ? 'Contact' : message.direction === 'internal' ? 'Membre AngelCare' : 'Compte WhatsApp'),
        type: message.sender_type || fallbackType,
        origin: message.message_origin || 'whatsapp',
      },
      responsible_identity: responsible ? { display_name: displayName(responsible), role: actorRole(responsible) } : null,
    }
  })
  const eventRows = (events.data || []).map((event: any) => {
    const user = userMap.get(String(event.actor_user_id || ''))
    return { ...event, actor: user ? { id: user.id, display_name: displayName(user), role: actorRole(user) } : null }
  })
  const assignedUser = userMap.get(String(conversation.data.assigned_user_id || '')) || null
  return ok({ conversation: { ...conversation.data, assigned_user: assignedUser }, messages: messageRows, events: eventRows, contextLinks: links.data || [], followups: followups.data || [] })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await acContext(request, 'ac-whatsapp.inbox.view')
  if ('error' in context) return context.error
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '').trim().toLowerCase()
  const permissions = new Set(context.access.permissions)

  const before = await context.supabase.from('ac_whatsapp_conversations').select('*').eq('id', id).maybeSingle()
  if (before.error) return fail(before.error.message, 500)
  if (!before.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, before.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)

  const patch: Record<string, unknown> = {}
  const metadata = { ...(before.data.metadata || {}) }
  const now = new Date().toISOString()
  const assignmentActions = new Set(['assign', 'transfer'])
  const closeActions = new Set(['resolve', 'reopen', 'archive', 'restore'])
  if (assignmentActions.has(action) && !permissions.has('ac-whatsapp.conversation.assign')) return fail('ASSIGN_PERMISSION_REQUIRED', 403)
  if (closeActions.has(action) && !permissions.has('ac-whatsapp.conversation.close')) return fail('CLOSE_PERMISSION_REQUIRED', 403)

  if (action === 'mark_read') {
    patch.unread_count = 0
    patch.last_read_at = now
    patch.last_read_by_user_id = context.user.id
  } else if (action === 'mark_unread') {
    patch.unread_count = Math.max(1, Number(body.unread_count || before.data.unread_count || 1))
  } else if (action === 'resolve') {
    patch.status = 'resolved'; patch.resolved_at = now
  } else if (action === 'reopen') {
    patch.status = 'reopened'; patch.resolved_at = null; patch.closed_at = null
  } else if (action === 'archive') {
    patch.status = 'archived'
  } else if (action === 'restore') {
    patch.status = 'reopened'; patch.closed_at = null
  } else if (action === 'pin' || action === 'unpin') {
    metadata.pinned = action === 'pin'; metadata.pinned_at = action === 'pin' ? now : null; metadata.pinned_by = action === 'pin' ? context.user.id : null; patch.metadata = metadata
  } else if (action === 'mute' || action === 'unmute') {
    metadata.muted = action === 'mute'; metadata.muted_at = action === 'mute' ? now : null; metadata.muted_by = action === 'mute' ? context.user.id : null; patch.metadata = metadata
  } else if (action === 'assign') {
    patch.assigned_user_id = body.assigned_user_id || context.user.id
    patch.status = 'assigned'
  } else if (action === 'transfer') {
    if (body.queue_id && !hasQueueAccess(context, String(body.queue_id))) return fail('QUEUE_ACCESS_DENIED', 403)
    patch.queue_id = body.queue_id || null
    if (body.assigned_user_id !== undefined) patch.assigned_user_id = body.assigned_user_id || null
    patch.status = body.assigned_user_id ? 'assigned' : 'unassigned'
  } else {
    const allowed = ['status', 'priority', 'queue_id', 'assigned_user_id', 'subject', 'summary', 'sentiment', 'intent', 'snoozed_until']
    Object.assign(patch, Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key))))
    if (patch.queue_id && !hasQueueAccess(context, String(patch.queue_id))) return fail('QUEUE_ACCESS_DENIED', 403)
    const assignmentFields = ['queue_id', 'assigned_user_id']
    if (assignmentFields.some((key) => Object.prototype.hasOwnProperty.call(patch, key)) && !permissions.has('ac-whatsapp.conversation.assign')) return fail('ASSIGN_PERMISSION_REQUIRED', 403)
    if (Object.prototype.hasOwnProperty.call(patch, 'status') && ['resolved', 'closed', 'archived'].includes(String(patch.status)) && !permissions.has('ac-whatsapp.conversation.close')) return fail('CLOSE_PERMISSION_REQUIRED', 403)
    if (patch.status === 'resolved') patch.resolved_at = now
    if (patch.status === 'closed') patch.closed_at = now
  }

  if (action === 'create_followup') {
    const title = String(body.title || '').trim()
    const dueAt = String(body.due_at || '').trim()
    if (!title) return fail('FOLLOWUP_TITLE_REQUIRED', 422)
    if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) return fail('FOLLOWUP_DUE_AT_REQUIRED', 422)
    const followup = await context.supabase.from('ac_whatsapp_followup_tasks').insert({
      conversation_id: id,
      contact_id: before.data.contact_id,
      account_id: before.data.account_id,
      title,
      notes: String(body.notes || '').trim() || null,
      due_at: new Date(dueAt).toISOString(),
      priority: ['normal', 'high', 'critical'].includes(String(body.priority)) ? String(body.priority) : 'normal',
      assigned_user_id: body.assigned_user_id || context.user.id,
      created_by: context.user.id,
    }).select('*').single()
    if (followup.error) return fail(followup.error.message, 500)
    patch.status = 'scheduled_followup'
    patch.snoozed_until = followup.data.due_at
    metadata.last_followup_task_id = followup.data.id
    patch.metadata = metadata
  } else if (action === 'complete_followup') {
    const taskId = String(body.followup_id || '')
    if (!taskId) return fail('FOLLOWUP_ID_REQUIRED', 422)
    const completed = await context.supabase.from('ac_whatsapp_followup_tasks').update({ status: 'completed', completed_at: now }).eq('id', taskId).eq('conversation_id', id).select('*').maybeSingle()
    if (completed.error) return fail(completed.error.message, 500)
    if (!completed.data) return fail('FOLLOWUP_NOT_FOUND', 404)
  }

  if (action === 'set_labels') {
    const labelIds: string[] = Array.isArray(body.label_ids)
      ? Array.from(
          new Set<string>(
            body.label_ids.map((labelId: unknown) => String(labelId)),
          ),
        )
      : []
    const existing = await context.supabase.from('ac_whatsapp_conversation_labels').select('label_id').eq('conversation_id', id)
    if (existing.error) return fail(existing.error.message, 500)
    const current = new Set<string>((existing.data || []).map((row: any) => String(row.label_id)))
    const target = new Set<string>(labelIds)
    const remove = [...current].filter((labelId) => !target.has(labelId))
    const add = [...target].filter((labelId) => !current.has(labelId))
    if (remove.length) {
      const removed = await context.supabase.from('ac_whatsapp_conversation_labels').delete().eq('conversation_id', id).in('label_id', remove)
      if (removed.error) return fail(removed.error.message, 500)
    }
    if (add.length) {
      const added = await context.supabase.from('ac_whatsapp_conversation_labels').insert(add.map((labelId) => ({ conversation_id: id, label_id: labelId, created_by: context.user.id })))
      if (added.error) return fail(added.error.message, 500)
    }
  }

  let result = { data: before.data, error: null as any }
  if (Object.keys(patch).length) result = await context.supabase.from('ac_whatsapp_conversations').update(patch).eq('id', id).select('*').single()
  if (result.error) return fail(result.error.message, 500)

  const eventType = action ? `conversation.${action}` : 'conversation.updated'
  await context.supabase.from('ac_whatsapp_conversation_events').insert({
    conversation_id: id,
    event_type: eventType,
    actor_user_id: context.user.id,
    previous_state: before.data,
    new_state: result.data,
    reason: body.reason || null,
    metadata: { actor_display_name_snapshot: actorName(context.user), actor_role_snapshot: actorRole(context.user), label_ids: body.label_ids || undefined },
  })
  await audit(context, { action: eventType, entityType: 'conversation', entityId: id, reason: body.reason, previousState: before.data, newState: result.data, metadata: { labelIds: body.label_ids || undefined } })

  const enriched = await context.supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*),queue:ac_whatsapp_queues(*),labels:ac_whatsapp_conversation_labels(label_id,label:ac_whatsapp_labels(*))').eq('id', id).single()
  if (enriched.error) return fail(enriched.error.message, 500)
  return ok(enriched.data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await acContext(request, 'ac-whatsapp.message.delete')
  if ('error' in context) return context.error
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  if (body.confirm !== 'PERMANENT_DELETE') return fail('PERMANENT_DELETE_CONFIRMATION_REQUIRED', 422)
  if (!String(body.reason || '').trim()) return fail('DELETE_REASON_REQUIRED', 422)
  const before = await context.supabase.from('ac_whatsapp_conversations').select('*').eq('id', id).maybeSingle()
  if (before.error) return fail(before.error.message, 500)
  if (!before.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, before.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)
  await audit(context, { action: 'conversation.permanent_delete', entityType: 'conversation', entityId: id, reason: body.reason, previousState: before.data })
  const deleted = await context.supabase.from('ac_whatsapp_conversations').delete().eq('id', id)
  if (deleted.error) return fail(deleted.error.message, 500)
  return ok({ deleted: true, id })
}
