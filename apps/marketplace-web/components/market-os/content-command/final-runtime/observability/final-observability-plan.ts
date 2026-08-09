export const finalObservabilityPlan = {
  logs: ['mutations', 'publishing', 'ai', 'media', 'authz', 'runtime-errors'],
  metrics: ['latency', 'mutation-failures', 'queue-depth', 'approval-sla', 'publishing-failures'],
  alerts: ['critical-blocker', 'failed-publish', 'ai-provider-error', 'audit-write-failure'],
};