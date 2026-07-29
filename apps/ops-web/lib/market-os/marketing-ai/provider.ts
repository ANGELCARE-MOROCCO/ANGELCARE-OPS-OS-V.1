import type { JsonRecord } from '@/lib/ai-provider-control/types'
import { executeStructuredContent, getMarketAiRuntimeStatus } from '@/lib/market-os/ai-runtime/gateway'
import type { RuntimeContinuationMode } from '@/lib/market-os/ai-runtime/types'
import { assertMarketingAiConfigured, getMarketingAiConfig } from './config'
import type { MarketingAiCommand, MarketingAiOutput } from './types'

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['executiveSummary', 'findings', 'recommendations', 'internalActions', 'risks', 'evidence', 'learningSignals', 'unresolvedQuestions', 'confidence', 'humanDecisionRequired'],
  properties: {
    executiveSummary: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    internalActions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['type', 'title', 'description', 'requiresApproval', 'payload'],
        properties: {
          type: { type: 'string', enum: ['create_brief', 'create_content_draft', 'create_task_plan', 'create_asset_requirement', 'request_review', 'propose_schedule', 'prepare_publishing_package', 'classify_content', 'record_learning', 'store_bridge_object', 'none'] },
          title: { type: 'string' }, description: { type: 'string' }, requiresApproval: { type: 'boolean' }, payload: { type: 'object', additionalProperties: true },
        },
      },
    },
    risks: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'level', 'mitigation'], properties: { title: { type: 'string' }, level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }, mitigation: { type: 'string' } } } },
    evidence: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'sourceType'], properties: { title: { type: 'string' }, url: { type: 'string' }, sourceType: { type: 'string', enum: ['internal', 'external', 'tavily_search', 'tavily_extract', 'legacy_gemini_grounding'] }, observedAt: { type: 'string' }, freshness: { type: 'string' } } } },
    learningSignals: { type: 'array', items: { type: 'string' } },
    unresolvedQuestions: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    humanDecisionRequired: { type: 'boolean' },
  },
} as const

const SYSTEM_INSTRUCTION = `
You are SANILA Content Executive AI, the senior governed content operations executive for ANGELCARE Market OS Content Command Center 360.
Your job is to move the complete internal content lifecycle forward: intelligence, strategy, briefs, missions, tasks, production requirements, review preparation, corrections, distribution packages, publication preparation, performance analysis, optimization and institutional learning.
Be decisive, premium, operationally complete and faithful to the supplied dossier, doctrine, sources, versions, channels, audiences, objectives and authority state.
Do not stop at general recommendations. Produce concrete internal actions that the operating system can materialize.
When information is missing, identify it precisely and create a continuation route: use existing evidence, propose a task, request a source, switch provider, continue without research, or move to manual execution.
Never convert a warning into a dead end. Every issue must include a resolution, delegation, override or manual continuation path.
External delivery actions are prepared as governed handoffs: prepare the email, package, schedule, publishing instruction or human task; do not falsely claim it was sent or published.
Never invent prices, services, availability, performance, source authority, publication or business outcomes.
Treat unavailable data as unavailable, never as zero.
Do not expose hidden chain-of-thought. Return concise institutional rationale, evidence, assumptions, confidence and executable internal next actions.
`

function continuationMode(context: Record<string, unknown>): RuntimeContinuationMode {
  const runtime = context.runtimeContinuity && typeof context.runtimeContinuity === 'object' ? context.runtimeContinuity as Record<string, unknown> : {}
  const value = String(runtime.mode || context.continuationMode || 'auto')
  return ['auto','provider_only','without_research','manual'].includes(value) ? value as RuntimeContinuationMode : 'auto'
}

function manualContinuation(command: MarketingAiCommand, objective: string, warnings: string[] = []): MarketingAiOutput {
  return {
    executiveSummary: `Continuité opérationnelle activée pour « ${command.name} ». Le fournisseur IA n’a pas produit de résultat exploitable, mais le dossier n’est pas bloqué: un plan de travail interne manuel est prêt à être matérialisé.`,
    findings: warnings.length ? warnings : ['La capacité IA demandée est indisponible ou a été contournée par autorité humaine.'],
    recommendations: [
      'Ouvrir le plan de tâches généré et affecter le responsable compétent.',
      'Choisir un autre fournisseur ou modèle depuis Integrations & Context si une exécution IA reste souhaitée.',
      'Relancer la mission avec recherche désactivée lorsque les sources internes suffisent.',
    ],
    internalActions: [{
      type: 'create_task_plan',
      title: `Continuer manuellement · ${command.name}`,
      description: `Exécuter l’objectif sans dépendance provider: ${objective}`,
      requiresApproval: false,
      payload: {
        objective,
        commandCode: command.code,
        continuationMode: 'manual',
        tasks: [
          'Inspecter le dossier, le brief, les sources et les versions disponibles.',
          'Produire le livrable interne attendu par le commandement.',
          'Joindre les preuves et décisions requises.',
          'Reprendre le workflow au prochain gate normal.',
        ],
      },
    }],
    risks: [{ title: 'Assistance IA indisponible', level: 'medium', mitigation: 'Le workflow continue via une tâche humaine traçable et réaffectable.' }],
    evidence: [], learningSignals: [], unresolvedQuestions: ['Un autre provider ou modèle doit-il être sélectionné pour une nouvelle tentative ?'], confidence: 0, humanDecisionRequired: false,
  }
}

