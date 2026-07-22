import { z } from 'zod'
export const compilationScopeSchema=z.enum(['full','program','campaign','wave','account_plan','mission','task','script','assignment','dependency'])
export const compileInputSchema=z.object({strategyId:z.string().uuid(),strategyVersion:z.string().min(1),approvalRequestId:z.string().uuid().optional(),approvalDecisionId:z.string().uuid().optional(),scope:compilationScopeSchema.default('full'),idempotencyKey:z.string().min(8).max(300).optional(),previousRunId:z.string().uuid().optional(),partialObjectIds:z.array(z.string().uuid()).max(500).optional(),dryRun:z.boolean().default(false)})
export const conflictResolutionSchema=z.object({runId:z.string().uuid(),conflictId:z.string().uuid(),resolution:z.string().min(3).max(4000),acceptRisk:z.boolean().default(false)})
export const reassignmentSchema=z.object({runId:z.string().uuid(),objectId:z.string().uuid(),ownerId:z.string().min(1).optional(),ownerRole:z.string().min(2),reason:z.string().min(3).max(2000)})
export const rollbackSchema=z.object({runId:z.string().uuid(),targetRunId:z.string().uuid().optional(),reason:z.string().min(3).max(3000)})
export const preparePropagationSchema=z.object({runId:z.string().uuid(),acknowledgeShadowMode:z.literal(true),reason:z.string().min(3).max(2000)})
