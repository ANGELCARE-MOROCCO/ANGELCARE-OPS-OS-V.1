import { NextRequest } from 'next/server'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import { createServiceClient } from '@/lib/supabase/server'
import { executeRevenueCommandSituation } from '@/lib/revenue-command-os/command-kernel/repository'
import type { RevenueCommandContextValue, RevenueCommandSituation } from '@/lib/revenue-command-os/command-kernel/types'
import { writeRevenueOsAuditEvent } from '@/lib/revenue-command-os/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ScheduleRow = {
  id: string
  organization_id?: string | null
  tenant_id?: string | null
  code: string
  command_code: string
  label: string
  enabled: boolean
  timezone: string
  cadence: string
  business_hours_only: boolean
  next_run_at?: string | null
  last_run_at?: string | null
  missed_run_policy: 'skip' | 'run-once' | 'reschedule'
  owner_role: string
  execution_mode: string
  created_at: string
  updated_at: string
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim()
}

function scheduleCode(value: unknown) {
  const normalized = text(value).toUpperCase().replace(/[^A-Z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized || `SCH-LIVE-${Date.now()}`
}

function contextValues(payload: Record<string, unknown>): RevenueCommandContextValue[] {
  const now = new Date().toISOString()
  const raw = Array.isArray(payload.context) ? payload.context : []
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item) && item.key))
    .map((item): RevenueCommandContextValue => {
      let state: RevenueCommandContextValue['state'] = 'available'
      if (item.state === 'missing' || item.state === 'stale') state = item.state
      if (item.state === 'conflicting' || item.state === 'contradictory') state = 'contradictory'
      if (item.state === 'unvalidated' || item.state === 'restricted' || item.state === 'not-applicable') state = item.state
      return {
        key: text(item.key),
        state,
        value: item.value,
        observedAt: text(item.observedAt, now),
        source: text(item.source, 'schedule-operator-context'),
        reasons: Array.isArray(item.reasons) ? item.reasons.map(String) : ['Contexte réel fourni pour une exécution planifiée'],
      }
    })
}

