import { z } from 'zod'

const scalarInput = z.union([z.string(), z.number(), z.boolean()])
const scalarPrediction = z.union([z.string(), z.number()])
const messageValue = z.union([z.string(), z.array(z.string())])

const scenario = z.object({
  name: z.string().min(3),
  kind: z.enum([
    'base',
    'upside',
    'downside',
    'capacity_constrained',
    'budget_constrained',
    'slow_conversion',
    'competitor_response',
    'low_evidence',
  ]),
  inputs: z.record(z.string(), scalarInput),
  predictedResults: z.record(z.string(), scalarPrediction),
  sensitivity: z.record(z.string(), z.number()),
})

const assumption = z.object({
  assumption: z.string().min(12),
  type: z.string().min(2),
  source: z.string().min(2),
  confidence: z.number().min(0).max(1),
  impact: z.string().min(4),
  validationRequired: z.boolean(),
  owner: z.string().min(2),
  status: z.enum([
    'supported',
    'partially_supported',
    'unvalidated',
    'contradictory',
    'expired',
    'rejected',
  ]),
})

const risk = z.object({
  risk: z.string().min(10),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  mitigation: z.string().min(8),
  trigger: z.string().min(5),
  owner: z.string().min(2),
  fallback: z.string().min(5),
  stopCondition: z.string().min(5),
})

export const geminiStrategyDraft = z.object({
  archetype: z.string().min(3),
  thesis: z.string().min(80),
  objective: z.string().min(20),
  targetMarket: z.array(z.string()).min(1),
  targetSegments: z.array(z.string()).min(1),
  accountProfile: z.string().min(20),
  businessProblem: z.string().min(20),
  offer: z.record(z.string(), z.unknown()),
  valueProposition: z.string().min(40),
  differentiatingAngle: z.string().min(20),
  channelMix: z.array(
    z.object({
      channel: z.string(),
      purpose: z.string(),
      sequence: z.number().int(),
      owner: z.string(),
      stopCondition: z.string(),
    }),
  ).min(1),
  messageArchitecture: z.record(z.string(), messageValue),
  campaignSequence: z.array(z.string()).min(1),
  decisionMakerStrategy: z.string().min(20),
  meetingStrategy: z.string().min(20),
  proposalStrategy: z.string().min(20),
  pricingPosture: z.record(z.string(), z.unknown()).refine(
    value => typeof value.source === 'string' && value.source.length > 0,
    'pricing source required',
  ),
  scarcityMechanism: z.record(z.string(), z.unknown()),
  trustEvidence: z.array(
    z.object({
      evidenceId: z.string(),
      status: z.string(),
      requirement: z.string(),
    }),
  ),
  resourcesRequired: z.array(
    z.object({
      resource: z.string(),
      quantity: z.number().nonnegative(),
      unit: z.string(),
    }),
  ),
  capacityRequirements: z.array(
    z.object({
      capacity: z.string(),
      amount: z.number().nonnegative(),
      freshness: z.literal('fresh'),
    }),
  ),
  predictedResults: z.record(
    z.string(),
    z.record(z.string(), z.number()),
  ),
  assumptions: z.array(assumption).min(1),
  confidence: z.number().min(0).max(1),
  risks: z.array(risk).min(1),
  fallbackPlan: z.array(z.string()).min(1),
  stopConditions: z.array(z.string()).min(1),
  commandCodes: z.array(z.string()).min(3),
  scenarios: z.array(scenario).min(3),
})

export const geminiStrategyAssembly = z.object({
  strategies: z.array(geminiStrategyDraft).min(5).max(8),
  unresolvedQuestions: z.array(z.string()),
  contextGaps: z.array(z.string()),
})

export type GeminiStrategyAssembly = z.infer<typeof geminiStrategyAssembly>

export const GEMINI_STRATEGY_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['strategies', 'unresolvedQuestions', 'contextGaps'],
  properties: {
    strategies: {
      type: 'array',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'archetype',
          'thesis',
          'objective',
          'targetMarket',
          'targetSegments',
          'accountProfile',
          'businessProblem',
          'offer',
          'valueProposition',
          'differentiatingAngle',
          'channelMix',
          'messageArchitecture',
          'campaignSequence',
          'decisionMakerStrategy',
          'meetingStrategy',
          'proposalStrategy',
          'pricingPosture',
          'scarcityMechanism',
          'trustEvidence',
          'resourcesRequired',
          'capacityRequirements',
          'predictedResults',
          'assumptions',
          'confidence',
          'risks',
          'fallbackPlan',
          'stopConditions',
          'commandCodes',
          'scenarios',
        ],
        properties: {
          archetype: { type: 'string' },
          thesis: { type: 'string' },
          objective: { type: 'string' },
          targetMarket: { type: 'array', items: { type: 'string' } },
          targetSegments: { type: 'array', items: { type: 'string' } },
          accountProfile: { type: 'string' },
          businessProblem: { type: 'string' },
          offer: { type: 'object', additionalProperties: true },
          valueProposition: { type: 'string' },
          differentiatingAngle: { type: 'string' },
          channelMix: {
            type: 'array',
            items: {
              type: 'object',
              required: ['channel', 'purpose', 'sequence', 'owner', 'stopCondition'],
              properties: {
                channel: { type: 'string' },
                purpose: { type: 'string' },
                sequence: { type: 'integer' },
                owner: { type: 'string' },
                stopCondition: { type: 'string' },
              },
            },
          },
          messageArchitecture: { type: 'object', additionalProperties: true },
          campaignSequence: { type: 'array', items: { type: 'string' } },
          decisionMakerStrategy: { type: 'string' },
          meetingStrategy: { type: 'string' },
          proposalStrategy: { type: 'string' },
          pricingPosture: { type: 'object', additionalProperties: true },
          scarcityMechanism: { type: 'object', additionalProperties: true },
          trustEvidence: {
            type: 'array',
            items: {
              type: 'object',
              required: ['evidenceId', 'status', 'requirement'],
              properties: {
                evidenceId: { type: 'string' },
                status: { type: 'string' },
                requirement: { type: 'string' },
              },
            },
          },
          resourcesRequired: {
            type: 'array',
            items: {
              type: 'object',
              required: ['resource', 'quantity', 'unit'],
              properties: {
                resource: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
              },
            },
          },
          capacityRequirements: {
            type: 'array',
            items: {
              type: 'object',
              required: ['capacity', 'amount', 'freshness'],
              properties: {
                capacity: { type: 'string' },
                amount: { type: 'number' },
                freshness: { type: 'string', enum: ['fresh'] },
              },
            },
          },
          predictedResults: { type: 'object', additionalProperties: true },
          assumptions: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          risks: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          fallbackPlan: { type: 'array', items: { type: 'string' } },
          stopConditions: { type: 'array', items: { type: 'string' } },
          commandCodes: { type: 'array', minItems: 3, items: { type: 'string' } },
          scenarios: {
            type: 'array',
            minItems: 3,
            items: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    unresolvedQuestions: { type: 'array', items: { type: 'string' } },
    contextGaps: { type: 'array', items: { type: 'string' } },
  },
} as const
