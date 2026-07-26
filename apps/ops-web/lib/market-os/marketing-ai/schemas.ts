import { z } from 'zod'

export const authorityModeSchema = z.enum(['observe', 'advise', 'prepare', 'orchestrate_internal'])
export const frequencySchema = z.enum(['manual', 'hourly', 'every_4_hours', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'quarterly'])

const csvBooleanSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  const normalized = String(value ?? '').trim().toLowerCase()
  if (['true', '1', 'yes', 'oui', 'y'].includes(normalized)) return true
  if (['false', '0', 'no', 'non', 'n', ''].includes(normalized)) return false
  return value
}, z.boolean())

export const commandImportRowSchema = z.object({
  code: z.string().min(3).max(120),
  name: z.string().min(3).max(240),
  skill_code: z.string().min(3).max(120),
  category: z.string().min(2).max(160),
  objective: z.string().min(10).max(2000),
  instruction: z.string().min(20).max(12000),
  default_frequency: frequencySchema.default('manual'),
  authority_mode: authorityModeSchema.default('prepare'),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  requires_human_review: csvBooleanSchema.default(true),
  status: z.enum(['draft', 'active', 'paused', 'retired']).default('draft'),
  tags: z.string().default(''),
})


export const commandPatchSchema = z.object({
  name: z.string().min(3).max(240).optional(),
  objective: z.string().min(10).max(4000).optional(),
  instruction: z.string().min(20).max(16000).optional(),
  defaultFrequency: frequencySchema.optional(),
  authorityMode: authorityModeSchema.optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  requiresHumanReview: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'paused', 'retired']).optional(),
  deployed: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(120)).max(40).optional(),
}).strict()

export const scheduleInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(240),
  commandCode: z.string().min(3).max(120),
  frequency: frequencySchema,
  timezone: z.string().min(3).max(80).default('Africa/Casablanca'),
  hour: z.number().int().min(0).max(23).default(8),
  minute: z.number().int().min(0).max(59).default(0),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
  enabled: z.boolean().default(true),
  authorityMode: authorityModeSchema.default('prepare'),
  objective: z.string().min(8).max(4000),
  context: z.record(z.string(), z.unknown()).default({}),
})

export const missionInputSchema = z.object({
  title: z.string().min(3).max(240),
  objective: z.string().min(12).max(5000),
  authorityMode: authorityModeSchema.default('prepare'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
  commandCodes: z.array(z.string().min(3)).min(1).max(50),
  context: z.record(z.string(), z.unknown()).default({}),
  restrictions: z.array(z.string()).default([]),
  expectedOutcomes: z.array(z.string()).default([]),
})

export const runCommandSchema = z.object({
  commandCode: z.string().min(3),
  objective: z.string().min(8).max(5000),
  authorityMode: authorityModeSchema.optional(),
  missionId: z.string().uuid().nullable().optional(),
  scheduleId: z.string().uuid().nullable().optional(),
  context: z.record(z.string(), z.unknown()).default({}),
})
