import type {
  Phase20AiOutput,
  Phase20AiSafetyGate,
  Phase20AiTask,
  Phase20AiTaskStatus,
} from './phase20-ai-types';

export function getPhase20TaskStatusLabel(status: Phase20AiTaskStatus): string {
  const labels: Record<Phase20AiTaskStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    needs_review: 'Needs review',
    approved: 'Approved',
    rejected: 'Rejected',
    failed: 'Failed',
  };

  return labels[status];
}

export function getPhase20TasksNeedingReview(tasks: Phase20AiTask[]): Phase20AiTask[] {
  return tasks.filter((task) => task.status === 'needs_review');
}

export function getPhase20HighRiskTasks(tasks: Phase20AiTask[]): Phase20AiTask[] {
  return tasks.filter((task) => task.riskLevel === 'high');
}

export function getPhase20AverageQuality(outputs: Phase20AiOutput[]): number {
  if (outputs.length === 0) return 0;
  const total = outputs.reduce((sum, output) => sum + output.qualityScore, 0);
  return Math.round(total / outputs.length);
}

export function getPhase20FailedSafetyGates(gates: Phase20AiSafetyGate[]): Phase20AiSafetyGate[] {
  return gates.filter((gate) => gate.required && !gate.passed);
}