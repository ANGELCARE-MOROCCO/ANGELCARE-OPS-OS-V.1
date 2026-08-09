import { getMarketingAiMission, listMarketingAiRuns } from './repository'
import { assembleMarketingAutopilotContext } from './context-assembler'
import { createCompilation, createCompilationItems, getCompilation } from './phase3-repository'
import type { MarketingAiInternalAction, MarketingAiRun } from './types'
import type { Phase3CompilationItem, Phase3ToolName } from './phase3-types'

const ACTION_MAP: Record<MarketingAiInternalAction['type'], { itemType: Phase3CompilationItem['itemType']; toolName: Phase3ToolName; workspace: string }> = {
  create_brief: { itemType: 'brief', toolName: 'brief.create', workspace: '/market-os/content-command-center/briefs' },
  create_content_draft: { itemType: 'content', toolName: 'content.create_draft', workspace: '/market-os/content-command-center' },
  create_task_plan: { itemType: 'task', toolName: 'task.create', workspace: '/market-os/content-command-center/tasks' },
  create_asset_requirement: { itemType: 'asset_requirement', toolName: 'asset.requirement_create', workspace: '/market-os/content-command-center/assets' },
  request_review: { itemType: 'review', toolName: 'review.request', workspace: '/market-os/content-command-center/review' },
  propose_schedule: { itemType: 'schedule', toolName: 'schedule.propose', workspace: '/market-os/content-command-center/calendar' },
  prepare_publishing_package: { itemType: 'publishing_package', toolName: 'publishing_package.prepare', workspace: '/market-os/content-command-center/publishing' },
  classify_content: { itemType: 'content', toolName: 'asset.classify', workspace: '/market-os/content-command-center/assets' },
  record_learning: { itemType: 'learning', toolName: 'learning.record', workspace: '/market-os/content-command-center/ai-director/learning' },
  store_bridge_object: { itemType: 'asset_requirement', toolName: 'bridge.store', workspace: '/market-os/content-command-center/ai-director/repository' },
  none: { itemType: 'learning', toolName: 'learning.record', workspace: '/market-os/content-command-center/ai-director/learning' },
}

function deriveRisk(runs: MarketingAiRun[]) {
  const hasDecision = runs.some((run) => run.output?.humanDecisionRequired)
  const critical = runs.some((run) => run.output?.risks?.some((risk) => risk.level === 'critical'))
  return critical ? 'critical' : hasDecision ? 'high' : 'medium'
}

function actionsFromRuns(runs: MarketingAiRun[]) {
  return runs.flatMap((run) => (run.output?.internalActions || []).filter((action) => action.type !== 'none').map((action) => ({ run, action })))
}

function fallbackItems(mission: Awaited<ReturnType<typeof getMarketingAiMission>>) {
  if (!mission) return []
  const expected = mission.expectedOutcomes.length ? mission.expectedOutcomes : ['Préparer le plan de contenu', 'Créer les tâches internes', 'Préparer la revue humaine']
  return expected.map((outcome, index): Omit<Phase3CompilationItem,'id'|'compilationId'|'createdAt'|'updatedAt'> => ({
    sequence: index + 1,
    itemType: index === 0 ? 'brief' : index === 1 ? 'task' : 'review',
    title: outcome,
    description: `Sortie compilée depuis le mandat ${mission.title}.`,
    toolName: index === 0 ? 'brief.create' : index === 1 ? 'task.create' : 'review.request',
    targetWorkspace: index === 0 ? '/market-os/content-command-center/briefs' : index === 1 ? '/market-os/content-command-center/tasks' : '/market-os/content-command-center/review',
    payload: { objective: mission.objective, missionId: mission.id, outcome, source: 'phase3_compiler' },
    dependencies: index === 0 ? [] : [`sequence:${index}`],
    requiresApproval: true,
    status: 'proposed',
    canonicalRecordId: null,
    canonicalTable: null,
    mirrorState: null,
    error: null,
  }))
}

export async function compileMarketingMission(input: { missionId: string; strategyRunId?: string | null; actor: { id: string; name: string }; title?: string }) {
  const mission = await getMarketingAiMission(input.missionId)
  if (!mission) throw new Error('MISSION_NOT_FOUND')
  if (!['approved','needs_review','completed'].includes(mission.status)) throw new Error('MISSION_NOT_READY_FOR_COMPILATION')
  const allRuns = await listMarketingAiRuns(300)
  const missionRuns = allRuns.filter((run) => run.missionId === mission.id && (!input.strategyRunId || run.id === input.strategyRunId))
  const context = await assembleMarketingAutopilotContext({ restrictions: mission.restrictions, missionContext: mission.context })
  const strategyRunId = input.strategyRunId || missionRuns[0]?.id || null
  const compilation = await createCompilation({
    compilationKey: `mission:${mission.id}:run:${strategyRunId || 'none'}:v1`,
    missionId: mission.id,
    strategyRunId,
    title: input.title || `Plan d’exécution · ${mission.title}`,
    objective: mission.objective,
    authorityMode: mission.authorityMode,
    riskLevel: deriveRisk(missionRuns),
    contextSnapshot: context,
    summary: {
      commandCodes: mission.commandCodes,
      runIds: missionRuns.map((run) => run.id),
      expectedOutcomes: mission.expectedOutcomes,
      restrictions: mission.restrictions,
      sourceCount: context.sources.length,
      unavailableSources: context.missing,
    },
    createdBy: input.actor.id,
  })
  const actionPairs = actionsFromRuns(missionRuns)
  const items = actionPairs.length ? actionPairs.map(({ run, action }, index): Omit<Phase3CompilationItem,'id'|'compilationId'|'createdAt'|'updatedAt'> => {
    const mapped = ACTION_MAP[action.type]
    return {
      sequence: index + 1,
      itemType: mapped.itemType,
      title: action.title,
      description: action.description,
      toolName: mapped.toolName,
      targetWorkspace: mapped.workspace,
      payload: { ...action.payload, objective: mission.objective, missionId: mission.id, runId: run.id, commandCode: run.commandCode, source: 'phase3_compiler' },
      dependencies: index === 0 ? [] : [`sequence:${index}`],
      requiresApproval: action.requiresApproval || mission.authorityMode !== 'orchestrate_internal',
      status: 'proposed', canonicalRecordId: null, canonicalTable: null, mirrorState: null, error: null,
    }
  }) : fallbackItems(mission)
  await createCompilationItems(compilation.id, items)
  return getCompilation(compilation.id)
}
