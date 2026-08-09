export const finalRealtimeRuntimePlan = {
  channels: [
    'content-command-presence',
    'content-command-activity',
    'content-command-notifications',
    'content-command-execution',
  ],
  events: [
    'asset.created',
    'asset.updated',
    'approval.requested',
    'approval.completed',
    'publication.blocked',
    'task.escalated',
  ],
};