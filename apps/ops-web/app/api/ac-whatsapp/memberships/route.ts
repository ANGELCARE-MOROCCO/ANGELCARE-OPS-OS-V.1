import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

async function enrich(context: any) {
  const [members, users, access, queues] = await Promise.all([
    context.supabase.from('ac_whatsapp_memberships').select('*').order('created_at', { ascending: false }),
    context.supabase.from('app_users').select('*'),
    context.supabase.from('ac_whatsapp_account_access').select('*'),
    context.supabase.from('ac_whatsapp_queue_memberships').select('*'),
  ])
  const error = [members, users, access, queues].find((row) => row.error)?.error
  if (error) throw error
  const map = new Map((users.data || []).map((row: any) => [row.id, row]))
  return (members.data || []).map((row: any) => ({
    ...row,
    user: map.get(row.user_id) || null,
    account_access: (access.data || []).filter((item: any) => item.user_id === row.user_id),
    queue_memberships: (queues.data || []).filter((item: any) => item.user_id === row.user_id),
  }))
}

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.members.manage')
  if ('error' in context) return context.error
  try { return ok(await enrich(context)) } catch (cause) { return fail(cause instanceof Error ? cause.message : 'MEMBERSHIP_LIST_FAILED', 500) }
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.members.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  if (!body.user_id) return fail('USER_REQUIRED', 422)
  const existing = await context.supabase.from('ac_whatsapp_memberships').select('*').eq('user_id', body.user_id).maybeSingle()
  if (existing.error) return fail(existing.error.message, 500)
  const member = await context.supabase.from('ac_whatsapp_memberships').upsert({
    user_id: body.user_id,
    role_key: body.role_key || existing.data?.role_key || 'operator',
    status: body.status || (existing.data?.status === 'removed' ? 'active' : existing.data?.status) || 'active',
    permissions: Array.isArray(body.permissions) ? body.permissions : (existing.data?.permissions || []),
    language: body.language || existing.data?.language || 'fr',
    supervisor_user_id: body.supervisor_user_id || null,
    working_hours: body.working_hours || existing.data?.working_hours || {},
    removed_at: null,
    removed_by: null,
    removal_reason: null,
    updated_by: context.user.id,
    ...(existing.data ? {} : { created_by: context.user.id }),
  }, { onConflict: 'user_id' }).select('*').single()
  if (member.error) return fail(member.error.message, 500)

  if (Array.isArray(body.account_ids)) {
    const cleared = await context.supabase.from('ac_whatsapp_account_access').delete().eq('user_id', body.user_id)
    if (cleared.error) return fail(cleared.error.message, 500)
    if (body.account_ids.length) {
      const inserted = await context.supabase.from('ac_whatsapp_account_access').insert(body.account_ids.map((accountId: string) => ({
        account_id: accountId, user_id: body.user_id, access_role: body.role_key || 'operator', can_send: body.can_send !== false,
        can_campaign: body.can_campaign !== false, can_admin: Boolean(body.can_admin), created_by: context.user.id,
      })))
      if (inserted.error) return fail(inserted.error.message, 500)
    }
  }
  if (Array.isArray(body.queue_ids)) {
    const cleared = await context.supabase.from('ac_whatsapp_queue_memberships').delete().eq('user_id', body.user_id)
    if (cleared.error) return fail(cleared.error.message, 500)
    if (body.queue_ids.length) {
      const inserted = await context.supabase.from('ac_whatsapp_queue_memberships').insert(body.queue_ids.map((queueId: string) => ({
        queue_id: queueId, user_id: body.user_id, skill_level: Number(body.skill_level || 50), capacity: Number(body.capacity || 25), created_by: context.user.id,
      })))
      if (inserted.error) return fail(inserted.error.message, 500)
    }
  }
  await audit(context, { action: existing.data ? 'membership.update' : 'membership.create', entityType: 'membership', entityId: member.data.id, previousState: existing.data, newState: member.data })
  return ok(member.data, { status: existing.data ? 200 : 201 })
}

export async function PATCH(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.members.manage')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const userId = String(body.user_id || '')
  if (!userId) return fail('USER_REQUIRED', 422)
  const existing = await context.supabase.from('ac_whatsapp_memberships').select('*').eq('user_id', userId).maybeSingle()
  if (existing.error) return fail(existing.error.message, 500)
  if (!existing.data) return fail('MEMBERSHIP_NOT_FOUND', 404)
  const status = String(body.status || existing.data.status)
  if (!['active','paused','suspended','revoked','removed'].includes(status)) return fail('INVALID_MEMBERSHIP_STATUS', 422)
  if (status === 'removed') return fail('USE_GOVERNED_REMOVE_ACTION', 409)
  const updated = await context.supabase.from('ac_whatsapp_memberships').update({
    status, role_key: body.role_key ?? existing.data.role_key, permissions: Array.isArray(body.permissions) ? body.permissions : existing.data.permissions,
    language: body.language ?? existing.data.language, supervisor_user_id: body.supervisor_user_id ?? existing.data.supervisor_user_id,
    working_hours: body.working_hours ?? existing.data.working_hours, updated_by: context.user.id, updated_at: new Date().toISOString(),
  }).eq('user_id', userId).select('*').single()
  if (updated.error) return fail(updated.error.message, 500)
  await audit(context, { action: `membership.${status}`, entityType: 'membership', entityId: updated.data.id, previousState: existing.data, newState: updated.data, reason: body.reason || null })
  return ok(updated.data)
}

export async function DELETE(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.team.remove')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const userId = String(body.user_id || '')
  const reason = String(body.reason || '').trim()
  if (!userId) return fail('USER_REQUIRED', 422)
  if (!reason) return fail('REMOVAL_REASON_REQUIRED', 422)
  const result = await context.supabase.rpc('ac_whatsapp_remove_member', {
    p_user_id: userId,
    p_transfer_target_user_id: body.transfer_target_user_id || null,
    p_transfer_queue_id: body.transfer_queue_id || null,
    p_reason: reason,
    p_actor_user_id: context.user.id,
    p_correlation_id: context.correlationId,
  })
  if (result.error) return fail(result.error.message, 500)
  return ok(result.data)
}
