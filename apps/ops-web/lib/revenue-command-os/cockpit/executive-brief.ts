import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { z } from 'zod'
import { cockpitConfig } from './config'
import { cockpitStableId, redactCockpitPayload } from './crypto'
import type { ApprovalGovernanceSummary, CouncilSummary, ExecutiveBrief, ExecutionProgressSummary, ObjectiveCommandSummary, RevenueException, RevenueProgramSummary, StrategyAssemblySummary } from './types'

interface BriefContext {
  objective: ObjectiveCommandSummary | null
  strategy: StrategyAssemblySummary | null
  council: CouncilSummary | null
  programs: RevenueProgramSummary[]
  exceptions: RevenueException[]
  approvals: ApprovalGovernanceSummary[]
  execution: ExecutionProgressSummary
  timelineCount: number
}

const narrativeSchema = z.object({
  currentPosition: z.string().min(20).max(1200),
  forecastStatement: z.string().min(20).max(1200),
  materialChanges: z.array(z.string().min(5).max(500)).max(8),
  criticalRisks: z.array(z.string().min(5).max(500)).max(8),
  immediateDecision: z.string().min(10).max(1200),
  recommendedExecutiveAction: z.string().min(10).max(1200),
})

const narrativeJsonSchema = {
  type: 'object',
  required: ['currentPosition','forecastStatement','materialChanges','criticalRisks','immediateDecision','recommendedExecutiveAction'],
  properties: {
    currentPosition: { type: 'string' },
    forecastStatement: { type: 'string' },
    materialChanges: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    criticalRisks: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    immediateDecision: { type: 'string' },
    recommendedExecutiveAction: { type: 'string' },
  },
  additionalProperties: false,
} as const

export async function buildExecutiveBrief(context: BriefContext): Promise<ExecutiveBrief> {
  const deterministic = deterministicBrief(context)
  const config = cockpitConfig()
  if (!config.geminiBriefEnabled || !process.env.GEMINI_API_KEY || !process.env.GEMINI_PRIMARY_MODEL) return deterministic

  try {
    const minimized = redactCockpitPayload({
      objective: context.objective ? {
        title: context.objective.title,
        revenueTarget: context.objective.revenueTarget,
        actualRevenue: context.objective.actualRevenue,
        qualifiedPipeline: context.objective.qualifiedPipeline,
        forecastRevenue: context.objective.forecastRevenue,
        forecastPercent: context.objective.forecastPercent,
        confidence: context.objective.confidence,
        blockers: context.objective.currentBlockers,
        nextMilestone: context.objective.nextMilestone,
      } : null,
      strategy: context.strategy ? {
        title: context.strategy.title,
        thesis: context.strategy.thesis,
        confidence: context.strategy.confidence,
        assumptionsOpen: context.strategy.assumptionsOpen,
        risksHigh: context.strategy.risksHigh,
      } : null,
      council: context.council ? {
        classification: context.council.classification,
        blockingFindings: context.council.blockingFindings,
        contradictions: context.council.contradictions,
        topFindings: context.council.topFindings,
      } : null,
      programs: context.programs.slice(0, 8).map((program) => ({
        title: program.title,
        progressPercent: program.progressPercent,
        forecastRevenue: program.forecastRevenue,
        tasksBlocked: program.tasksBlocked,
        capacityUtilization: program.capacityUtilization,
      })),
      criticalExceptions: context.exceptions.slice(0, 8).map((exception) => ({
        priority: exception.priority,
        title: exception.title,
        revenueAtRisk: exception.revenueAtRisk,
        recommendedAction: exception.recommendedAction,
      })),
      approvals: context.approvals.slice(0, 8).map((approval) => ({
        type: approval.approvalType,
        title: approval.title,
        status: approval.status,
        businessConsequence: approval.businessConsequence,
      })),
      execution: context.execution,
    })

    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await client.models.generateContent({
        model: process.env.GEMINI_PRIMARY_MODEL,
        contents: JSON.stringify(minimized),
        config: {
          systemInstruction: 'Tu es le Chief Revenue Officer virtuel d’AngelCare. Rédige un brief exécutif factuel, direct et précis en français. N’invente aucun chiffre. Distingue clairement position, prévision, changements, risques et décision immédiate. Retourne uniquement le JSON demandé.',
          responseMimeType: 'application/json',
          responseJsonSchema: narrativeJsonSchema,
          maxOutputTokens: 1800,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: controller.signal,
        },
      })
      if (!response.text) return deterministic
      const parsed = narrativeSchema.safeParse(JSON.parse(response.text))
      if (!parsed.success) return deterministic
      return {
        ...deterministic,
        currentPosition: parsed.data.currentPosition,
        forecastStatement: parsed.data.forecastStatement,
        materialChanges: parsed.data.materialChanges,
        criticalRisks: parsed.data.criticalRisks,
        immediateDecision: parsed.data.immediateDecision,
        recommendedExecutiveAction: parsed.data.recommendedExecutiveAction,
        provider: 'gemini-assisted',
      }
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return deterministic
  }
}