async function loadSchedule(client: any, id: string, tenantUuid: string) {
  const result = await client
    .from('revenue_os_command_schedules')
    .select('*')
    .eq('tenant_id', tenantUuid)
    .eq('id', id)
    .maybeSingle()
  if (result.error) throw result.error
  if (!result.data) throw new RevenueOsError('COMMAND_SCHEDULE_NOT_FOUND', 'Planification introuvable.', { status: 404 })
  return result.data as ScheduleRow
}

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveRevenueOsActor()
    const client = await createServiceClient() as any
    const q = text(request.nextUrl.searchParams.get('q')).toLowerCase()
    const enabled = request.nextUrl.searchParams.get('enabled')
    const limit = Math.min(500, Math.max(20, Number(request.nextUrl.searchParams.get('limit') || 200)))
    let query = client
      .from('revenue_os_command_schedules')
      .select('*')
      .eq('tenant_id', actor.tenantUuid)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (enabled === 'true' || enabled === 'false') query = query.eq('enabled', enabled === 'true')
    const result = await query
    if (result.error) throw result.error
    const schedules = (result.data || []).filter((row: ScheduleRow) => !q || `${row.code} ${row.command_code} ${row.label} ${row.owner_role}`.toLowerCase().includes(q))
    return revenueOsSuccess({ schedules, tenantId: actor.tenantId, generatedAt: new Date().toISOString() }, { meta: { mode: 'live' } })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const action = text(body.action)
    const payload = body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload) ? body.payload as Record<string, unknown> : body
    const actor = await resolveRevenueOsActor(undefined, { payload })
    const client = await createServiceClient() as any
    const now = new Date().toISOString()

    if (action === 'create') {
      const commandCode = text(payload.commandCode)
      const label = text(payload.label)
      const cadence = text(payload.cadence)
      if (!commandCode || !label || !cadence) throw new RevenueOsError('COMMAND_SCHEDULE_FIELDS_REQUIRED', 'Commande, libellé et cadence sont requis.', { status: 422 })
      const row = {
        organization_id: actor.tenantUuid,
        tenant_id: actor.tenantUuid,
        code: scheduleCode(payload.code),
        command_code: commandCode,
        label,
        enabled: payload.enabled !== false,
        timezone: text(payload.timezone, 'Africa/Casablanca'),
        cadence,
        business_hours_only: payload.businessHoursOnly !== false,
        next_run_at: payload.nextRunAt || null,
        missed_run_policy: ['skip', 'run-once', 'reschedule'].includes(text(payload.missedRunPolicy)) ? text(payload.missedRunPolicy) : 'run-once',
        owner_role: text(payload.ownerRole, actor.displayName),
        execution_mode: 'live',
        updated_at: now,
      }
      const result = await client.from('revenue_os_command_schedules').insert(row).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action: 'command.schedule_created', actorId: actor.id, actorLabel: actor.displayName, actorType: 'user', resourceType: 'revenue_os_command_schedule', resourceId: result.data.id, outcome: 'success', summary: 'Planification de commande créée.', metadata: { commandCode, cadence } }, client)
      return revenueOsSuccess(result.data, { status: 201, meta: { mode: 'live' } })
    }

    const scheduleId = text(payload.scheduleId || body.scheduleId)
    if (!scheduleId) throw new RevenueOsError('COMMAND_SCHEDULE_ID_REQUIRED', 'Sélectionnez une planification.', { status: 422 })
    const schedule = await loadSchedule(client, scheduleId, actor.tenantUuid)

    if (action === 'update') {
      const changes: Record<string, unknown> = { execution_mode: 'live', updated_at: now }
      if (payload.label !== undefined) changes.label = text(payload.label)
      if (payload.cadence !== undefined) changes.cadence = text(payload.cadence)
      if (payload.timezone !== undefined) changes.timezone = text(payload.timezone)
      if (payload.ownerRole !== undefined) changes.owner_role = text(payload.ownerRole)
      if (payload.businessHoursOnly !== undefined) changes.business_hours_only = Boolean(payload.businessHoursOnly)
      if (payload.nextRunAt !== undefined) changes.next_run_at = payload.nextRunAt || null
      if (payload.missedRunPolicy !== undefined && ['skip', 'run-once', 'reschedule'].includes(text(payload.missedRunPolicy))) changes.missed_run_policy = text(payload.missedRunPolicy)
      const result = await client.from('revenue_os_command_schedules').update(changes).eq('tenant_id', actor.tenantUuid).eq('id', scheduleId).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({
        action: 'command.schedule_updated',
        actorId: actor.id,
        actorLabel: actor.displayName,
        actorType: 'user',
        resourceType: 'revenue_os_command_schedule',
        resourceId: scheduleId,
        outcome: 'success',
        summary: 'Planification de commande mise à jour.',
        metadata: { commandCode: schedule.command_code, changes },
      }, client)
      return revenueOsSuccess(result.data, { meta: { mode: 'live' } })
    }

    if (action === 'pause' || action === 'resume') {
      const enabled = action === 'resume'
      const result = await client.from('revenue_os_command_schedules').update({ enabled, execution_mode: 'live', updated_at: now }).eq('tenant_id', actor.tenantUuid).eq('id', scheduleId).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action: `command.schedule_${action}`, actorId: actor.id, actorLabel: actor.displayName, actorType: 'user', resourceType: 'revenue_os_command_schedule', resourceId: scheduleId, outcome: 'success', summary: enabled ? 'Planification reprise.' : 'Planification mise en pause.', metadata: { commandCode: schedule.command_code } }, client)
      return revenueOsSuccess(result.data, { meta: { mode: 'live' } })
    }

    if (action === 'delete') {
      const result = await client.from('revenue_os_command_schedules').delete().eq('tenant_id', actor.tenantUuid).eq('id', scheduleId)
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action: 'command.schedule_deleted', actorId: actor.id, actorLabel: actor.displayName, actorType: 'user', resourceType: 'revenue_os_command_schedule', resourceId: scheduleId, outcome: 'success', summary: 'Planification supprimée.', metadata: { commandCode: schedule.command_code } }, client)
      return revenueOsSuccess({ deleted: true, scheduleId }, { meta: { mode: 'live' } })
    }

    if (action === 'run_now') {
      const context = contextValues(payload)
      if (!context.length) throw new RevenueOsError('REAL_CONTEXT_REQUIRED', 'Ajoutez au moins un contexte réel avant l’exécution immédiate.', { status: 422, recoverable: true })
      const situation: RevenueCommandSituation = {
        id: `schedule-${scheduleId}-${Date.now()}`,
        tenantId: actor.tenantId,
        organizationId: actor.tenantId,
        businessUnit: text(payload.businessUnit, 'ANGELCARE'),
        segment: payload.segment ? text(payload.segment) : undefined,
        territory: payload.territory ? text(payload.territory) : undefined,
        commercialStage: payload.commercialStage ? text(payload.commercialStage) : undefined,
        signalType: 'manual.live.schedule',
        urgency: Number(payload.urgency || 5),
        opportunityValueDh: Number(payload.opportunityValueDh || 0),
        accountPriority: Number(payload.accountPriority || 5),
        actorId: actor.id,
        actorRole: actor.role,
        permissions: ['*'],
        executionMode: 'live',
        context,
        metadata: { requestedCommandCode: schedule.command_code, scheduleId, operatorProvidedContext: true },
      }
      const execution = await executeRevenueCommandSituation(situation)
      await client
        .from('revenue_os_command_schedules')
        .update({ last_run_at: now, updated_at: now })
        .eq('tenant_id', actor.tenantUuid)
        .eq('id', scheduleId)
      await writeRevenueOsAuditEvent({
        action: 'command.schedule_run_now',
        actorId: actor.id,
        actorLabel: actor.displayName,
        actorType: 'user',
        resourceType: 'revenue_os_command_schedule',
        resourceId: scheduleId,
        outcome: 'success',
        summary: 'Commande planifiée exécutée immédiatement.',
        metadata: { commandCode: schedule.command_code, situationId: situation.id },
      }, client)
      return revenueOsSuccess({ schedule, execution }, { status: 201, meta: { mode: 'live', requestedCommandCode: schedule.command_code } })
    }

    throw new RevenueOsError('COMMAND_SCHEDULE_ACTION_NOT_SUPPORTED', 'Action de planification non supportée.', { status: 405, context: { action } })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
