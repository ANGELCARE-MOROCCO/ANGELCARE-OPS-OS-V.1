import type { RevenueOsObjective } from '../types'
import type { RevenueObjective } from '../strategy-brain/types'
import type { RevenueOperationLaunchInput } from './types'

function nonEmpty(values: string[], fallback: string): string[] {
  const cleaned = values.map((value) => String(value || '').trim()).filter(Boolean)
  return cleaned.length ? cleaned : [fallback]
}

export function mapFoundationObjectiveToStrategyObjective(
  objective: RevenueOsObjective,
  input: RevenueOperationLaunchInput,
  tenantId: string,
  requestedBy: string,
): RevenueObjective {
  return {
    id: objective.id,
    tenantId,
    title: input.title,
    objectiveType: 'revenue_growth',
    businessReason: input.mandate,
    businessUnits: nonEmpty([input.businessUnit], 'AngelCare'),
    targetMarkets: nonEmpty([input.targetMarket], 'Marché AngelCare'),
    targetSegments: nonEmpty(input.targetSegments, 'Compte cible AngelCare'),
    territories: nonEmpty(input.territories, input.targetMarket),
    targetAccounts: input.targetAccounts.map((value) => value.trim()).filter(Boolean),
    revenueTarget: input.revenueTarget,
    marginTarget: input.marginTarget,
    timeHorizon: input.horizon,
    deadline: input.deadline,
    priority: input.priority,
    budgetLimit: input.budgetLimit,
    capacityLimit: input.capacityLimit,
    approvedOffers: input.approvedOffers.map((value) => value.trim()).filter(Boolean),
    excludedOffers: [],
    approvedChannels: nonEmpty(input.approvedChannels, 'internal_tasks'),
    excludedChannels: ['calendar'],
    riskAppetite: input.riskAppetite,
    authorityLevel: input.authorityLevel,
    constraints: input.constraints.map((value) => value.trim()).filter(Boolean),
    successDefinition: nonEmpty(input.successDefinition, `Atteindre le résultat gouverné défini pour ${input.title}.`),
    failureDefinition: nonEmpty(input.failureDefinition, 'Aucune progression mesurable dans l’horizon défini.'),
    requestedBy,
    status: 'ready_for_assembly',
  }
}
