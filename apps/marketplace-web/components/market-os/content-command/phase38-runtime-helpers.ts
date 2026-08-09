import type {
  Phase38CutoverStage,
  Phase38MutationBlueprint,
  Phase38RuntimeAdapter,
  Phase38RuntimeGuardrail,
  Phase38RuntimeScore,
} from './phase38-runtime-types';

export function getPhase38ReadyAdapters(adapters: Phase38RuntimeAdapter[]): Phase38RuntimeAdapter[] {
  return adapters.filter((adapter) => adapter.status === 'ready_to_wire' || adapter.status === 'contract_ready');
}

export function getPhase38BlockedAdapters(adapters: Phase38RuntimeAdapter[]): Phase38RuntimeAdapter[] {
  return adapters.filter((adapter) => adapter.status === 'blocked');
}

export function getPhase38HumanApprovedMutations(mutations: Phase38MutationBlueprint[]): Phase38MutationBlueprint[] {
  return mutations.filter((mutation) => mutation.safety === 'human_approved');
}

export function getPhase38BlockedCutoverStages(stages: Phase38CutoverStage[]): Phase38CutoverStage[] {
  return stages.filter((stage) => stage.blockedBy.length > 0);
}

export function getPhase38EnabledGuardrails(guardrails: Phase38RuntimeGuardrail[]): Phase38RuntimeGuardrail[] {
  return guardrails.filter((guardrail) => guardrail.enabled);
}

export function getPhase38AverageRuntimeScore(scores: Phase38RuntimeScore[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / scores.length);
}