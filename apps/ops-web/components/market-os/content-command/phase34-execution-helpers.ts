import type {
  Phase34DependencyBlocker,
  Phase34ExecutionHealth,
  Phase34ExecutionTask,
  Phase34OperatorLoad,
} from './phase34-execution-types';

export function getPhase34BlockedTasks(tasks: Phase34ExecutionTask[]): Phase34ExecutionTask[] {
  return tasks.filter((task) => task.state === 'blocked');
}

export function getPhase34SlaBreachedTasks(tasks: Phase34ExecutionTask[]): Phase34ExecutionTask[] {
  return tasks.filter((task) => task.elapsedHours > task.slaHours);
}

export function getPhase34CriticalBlockers(blockers: Phase34DependencyBlocker[]): Phase34DependencyBlocker[] {
  return blockers.filter((blocker) => blocker.severity === 'critical' || blocker.severity === 'high');
}

export function getPhase34OverloadedOperators(loads: Phase34OperatorLoad[]): Phase34OperatorLoad[] {
  return loads.filter((load) => load.capacityPercent >= 90 || load.urgentTasks >= 3);
}

export function getPhase34AverageExecutionHealth(items: Phase34ExecutionHealth[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / items.length);
}

export function getPhase34TaskPressure(task: Phase34ExecutionTask): 'normal' | 'pressure' | 'critical' {
  if (task.state === 'blocked' || task.elapsedHours > task.slaHours) return 'critical';
  if (task.priority === 'urgent' || task.elapsedHours > task.slaHours * 0.75) return 'pressure';
  return 'normal';
}