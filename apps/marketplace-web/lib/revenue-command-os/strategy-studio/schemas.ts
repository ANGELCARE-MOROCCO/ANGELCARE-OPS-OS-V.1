import { z } from 'zod'
import { STUDIO_ACTIONS } from './types'

export const approvalConditionSchema = z.object({
  id:z.string().uuid().optional(),
  type:z.enum(['territory','pilot_window','no_discount','capacity_confirmation','evidence_required','budget_ceiling','named_accounts','deadline','margin_floor','custom']),
  label:z.string().min(3).max(300),
  operator:z.enum(['equals','in','not_in','gte','lte','before','after','confirmed','custom']),
  value:z.unknown(),
  status:z.enum(['pending','satisfied','failed','waived']).default('pending'),
  machineReadable:z.literal(true).default(true),
  evidenceIds:z.array(z.string()).default([]),
})
export const studioActionSchema = z.object({
  action:z.enum(STUDIO_ACTIONS),
  strategyId:z.string().uuid(),
  strategyVersion:z.string().min(1),
  reason:z.string().min(3).max(4000),
  approvalClass:z.enum(['standard','financial','capacity','managing_director','multi_director','conditional_pilot','high_risk_exception']).optional(),
  conditions:z.array(approvalConditionSchema).optional(),
  sourceStrategyIds:z.array(z.string().uuid()).max(8).optional(),
  amendment:z.record(z.string(),z.unknown()).optional(),
  objectiveChanges:z.record(z.string(),z.unknown()).optional(),
  constraintChanges:z.record(z.string(),z.unknown()).optional(),
})
export const simulationSchema = z.object({
  strategyId:z.string().uuid(),
  kind:z.enum(['capacity','constraint','outcome']),
  input:z.record(z.string(),z.unknown()).default({}),
})
