import { z } from 'zod'

export const compilationCreateSchema = z.object({
  missionId: z.string().uuid(),
  strategyRunId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3).max(240).optional(),
  forceRefreshContext: z.boolean().optional(),
})

export const compilationDecisionSchema = z.object({
  decisionType: z.enum(['approve','approve_with_conditions','request_revision','restrict_scope','require_evidence','pause','reject','escalate','cancel']),
  reason: z.string().trim().min(3).max(4000),
  conditions: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
})

export const queueControlSchema = z.object({
  action: z.enum(['pause','resume','cancel','retry','dead_letter','replay']),
  reason: z.string().trim().max(2000).optional(),
})

export const syncRequestSchema = z.object({
  sourceType: z.string().trim().min(2).max(80),
  sourceId: z.string().trim().min(1).max(200),
  targetType: z.string().trim().min(2).max(80),
  targetId: z.string().trim().max(200).optional().nullable(),
  strategy: z.enum(['link','promote','reconcile','refresh']),
  payload: z.record(z.string(), z.unknown()).default({}),
})
