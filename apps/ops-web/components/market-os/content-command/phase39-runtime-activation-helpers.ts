import type {
  Phase39ActivationScore,
  Phase39ActivationStep,
  Phase39LiveRepositoryContract,
  Phase39RuntimeRiskItem,
  Phase39ServerActionScaffold,
} from './phase39-runtime-activation-types';

export function getPhase39BlockedSteps(steps: Phase39ActivationStep[]): Phase39ActivationStep[] {
  return steps.filter((step) => step.state === 'blocked');
}

export function getPhase39ReadyRepositories(repositories: Phase39LiveRepositoryContract[]): Phase39LiveRepositoryContract[] {
  return repositories.filter((repository) => repository.state === 'ready_to_wire');
}

export function getPhase39BlockedServerActions(actions: Phase39ServerActionScaffold[]): Phase39ServerActionScaffold[] {
  return actions.filter((action) => action.state === 'blocked');
}

export function getPhase39CriticalRisks(risks: Phase39RuntimeRiskItem[]): Phase39RuntimeRiskItem[] {
  return risks.filter((risk) => risk.severity === 'critical');
}

export function getPhase39AverageActivationScore(scores: Phase39ActivationScore[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, score) => sum + score.score, 0);
  return Math.round(total / scores.length);
}