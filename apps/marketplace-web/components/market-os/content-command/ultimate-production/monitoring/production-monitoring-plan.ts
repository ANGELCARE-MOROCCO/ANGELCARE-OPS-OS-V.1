export const productionMonitoringPlan = {
  logs: [
    'server-action-errors',
    'repository-errors',
    'audit-write-failures',
    'publishing-failures',
    'ai-runtime-failures',
  ],
  alerts: [
    'critical blocker created',
    'audit write failure',
    'RLS rejection spike',
    'publishing dispatch failure',
    'AI provider failure',
  ],
};