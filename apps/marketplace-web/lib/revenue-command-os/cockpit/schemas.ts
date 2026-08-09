import { z } from 'zod'

const idempotencyKey = z.string().min(8).max(180).optional()
const tenantId = z.string().min(1).max(120).optional()

export const cockpitQuerySchema = z.object({
  view: z.enum(['executive','commercial','operations','finance','agent']).optional(),
  refresh: z.coerce.boolean().optional(),
})

export const acknowledgeSchema = z.object({
  tenantId,
  exceptionId: z.string().uuid(),
  note: z.string().max(2000).optional(),
  idempotencyKey,
})

export const interventionSchema = z.object({
  tenantId,
  exceptionId: z.string().uuid(),
  actionType: z.string().min(2).max(120),
  reason: z.string().min(4).max(4000),
  assignedTo: z.string().max(160).optional(),
  assignedRole: z.string().max(160).optional(),
  deadline: z.string().datetime().optional(),
  evidence: z.array(z.string().max(500)).max(30).optional(),
  idempotencyKey,
})

export const resolveExceptionSchema = z.object({
  tenantId,
  exceptionId: z.string().uuid(),
  resolution: z.string().min(4).max(4000),
  evidence: z.array(z.string().max(500)).max(50).default([]),
  idempotencyKey,
})

export const saveViewSchema = z.object({
  tenantId,
  name: z.string().min(2).max(120),
  roleView: z.enum(['executive','commercial','operations','finance','agent']),
  layout: z.record(z.string(), z.unknown()),
  filters: z.record(z.string(), z.unknown()).default({}),
  isDefault: z.boolean().default(false),
  idempotencyKey,
})

export const watchlistSchema = z.object({
  tenantId,
  name: z.string().min(2).max(120),
  objectTypes: z.array(z.string().min(1).max(80)).min(1).max(30),
  objectIds: z.array(z.string().min(1).max(180)).max(500),
  filters: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey,
})

export const exportBriefSchema = z.object({
  tenantId,
  format: z.enum(['html','json']).default('html'),
  includeTimeline: z.boolean().default(true),
  includeEvidence: z.boolean().default(true),
  idempotencyKey,
})
