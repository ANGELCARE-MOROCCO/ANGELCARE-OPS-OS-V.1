import type {
  Phase31ApiEndpoint,
  Phase31ApiQaCheck,
  Phase31EndpointRisk,
  Phase31ServerActionPlan,
} from './phase31-api-types';

export function getPhase31ReadyEndpoints(endpoints: Phase31ApiEndpoint[]): Phase31ApiEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.readyForImplementation);
}

export function getPhase31HighRiskEndpoints(endpoints: Phase31ApiEndpoint[]): Phase31ApiEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.risk === 'high' || endpoint.risk === 'critical');
}

export function getPhase31FailedQaChecks(checks: Phase31ApiQaCheck[]): Phase31ApiQaCheck[] {
  return checks.filter((check) => !check.passed);
}

export function getPhase31AuditedServerActions(actions: Phase31ServerActionPlan[]): Phase31ServerActionPlan[] {
  return actions.filter((action) => action.requiresAudit);
}

export function getPhase31RiskRank(risk: Phase31EndpointRisk): number {
  const rank: Record<Phase31EndpointRisk, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return rank[risk];
}