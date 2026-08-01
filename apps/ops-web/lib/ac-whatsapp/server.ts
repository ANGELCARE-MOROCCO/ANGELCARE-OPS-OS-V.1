import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import {
  effectiveAcWhatsAppPermissions,
  hasAcWhatsAppPermission,
  hasBroadConversationScope,
  isAcWhatsAppGlobalMembership,
  isAcWhatsAppPrivilegedUser,
} from './permissions'
import type { AcWhatsAppPermission } from './types'

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

export function ok(data: unknown, init?: ResponseInit) { return NextResponse.json({ ok: true, data }, init) }
export function fail(error: string, status = 400, details?: unknown) { return NextResponse.json({ ok: false, error, details }, { status }) }

export async function acContext(request: NextRequest, required: AcWhatsAppPermission | AcWhatsAppPermission[]) {
  const user = await getCurrentUser()
  if (!user) return { error: fail('UNAUTHENTICATED', 401) } as const

  const supabase = await createServiceClient()
  const privileged = isAcWhatsAppPrivilegedUser(user)
  const membershipResult = privileged
    ? { data: null, error: null }
    : await supabase.from('ac_whatsapp_memberships').select('*').eq('user_id', user.id).maybeSingle()

  if (membershipResult.error) return { error: fail(membershipResult.error.message, 500) } as const
  const membership = membershipResult.data
  if (!hasAcWhatsAppPermission(user, membership, required)) return { error: fail('FORBIDDEN', 403) } as const

  const globalAccess = privileged || isAcWhatsAppGlobalMembership(membership?.role_key)
  let accountAccess: any[] = []
  let queueMemberships: any[] = []
  if (!globalAccess) {
    const [accounts, queues] = await Promise.all([
      supabase.from('ac_whatsapp_account_access').select('*').eq('user_id', user.id).eq('status','active'),
      supabase.from('ac_whatsapp_queue_memberships').select('*').eq('user_id', user.id).in('status',['active','paused']),
    ])
    const accessError = accounts.error || queues.error
    if (accessError) return { error: fail(accessError.message, 500) } as const
    accountAccess = accounts.data || []
    queueMemberships = queues.data || []
  }

  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  return {
    user,
    supabase,
    correlationId,
    membership,
    privileged,
    access: {
      global: globalAccess,
      broadConversations: globalAccess || hasBroadConversationScope(membership?.role_key),
      accountAccess,
      queueMemberships,
      accountIds: accountAccess.map(x => String(x.account_id)),
      queueIds: queueMemberships.map(x => String(x.queue_id)),
      permissions: effectiveAcWhatsAppPermissions(user, membership),
    },
  } as const
}

export function scopeAccounts<T extends { in: Function; eq: Function }>(query: T, context: any, column = 'id'): T {
  if (context.access.global) return query
  return (context.access.accountIds.length ? query.in(column, context.access.accountIds) : query.eq(column, ZERO_UUID)) as T
}

export function scopeAccountRows<T extends { in: Function; eq: Function }>(query: T, context: any, column = 'account_id'): T {
  if (context.access.global) return query
  return (context.access.accountIds.length ? query.in(column, context.access.accountIds) : query.eq(column, ZERO_UUID)) as T
}

export function scopeQueueRows<T extends { in: Function; eq: Function }>(query: T, context: any, column = 'id'): T {
  if (context.access.global || context.access.broadConversations) return query
  return (context.access.queueIds.length ? query.in(column, context.access.queueIds) : query.eq(column, ZERO_UUID)) as T
}

export function hasAccountCapability(context: any, accountId: string, capability: 'view'|'send'|'campaign'|'admin' = 'view') {
  if (context.access.global) return true
  const row = context.access.accountAccess.find((x:any) => String(x.account_id) === String(accountId) && x.status === 'active')
  if (!row) return false
  if (capability === 'send') return row.can_send !== false
  if (capability === 'campaign') return row.can_campaign !== false
  if (capability === 'admin') return row.can_admin === true
  return true
}

export function hasQueueAccess(context: any, queueId?: string | null) {
  if (!queueId || context.access.global || context.access.broadConversations) return true
  return context.access.queueIds.includes(String(queueId))
}

export function canAccessConversationRow(context: any, row: any) {
  if (!row || !hasAccountCapability(context, row.account_id, 'view')) return false
  if (context.access.global || context.access.broadConversations) return true
  return String(row.assigned_user_id || '') === String(context.user.id) || hasQueueAccess(context, row.queue_id)
}

export async function audit(context: any, input: { action: string; entityType: string; entityId?: string | null; reason?: string | null; previousState?: unknown; newState?: unknown; metadata?: Record<string, unknown> }) {
  await context.supabase.from('ac_whatsapp_audit_events').insert({
    actor_user_id: context.user.id, action: input.action, entity_type: input.entityType,
    entity_id: input.entityId || null, reason: input.reason || null,
    previous_state: input.previousState ?? null, new_state: input.newState ?? null,
    metadata: input.metadata || {}, correlation_id: context.correlationId,
  })
}

export function actorName(user: any) {
  return user.display_name || user.full_name || user.name || [user.first_name,user.last_name].filter(Boolean).join(' ') || user.email || user.id
}

export function normalizePhone(value: unknown) {
  const raw = String(value || '').trim()
  const digits = raw.replace(/\D/g,'')
  if (!digits) return ''
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (raw.startsWith('+')) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 10) return `+212${digits.slice(1)}`
  return `+${digits}`
}

export function phoneToChatId(value: unknown) {
  return `${normalizePhone(value).replace(/\D/g,'')}@c.us`
}