export async function checkMarketingAiHealth(live = false) {
  const config = getMarketingAiConfig()
  const runtime = await getMarketAiRuntimeStatus(live)
  const structured = runtime.capabilities.find((item) => item.capability === 'structured_content')
  const research = runtime.capabilities.find((item) => item.capability === 'web_research')
  return {
    enabled: config.enabled,
    configured: runtime.summary.available > 0,
    available: structured?.state === 'available',
    model: structured?.model || config.primaryModel,
    message: structured?.message || 'Runtime non exposé.',
    provider: structured?.providerType || null,
    researchProvider: research?.providerType || null,
    manualContinuity: true,
    gemini: runtime.gemini,
    capabilities: runtime.capabilities,
  }
}

export async function generateMarketingAiOutput(input: {
  command: MarketingAiCommand
  objective: string
  authorityMode: string
  context: Record<string, unknown>
  forceGrounding?: boolean
}) {
  const config = assertMarketingAiConfigured()
  const started = Date.now()
  const groundingRequested = Boolean(input.forceGrounding || input.command.tags.includes('research') || input.command.skillCode === 'LEARN-06' || input.command.code.includes('RESOURCE'))
  const runtimeContext = input.context.runtimeContinuity && typeof input.context.runtimeContinuity === 'object' ? input.context.runtimeContinuity as Record<string, unknown> : {}
  const payload: JsonRecord = {
    command: { code: input.command.code, name: input.command.name, category: input.command.category, objective: input.command.objective, instruction: input.command.instruction, riskLevel: input.command.riskLevel, requiresHumanReview: input.command.requiresHumanReview },
    mandateObjective: input.objective,
    authorityMode: input.authorityMode,
    operatingSystem: 'ANGELCARE / SANILA Market OS Content Command Center 360',
    market: 'Morocco',
    language: 'French unless the mandate explicitly requests another language',
    externalExecutionMode: 'prepare_human_handoff',
    context: input.context,
  }
  const researchQuery = groundingRequested && config.researchEnabled
    ? `${input.objective}\nCommandement: ${input.command.name}. Rechercher des sources actuelles et directement utiles au dossier Content Command Center, au marché marocain, aux canaux, audiences, formats et objectifs indiqués.`
    : undefined
  const result = await executeStructuredContent<MarketingAiOutput & JsonRecord>({
    context: {
      actorId: typeof input.context.actorId === 'string' ? input.context.actorId : null,
      missionId: typeof input.context.missionId === 'string' ? input.context.missionId : null,
      commandCode: input.command.code,
      continuationMode: continuationMode(input.context),
      overrideProviderType: typeof runtimeContext.providerType === 'string' ? runtimeContext.providerType : null,
      overrideModel: typeof runtimeContext.model === 'string' ? runtimeContext.model : null,
      reason: typeof runtimeContext.reason === 'string' ? runtimeContext.reason : null,
    },
    systemInstruction: SYSTEM_INSTRUCTION,
    payload,
    schema: OUTPUT_SCHEMA as unknown as JsonRecord,
    schemaName: 'sanila_content_executive_output',
    researchQuery,
    maxOutputTokens: config.maxOutputTokens,
  })
  if (result.status !== 'completed' || !result.result) {
    const output = manualContinuation(input.command, input.objective, result.warnings)
    return { output, model: 'manual-continuity', provider: null, inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: Date.now() - started, grounded: result.sources.length > 0, searchQueries: researchQuery ? [researchQuery] : [], continuation: { mode: 'manual', alternatives: result.alternatives, warnings: result.warnings } }
  }
  const parsed = result.result as unknown as MarketingAiOutput
  parsed.findings = Array.isArray(parsed.findings) ? parsed.findings : []
  parsed.recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : []
  parsed.internalActions = Array.isArray(parsed.internalActions) ? parsed.internalActions : []
  parsed.risks = Array.isArray(parsed.risks) ? parsed.risks : []
  parsed.evidence = Array.isArray(parsed.evidence) ? parsed.evidence : []
  parsed.learningSignals = Array.isArray(parsed.learningSignals) ? parsed.learningSignals : []
  parsed.unresolvedQuestions = Array.isArray(parsed.unresolvedQuestions) ? parsed.unresolvedQuestions : []
  parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)))
  parsed.evidence.push(...result.sources.map((source) => ({ title: source.title, url: source.url, sourceType: source.sourceType, observedAt: source.observedAt, freshness: source.freshness })))
  parsed.findings.push(...result.warnings)
  parsed.humanDecisionRequired = Boolean(parsed.humanDecisionRequired || input.command.requiresHumanReview || input.authorityMode === 'observe')
  return {
    output: parsed,
    model: result.model || config.primaryModel,
    provider: result.providerType,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    totalTokens: result.usage.totalTokens,
    latencyMs: result.usage.latencyMs,
    grounded: result.sources.length > 0,
    searchQueries: researchQuery ? [researchQuery] : [],
    continuation: { mode: 'provider', alternatives: result.alternatives, warnings: result.warnings },
  }
}
