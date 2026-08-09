export const runtimeFusionManifest = {
  readiness: {
    architecture: 92,
    governance: 90,
    coordination: 88,
    runtime: 74,
    realtime: 61,
    aiExecution: 57,
    publishing: 63,
  },

  priorities: [
    'stabilize imports',
    'wire repositories',
    'activate audit persistence',
    'enable realtime synchronization',
    'protect server actions',
    'enable controlled publishing',
    'activate AI review runtime',
  ],

  deploymentOrder: [
    'ui-shell',
    'repositories',
    'read-runtime',
    'safe-mutations',
    'audit-log',
    'realtime-events',
    'publishing-runtime',
    'ai-runtime',
  ],
}