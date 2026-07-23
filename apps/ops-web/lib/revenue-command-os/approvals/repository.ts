import 'server-only'

import { listStudioStrategies, loadStudioDossier } from '../strategy-studio/repository'
import type { ApprovalDeskItem, ApprovalDeskResponse } from './types'
import type { ApprovalClass, StrategyStudioDossier, StudioStatus } from '../strategy-studio/types'

const terminalStatuses = new Set<StudioStatus>([
  'approved',
  'rejected',
  'archived',
  'approval_expired',
  'approval_revoked',
  'superseded',
  'ready_for_mz13',
])

function finiteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function findRevenueValue(value: unknown, path = ''): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && /revenue|revenu|ca|turnover/i.test(path)) return value
  if (!value || typeof value !== 'object') return undefined
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const found = findRevenueValue(nested, `${path}.${key}`)
    if (found !== undefined) return found
  }
  return undefined
}

function money(value: number | undefined): string {
  if (value === undefined) return 'Impact non chiffré'
  return `${Math.round(value).toLocaleString('fr-FR')} Dh`
}

function riskLabel(probability: number, impact: number): string {
  const score = probability * impact
  if (score >= 0.55) return 'Élevé'
  if (score >= 0.25) return 'Moyen'
  return 'Maîtrisé'
}

function approvalClassLabel(value: ApprovalClass): string {
  const labels: Record<ApprovalClass, string> = {
    standard: 'Stratégique',
    financial: 'Finance & marge',
    capacity: 'Capacité',
    managing_director: 'Direction générale',
    multi_director: 'Comité de direction',
    conditional_pilot: 'Pilote conditionnel',
    high_risk_exception: 'Exception à risque élevé',
  }
  return labels[value]
}

export async function readApprovalDesk(tenantId: string): Promise<ApprovalDeskResponse> {
  const strategyRows = await listStudioStrategies(tenantId)
  const warnings: string[] = []
  const dossiers: PromiseSettledResult<StrategyStudioDossier>[] = await Promise.allSettled(
    strategyRows
      .slice(0, 40)
      .map(
        (entry: { id: string }): Promise<StrategyStudioDossier> =>
          loadStudioDossier(entry.id, tenantId),
      ),
  )

  const data: ApprovalDeskItem[] = []

  dossiers.forEach((result, index) => {
    if (result.status === 'rejected') {
      const strategyId = strategyRows[index]?.id || `index-${index}`
      warnings.push(`Le dossier ${strategyId} n'a pas pu être chargé.`)
      return
    }

    const dossier = result.value
    const strategy = dossier.strategy
    const approval = dossier.approval
    const approvalClass: ApprovalClass = approval?.approvalClass || 'managing_director'
    const maximumRisk = strategy.risks.reduce(
      (best, current) => {
        const probability = finiteNumber(current.probability) ?? 0
        const impact = finiteNumber(current.impact) ?? 0
        return probability * impact > best.probability * best.impact ? { probability, impact } : best
      },
      { probability: 0, impact: 0 },
    )
    const blockingEvidence = dossier.evidence.filter((entry) => entry.blocking).length
    const contradictions = dossier.context.contradictions.length
    const unknowns = dossier.context.unknowns.length
    const councilReady = dossier.council.classification?.readyForMZ12 ? 1 : 0
    const completeness = Math.max(
      0,
      Math.min(100, Math.round(60 + councilReady * 25 - blockingEvidence * 8 - contradictions * 5 - unknowns * 2)),
    )
    const revenue = findRevenueValue(strategy.predictedResults) ?? finiteNumber(dossier.objective.revenueTarget)
    const conditionsText = approval?.conditions?.length
      ? approval.conditions.map((condition) => condition.label).join('\n')
      : 'Décision limitée au périmètre validé. Toute action externe reste bloquée et soumise à une autorisation distincte.'

    data.push({
      strategyId: strategy.id,
      strategyVersion: strategy.version,
      requestId: approval?.id,
      code: strategy.code,
      title: dossier.objective.title || strategy.thesis || strategy.code,
      category: approvalClassLabel(approvalClass),
      status: dossier.status,
      approvalClass,
      impact: money(revenue),
      deadline: dossier.objective.deadline || dossier.objective.timeHorizon || 'Sans échéance formelle',
      risk: riskLabel(maximumRisk.probability, maximumRisk.impact),
      completeness,
      whyNow: dossier.objective.businessReason || strategy.businessProblem || 'Décision stratégique soumise à l’autorité humaine.',
      authorizedScope: strategy.thesis || strategy.valueProposition || 'Périmètre stratégique documenté dans le dossier.',
      alternative: strategy.fallbackPlan[0] || 'Retour au Conseil stratégique pour nouvelle analyse.',
      exitCondition: strategy.stopConditions[0] || 'Arrêt immédiat si une condition de sécurité, de marge ou de capacité n’est plus satisfaite.',
      conditionsText,
      traceId: `approval:${approval?.id || strategy.id}`,
      canDecide: !terminalStatuses.has(dossier.status),
      externalActions: 0,
    })
  })

  data.sort((left, right) => {
    if (left.canDecide !== right.canDecide) return left.canDecide ? -1 : 1
    return right.completeness - left.completeness
  })

  return { ok: true, data, warnings, mode: 'live-shadow', externalActions: 0 }
}
