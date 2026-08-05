import { NextRequest } from 'next/server'
import { acContext, actorName, actorRole, audit, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'

const ARTIFACT_TYPES = new Set([
  'milestone','commitment','approval','handoff','escalation','opportunity','case','evidence',
  'quality_issue','task','meeting','callback','question','decision','chapter','relationship_signal',
  'reply_strategy','document_insight','voice_insight','scheduled_message',
])

async function authorize(request: NextRequest, id: string) {
  const context = await acContext(request, 'ac-whatsapp.inbox.view')
  if (context.error) {
    return { ok: false as const, error: context.error }
  }

  const conversation = await context.supabase
    .from('ac_whatsapp_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (conversation.error) {
    return { ok: false as const, error: fail(conversation.error.message, 500) }
  }
  if (!conversation.data) {
    return { ok: false as const, error: fail('CONVERSATION_NOT_FOUND', 404) }
  }
  if (!canAccessConversationRow(context, conversation.data)) {
    return { ok: false as const, error: fail('CONVERSATION_ACCESS_DENIED', 403) }
  }

  return {
    ok: true as const,
    context,
    conversation: conversation.data,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await authorize(request, id)
  if (!access.ok) return access.error
  const { context } = access
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const [artifacts, draft, presence] = await Promise.all([
    context.supabase.from('ac_whatsapp_conversation_artifacts').select('*').eq('conversation_id', id).order('created_at', { ascending: false }).limit(250),
    context.supabase.from('ac_whatsapp_conversation_drafts').select('*').eq('conversation_id', id).eq('user_id', context.user.id).maybeSingle(),
    context.supabase.from('ac_whatsapp_conversation_presence').select('*').eq('conversation_id', id).gte('last_seen_at', cutoff).order('last_seen_at', { ascending: false }),
  ])
  const error = [artifacts, draft, presence].find((result) => result.error)?.error
  if (error) return fail(error.message, 500)
  return ok({ artifacts: artifacts.data || [], draft: draft.data || null, presence: presence.data || [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await authorize(request, id)
  if (!access.ok) return access.error
  const { context, conversation } = access
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  const now = new Date().toISOString()

  if (action === 'presence.ping') {
    const row = {
      conversation_id: id,
      user_id: context.user.id,
      display_name_snapshot: actorName(context.user),
      role_snapshot: actorRole(context.user),
      activity: String(body.activity || 'viewing').slice(0, 80),
      last_seen_at: now,
    }
    const saved = await context.supabase.from('ac_whatsapp_conversation_presence').upsert(row, { onConflict: 'conversation_id,user_id' }).select('*').single()
    if (saved.error) return fail(saved.error.message, 500)
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const presence = await context.supabase.from('ac_whatsapp_conversation_presence').select('*').eq('conversation_id', id).gte('last_seen_at', cutoff).order('last_seen_at', { ascending: false })
    if (presence.error) return fail(presence.error.message, 500)
    return ok({ presence: presence.data || [] })
  }

  if (action === 'draft.save') {
    const row = {
      conversation_id: id,
      user_id: context.user.id,
      body: String(body.body || ''),
      mode: body.mode === 'internal' ? 'internal' : 'customer',
      updated_at: now,
    }
    const saved = await context.supabase.from('ac_whatsapp_conversation_drafts').upsert(row, { onConflict: 'conversation_id,user_id' }).select('*').single()
    if (saved.error) return fail(saved.error.message, 500)
    return ok(saved.data)
  }

  if (action === 'artifact.create') {
    const type = String(body.artifact_type || '').toLowerCase()
    const title = String(body.title || '').trim()
    if (!ARTIFACT_TYPES.has(type)) return fail('INVALID_ARTIFACT_TYPE', 422)
    if (!title) return fail('ARTIFACT_TITLE_REQUIRED', 422)
    const inserted = await context.supabase.from('ac_whatsapp_conversation_artifacts').insert({
      conversation_id: id,
      contact_id: conversation.contact_id,
      account_id: conversation.account_id,
      artifact_type: type,
      title: title.slice(0, 240),
      description: String(body.description || '').trim() || null,
      status: 'open',
      priority: ['normal','high','critical'].includes(String(body.priority)) ? String(body.priority) : 'normal',
      source_message_id: body.source_message_id || null,
      assigned_user_id: body.assigned_user_id || context.user.id,
      due_at: body.due_at || null,
      payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
      created_by: context.user.id,
      updated_at: now,
    }).select('*').single()
    if (inserted.error) return fail(inserted.error.message, 500)
    await context.supabase.from('ac_whatsapp_conversation_events').insert({
      conversation_id: id,
      event_type: `theatre.${type}.created`,
      actor_user_id: context.user.id,
      reason: title,
      metadata: { artifact_id: inserted.data.id, actor_display_name_snapshot: actorName(context.user), actor_role_snapshot: actorRole(context.user) },
    })
    await audit(context, { action: `theatre.${type}.create`, entityType: 'conversation', entityId: id, metadata: { artifactId: inserted.data.id, title } })
    return ok(inserted.data, { status: 201 })
  }

  if (action === 'artifact.update') {
    const artifactId = String(body.artifact_id || '')
    if (!artifactId) return fail('ARTIFACT_ID_REQUIRED', 422)
    const patch = {
      status: ['open','in_progress','completed','cancelled','closed'].includes(String(body.status)) ? String(body.status) : undefined,
      priority: ['normal','high','critical'].includes(String(body.priority)) ? String(body.priority) : undefined,
      assigned_user_id: body.assigned_user_id || undefined,
      due_at: body.due_at || undefined,
      description: body.description === undefined ? undefined : String(body.description || '') || null,
      payload: body.payload && typeof body.payload === 'object' ? body.payload : undefined,
      updated_at: now,
    }
    const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
    const updated = await context.supabase.from('ac_whatsapp_conversation_artifacts').update(clean).eq('id', artifactId).eq('conversation_id', id).select('*').maybeSingle()
    if (updated.error) return fail(updated.error.message, 500)
    if (!updated.data) return fail('ARTIFACT_NOT_FOUND', 404)
    return ok(updated.data)
  }

  return fail('INVALID_THEATRE_ACTION', 422)
}
