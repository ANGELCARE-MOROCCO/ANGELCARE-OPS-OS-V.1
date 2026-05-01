export type ScenarioInput = {
  city: string
  current: number
  required: number
  projectedDemandIncrease: number
  averageHiringCost: number
  targetCoverage: number
}

export function calculateScenario(input: ScenarioInput) {
  const projectedRequired = Math.ceil(input.required * (1 + input.projectedDemandIncrease / 100))
  const targetRequired = Math.ceil(projectedRequired * (input.targetCoverage / 100))
  const gap = Math.max(0, targetRequired - input.current)
  const estimatedBudget = gap * input.averageHiringCost

  const urgency =
    gap >= 15 ? 'critical' :
    gap >= 8 ? 'high' :
    gap >= 3 ? 'medium' :
    'controlled'

  const recommendation =
    urgency === 'critical'
      ? 'Launch immediate recruitment sprint, activate Academy bridge, and freeze non-critical allocations.'
      : urgency === 'high'
        ? 'Open targeted city recruitment wave and accelerate readiness validation.'
        : urgency === 'medium'
          ? 'Monitor pipeline and prepare backup candidates.'
          : 'Coverage is controlled. Maintain monitoring.'

  return {
    projectedRequired,
    targetRequired,
    gap,
    estimatedBudget,
    urgency,
    recommendation,
  }
}

export function rankScenarioPortfolio(items: ScenarioInput[]) {
  return items
    .map((item) => ({ ...item, result: calculateScenario(item) }))
    .sort((a, b) => b.result.gap - a.result.gap)
}
