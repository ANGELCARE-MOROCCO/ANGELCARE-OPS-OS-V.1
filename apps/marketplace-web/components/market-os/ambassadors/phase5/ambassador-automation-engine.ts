import type {
  AmbassadorAutomationPriority,
  AmbassadorAutomationRule,
  AmbassadorExecutionTask,
  AmbassadorPhase5Snapshot,
} from "./ambassador-automation-types";

export type AmbassadorAutomationMetrics = {
  activeRules: number;
  pausedRules: number;
  criticalRules: number;
  averageSuccessRate: number;
  openTasks: number;
  overdueRiskTasks: number;
  activeEscalations: number;
  queuedNotifications: number;
  executionReadinessScore: number;
};

export function getPriorityWeight(priority: AmbassadorAutomationPriority): number {
  const weights: Record<AmbassadorAutomationPriority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return weights[priority];
}

export function calculateAverageSuccessRate(rules: AmbassadorAutomationRule[]): number {
  if (rules.length === 0) return 0;
  const total = rules.reduce((sum, rule) => sum + rule.successRate, 0);
  return Math.round(total / rules.length);
}

export function isTaskAtRisk(task: AmbassadorExecutionTask, todayIso = new Date().toISOString()): boolean {
  if (task.status === "done") return false;

  const today = todayIso.slice(0, 10);
  return task.priority === "critical" || task.dueDate <= today;
}

export function calculateExecutionReadinessScore(snapshot: AmbassadorPhase5Snapshot): number {
  const activeRules = snapshot.rules.filter((rule) => rule.status === "active").length;
  const averageSuccess = calculateAverageSuccessRate(snapshot.rules);
  const blockedStages = snapshot.workflowStages.filter((stage) => stage.status === "blocked").length;
  const activeEscalations = snapshot.escalations.filter((item) => item.status !== "resolved").length;
  const atRiskTasks = snapshot.tasks.filter((task) => isTaskAtRisk(task)).length;

  const ruleCoverage = Math.min(100, activeRules * 14);
  const penalty = blockedStages * 8 + activeEscalations * 6 + atRiskTasks * 4;
  const score = Math.round((ruleCoverage + averageSuccess) / 2 - penalty);

  return Math.max(0, Math.min(100, score));
}

export function getAmbassadorAutomationMetrics(snapshot: AmbassadorPhase5Snapshot): AmbassadorAutomationMetrics {
  const activeRules = snapshot.rules.filter((rule) => rule.status === "active").length;
  const pausedRules = snapshot.rules.filter((rule) => rule.status === "paused").length;
  const criticalRules = snapshot.rules.filter((rule) => rule.priority === "critical").length;
  const averageSuccessRate = calculateAverageSuccessRate(snapshot.rules);
  const openTasks = snapshot.tasks.filter((task) => task.status !== "done").length;
  const overdueRiskTasks = snapshot.tasks.filter((task) => isTaskAtRisk(task)).length;
  const activeEscalations = snapshot.escalations.filter((item) => item.status !== "resolved").length;
  const queuedNotifications = snapshot.notifications.filter((item) => item.status === "queued").length;
  const executionReadinessScore = calculateExecutionReadinessScore(snapshot);

  return {
    activeRules,
    pausedRules,
    criticalRules,
    averageSuccessRate,
    openTasks,
    overdueRiskTasks,
    activeEscalations,
    queuedNotifications,
    executionReadinessScore,
  };
}

export function sortRulesByPriority(rules: AmbassadorAutomationRule[]): AmbassadorAutomationRule[] {
  return [...rules].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
}
