import type {
  Phase36AutonomousRecommendation,
  Phase36CoordinationConflict,
  Phase36DecisionRoute,
  Phase36ExecutiveBriefing,
  Phase36ScenarioSimulation,
} from './phase36-coordination-types';

export function getPhase36HighRiskRecommendations(
  items: Phase36AutonomousRecommendation[]
): Phase36AutonomousRecommendation[] {
  return items.filter((item) => item.risk === 'high' || item.risk === 'critical');
}

export function getPhase36HumanApprovalRoutes(routes: Phase36DecisionRoute[]): Phase36DecisionRoute[] {
  return routes.filter((route) => route.requiresHumanApproval);
}

export function getPhase36HighSeverityConflicts(
  conflicts: Phase36CoordinationConflict[]
): Phase36CoordinationConflict[] {
  return conflicts.filter((conflict) => conflict.severity === 'high' || conflict.severity === 'critical');
}

export function getPhase36DecisionBriefings(
  briefings: Phase36ExecutiveBriefing[]
): Phase36ExecutiveBriefing[] {
  return briefings.filter((briefing) => briefing.decisionNeeded);
}

export function getPhase36AverageSimulationConfidence(
  simulations: Phase36ScenarioSimulation[]
): number {
  if (simulations.length === 0) return 0;
  const total = simulations.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round(total / simulations.length);
}

export function getPhase36AverageRecommendationConfidence(
  recommendations: Phase36AutonomousRecommendation[]
): number {
  if (recommendations.length === 0) return 0;
  const total = recommendations.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round(total / recommendations.length);
}