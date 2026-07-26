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
  if (command.status !== 'active' || !command.deployed) throw new Error(`COMMAND_NOT_DEPLOYED:${input.commandCode}`)
  const authorityMode = input.authorityMode || command.authorityMode
  const serialized = JSON.stringify({ objective: input.objective, context: input.context, instruction: command.instruction })
  if (EXTERNAL_ACTION_PATTERN.test(serialized)) {
    await recordGuardrailEvent({ actorId: input.actor.id, commandCode: command.code, requestedAction: 'external_action', reason: 'External communication and publication are permanently blocked.', payload: { objective: input.objective } })
    throw new Error('EXTERNAL_ACTION_BLOCKED')
  }
  const config = getMarketingAiConfig()
  await assertMarketingAiRunBudget(input.actor.id, config.maxRunsPerHour, config.maxTokensPerDay)
  const run = await createMarketingAiRun({ command, objective: input.objective, authorityMode, missionId: input.missionId, scheduleId: input.scheduleId, context: input.context, actorId: input.actor.id })
  try {
    const generated = await generateMarketingAiOutput({ command, objective: input.objective, authorityMode, context: input.context, forceGrounding: input.forceGrounding })
    for (const action of generated.output.internalActions) {
      if (EXTERNAL_ACTION_PATTERN.test(`${action.type} ${action.title} ${action.description} ${JSON.stringify(action.payload)}`)) {
        await recordGuardrailEvent({ actorId: input.actor.id, runId: run.id, commandCode: command.code, requestedAction: action.type, reason: 'Model proposed an external action; action removed.', payload: action.payload })
        action.type = 'none'
        action.title = 'Action externe bloquée'
        action.description = 'La proposition a été neutralisée par la frontière d’autorité SANILA.'
        action.payload = {}
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
      await recordResourceUpdate({ actorId: input.actor.id, runId: run.id, title: `Mise à jour ressources Gemini & marketing · ${new Date().toISOString().slice(0, 7)}`, domains: config.monthlyResourceDomains, summary: generated.output.executiveSummary, sources: generated.output.evidence, recommendations: generated.output.recommendations })
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
