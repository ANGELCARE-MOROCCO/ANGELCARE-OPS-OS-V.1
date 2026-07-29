import { getMarketingAiConfig } from './config'
import { generateMarketingAiOutput } from './provider'
import {
  assertMarketingAiRunBudget,
  completeMarketingAiRun,
  createInternalActionQueue,
  createMarketingAiRun,
  failMarketingAiRun,
  findMarketingAiCommand,
  getMarketingAiMission,
  recordGuardrailEvent,
  recordLearningEvent,
  recordResourceUpdate,
  updateMarketingAiMissionStatus,
} from './repository'
import type { MarketingAiAuthorityMode, MarketingAiRun } from './types'

const EXTERNAL_ACTION_PATTERN = /(email\.send|whatsapp\.send|social\.publish|ads\.activate|external_form|external_contact|public_statement|send email|send whatsapp|publish externally|activate ads)/i

export async function executeMarketingAiCommand(input: {
  commandCode: string
  objective: string
  authorityMode?: MarketingAiAuthorityMode
  missionId?: string | null
  scheduleId?: string | null
  context: Record<string, unknown>
  actor: { id: string; name: string }
  forceGrounding?: boolean
}): Promise<MarketingAiRun> {
  const command = await findMarketingAiCommand(input.commandCode)
  if (!command) throw new Error(`COMMAND_NOT_FOUND:${input.commandCode}`)
  const runtimeContinuity = input.context.runtimeContinuity && typeof input.context.runtimeContinuity === 'object' ? input.context.runtimeContinuity as Record<string, unknown> : {}
  const governedOverride = runtimeContinuity.overrideCommandState === true
  if ((command.status !== 'active' || !command.deployed) && !governedOverride) throw new Error(`COMMAND_NOT_DEPLOYED:${input.commandCode}`)
  const authorityMode = input.authorityMode || command.authorityMode
  const serialized = JSON.stringify({ objective: input.objective, context: input.context, instruction: command.instruction })
  const externalHandoffRequested = EXTERNAL_ACTION_PATTERN.test(serialized)
  if (externalHandoffRequested) {
    await recordGuardrailEvent({ actorId: input.actor.id, commandCode: command.code, requestedAction: 'external_handoff', reason: 'External execution converted into an internal preparation and human handoff.', payload: { objective: input.objective } })
    input.context = { ...input.context, externalExecutionMode: 'prepare_human_handoff', externalHandoffRequested: true }
  }
  const config = getMarketingAiConfig()
  await assertMarketingAiRunBudget(input.actor.id, config.maxRunsPerHour, config.maxTokensPerDay)
  const run = await createMarketingAiRun({ command, objective: input.objective, authorityMode, missionId: input.missionId, scheduleId: input.scheduleId, context: input.context, actorId: input.actor.id })
  try {
    const generated = await generateMarketingAiOutput({ command, objective: input.objective, authorityMode, context: input.context, forceGrounding: input.forceGrounding })
    for (const action of generated.output.internalActions) {
      if (EXTERNAL_ACTION_PATTERN.test(`${action.type} ${action.title} ${action.description} ${JSON.stringify(action.payload)}`)) {
        await recordGuardrailEvent({ actorId: input.actor.id, runId: run.id, commandCode: command.code, requestedAction: action.type, reason: 'Model proposed an external action; action removed.', payload: action.payload })
        const requested = action.type
        action.type = requested.includes('publish') ? 'prepare_publishing_package' : 'create_task_plan'
        action.title = `Handoff humain préparé · ${action.title}`
        action.description = `${action.description} L’exécution externe n’est pas déclarée comme accomplie; un paquet ou une tâche humaine est créé pour continuer sans bloquer le dossier.`
        action.payload = { ...action.payload, requestedExternalAction: requested, executionMode: 'human_handoff', overrideAvailable: true }
        action.requiresApproval = true
        generated.output.humanDecisionRequired = true
      }
    }
    const completed = await completeMarketingAiRun(run.id, generated)
    await createInternalActionQueue({ actorId: input.actor.id, runId: run.id, missionId: input.missionId, commandCode: command.code, actions: generated.output.internalActions })
    if (generated.output.learningSignals.length) {
      await recordLearningEvent({ actorId: input.actor.id, runId: run.id, title: `Apprentissage · ${command.name}`, evidence: generated.output.evidence.map((item) => item.title), recommendation: generated.output.learningSignals.join('\n'), confidence: generated.output.confidence })
    }
    if (command.skillCode === 'LEARN-06' || input.forceGrounding) {
      await recordResourceUpdate({ actorId: input.actor.id, runId: run.id, title: `Mise à jour ressources Tavily, OpenRouter & marketing · ${new Date().toISOString().slice(0, 7)}`, domains: config.monthlyResourceDomains, summary: generated.output.executiveSummary, sources: generated.output.evidence, recommendations: generated.output.recommendations })
    }
    return completed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MARKETING_AI_RUN_FAILED'
    await failMarketingAiRun(run.id, message, message === 'EXTERNAL_ACTION_BLOCKED')
    throw error
  }
}

export async function executeMarketingAiMission(input: { missionId: string; actor: { id: string; name: string } }) {
  const mission = await getMarketingAiMission(input.missionId)
  if (!mission) throw new Error('MISSION_NOT_FOUND')
  const config = getMarketingAiConfig()
  const commandCodes = mission.commandCodes.slice(0, config.maxCommandsPerMission)
  await updateMarketingAiMissionStatus(mission.id, 'running')
  const results: MarketingAiRun[] = []
  try {
    for (const commandCode of commandCodes) {
      results.push(await executeMarketingAiCommand({
        commandCode,
        objective: mission.objective,
        authorityMode: mission.authorityMode,
        missionId: mission.id,
        context: { ...mission.context, restrictions: mission.restrictions, expectedOutcomes: mission.expectedOutcomes },
        actor: input.actor,
        forceGrounding: commandCode === 'MKT-AI-3000',
      }))
    }
    await updateMarketingAiMissionStatus(mission.id, results.some((run) => run.status === 'needs_review') ? 'needs_review' : 'completed')
    return results
  } catch (error) {
    await updateMarketingAiMissionStatus(mission.id, 'failed')
    throw error
  }
}
