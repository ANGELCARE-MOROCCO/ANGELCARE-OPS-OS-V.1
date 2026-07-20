import { createRevenueOsEventId } from './ids'

export const REVENUE_OS_EVENT_TYPES = [
  'foundation.installed',
  'foundation.bootstrap.read',
  'workspace.opened',
  'objective.created',
  'objective.updated',
  'feature_flag.changed',
  'system_check.completed',
  'permission.denied',
  'exception.raised',
] as const

export type RevenueOsEventType = (typeof REVENUE_OS_EVENT_TYPES)[number]

export type RevenueOsBusinessEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  eventId: string
  eventType: RevenueOsEventType
  aggregateType: string
  aggregateId: string
  occurredAt: string
  correlationId?: string
  causationId?: string
  actorId?: string
  actorType: 'user' | 'system' | 'migration' | 'api'
  schemaVersion: '1.0'
  payload: TPayload
}

export function createRevenueOsBusinessEvent<TPayload extends Record<string, unknown>>(input: {
  eventType: RevenueOsEventType
  aggregateType: string
  aggregateId: string
  actorId?: string
  actorType?: RevenueOsBusinessEvent['actorType']
  payload: TPayload
  correlationId?: string
  causationId?: string
}): RevenueOsBusinessEvent<TPayload> {
  return {
    eventId: createRevenueOsEventId(input.eventType.replace(/\./g, '_')),
    eventType: input.eventType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId,
    causationId: input.causationId,
    actorId: input.actorId,
    actorType: input.actorType ?? 'system',
    schemaVersion: '1.0',
    payload: input.payload,
  }
}