function deterministicBrief(context: BriefContext): ExecutiveBrief {
  const generatedAt = new Date().toISOString()
  const objectiveStatement = context.objective
    ? `${context.objective.title} · cible ${formatDh(context.objective.revenueTarget)} · marge ${context.objective.marginTarget}%.`
    : 'Aucun objectif revenu actif n’est actuellement disponible.'
  const currentPosition = context.objective
    ? `${formatDh(context.objective.actualRevenue)} réalisés et ${formatDh(context.objective.qualifiedPipeline)} de pipeline qualifié, soit ${context.objective.progressPercent}% de progression réelle.`
    : 'Le cockpit attend la création ou l’activation d’un objectif gouverné.'
  const forecastStatement = context.objective
    ? `Prévision ${formatDh(context.objective.forecastRevenue)}, couvrant ${context.objective.forecastPercent}% de la cible avec une confiance de ${context.objective.confidence}%.`
    : 'Aucune prévision consolidée ne peut être calculée sans objectif actif.'
  const materialChanges = buildChanges(context)
  const criticalRisks = context.exceptions.slice(0, 6).map((exception) => `${exception.priority} · ${exception.title} · ${formatDh(exception.revenueAtRisk)} exposés`)
  const pendingApprovals = context.approvals.filter((approval) => ['pending','requested','awaiting','awaiting_approval'].includes(approval.status))
  const immediateDecision = context.exceptions[0]
    ? `${context.exceptions[0].recommendedAction} Impact: ${context.exceptions[0].businessImpact}`
    : pendingApprovals[0]
      ? `Décider « ${pendingApprovals[0].title} ». ${pendingApprovals[0].businessConsequence}`
      : 'Aucune intervention critique immédiate; maintenir la cadence et surveiller les signaux émergents.'
  const recommendedExecutiveAction = context.exceptions[0]
    ? context.exceptions[0].recommendedAction
    : context.objective && context.objective.forecastPercent < 90
      ? 'Examiner les programmes sous-contributeurs et autoriser une action de rattrapage ciblée.'
      : 'Confirmer les prochains jalons et conserver les contrôles d’approbation actuels.'

  return {
    id: cockpitStableId('executive-brief', context.objective?.id, generatedAt.slice(0, 13)),
    version: 1,
    title: 'Brief exécutif Revenue Command OS',
    generatedAt,
    objectiveStatement,
    currentPosition,
    forecastStatement,
    materialChanges,
    criticalRisks,
    approvalsRequired: pendingApprovals.slice(0, 8).map((approval) => approval.title),
    immediateDecision,
    nextMilestones: context.programs.map((program) => program.nextMilestone).filter((value): value is string => Boolean(value)).slice(0, 6),
    recommendedExecutiveAction,
    sourceReferences: [
      ...(context.objective ? [{ type: 'objective', id: context.objective.id, label: context.objective.title }] : []),
      ...(context.strategy ? [{ type: 'strategy', id: context.strategy.id, label: context.strategy.title }] : []),
      ...context.exceptions.slice(0, 5).map((exception) => ({ type: 'exception', id: exception.id, label: exception.title })),
    ],
    provider: 'deterministic',
    traceable: true,
  }
}

function buildChanges(context: BriefContext): string[] {
  const changes: string[] = []
  if (context.programs[0]) changes.push(`${context.programs[0].title}: ${context.programs[0].progressPercent}% de progression, ${context.programs[0].tasksBlocked} tâche(s) bloquée(s).`)
  if (context.execution.succeeded > 0) changes.push(`${context.execution.succeeded} action(s) d’exécution ont réussi dans la fenêtre observée.`)
  if (context.execution.failed > 0 || context.execution.deadLetters > 0) changes.push(`${context.execution.failed} échec(s) et ${context.execution.deadLetters} dead letter(s) nécessitent une surveillance.`)
  if (context.council) changes.push(`Le Conseil classe la stratégie « ${context.council.classification} » avec ${context.council.blockingFindings} blocage(s).`)
  if (!changes.length) changes.push('Aucun changement matériel n’a été détecté dans les sources disponibles.')
  return changes.slice(0, 8)
}

function formatDh(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} Dh`
}
