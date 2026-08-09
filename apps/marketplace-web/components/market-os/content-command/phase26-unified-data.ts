import type {
  Phase26CommandAction,
  Phase26ProductionState,
  Phase26WorkspaceHealth,
  Phase26WorkspaceTab,
} from './phase26-unified-types';

export const phase26WorkspaceTabs: Phase26WorkspaceTab[] = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Unified command overview for the full Content Command Center.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase8Workspace',
    priority: 1,
  },
  {
    key: 'operations',
    label: 'Operations',
    description: 'Production queues, campaign deliverables, orchestration, and workload visibility.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase13OperationsWorkspace',
    priority: 2,
  },
  {
    key: 'management',
    label: 'Management',
    description: 'Create/edit forms, validation, entity management, settings, and service layer.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase10ManagementWorkspace',
    priority: 3,
  },
  {
    key: 'media',
    label: 'Media',
    description: 'Media assets, upload readiness, previews, storage mapping, and version history.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase19MediaWorkspace',
    priority: 4,
  },
  {
    key: 'publishing',
    label: 'Publishing',
    description: 'Publication queue, channel rules, compliance checks, and handoffs.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase21PublishingWorkspace',
    priority: 5,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Attribution, funnels, channel matrix, ROI summaries, and performance views.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase18AnalyticsWorkspace',
    priority: 6,
  },
  {
    key: 'ai',
    label: 'AI Agent',
    description: 'AI tasks, prompt orchestration, outputs, scoring, and safety gates.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase20AiExecutionWorkspace',
    priority: 7,
  },
  {
    key: 'collaboration',
    label: 'Collaboration',
    description: 'Presence, notifications, comments, review sessions, and activity streams.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase17CollaborationWorkspace',
    priority: 8,
  },
  {
    key: 'qa',
    label: 'QA',
    description: 'Safety gates, fallback coverage, audits, and readiness scoring.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase23QaWorkspace',
    priority: 9,
  },
  {
    key: 'executive',
    label: 'Executive',
    description: 'Leadership KPIs, command summaries, decisions, and escalations.',
    status: 'ready',
    recommendedComponent: 'ContentCommandPhase24ExecutiveCommandWorkspace',
    priority: 10,
  },
];

export const phase26CommandActions: Phase26CommandAction[] = [
  {
    id: 'action-create-asset',
    label: 'Create Asset',
    description: 'Open create flow for a new content asset.',
    workspace: 'management',
    enabled: true,
  },
  {
    id: 'action-review-queue',
    label: 'Open Review Queue',
    description: 'Jump to approval and collaboration review layer.',
    workspace: 'collaboration',
    enabled: true,
  },
  {
    id: 'action-run-ai-review',
    label: 'Run AI Review',
    description: 'Send selected content into AI scoring and optimization.',
    workspace: 'ai',
    enabled: true,
  },
  {
    id: 'action-publishing-handoff',
    label: 'Publishing Handoff',
    description: 'Move approved content toward publishing readiness.',
    workspace: 'publishing',
    enabled: true,
  },
  {
    id: 'action-final-qa',
    label: 'Final QA Check',
    description: 'Open QA hardening and production safety checklist.',
    workspace: 'qa',
    enabled: true,
  },
];

export const phase26WorkspaceHealth: Phase26WorkspaceHealth[] = [
  {
    workspace: 'overview',
    readiness: 92,
    blockers: 0,
    notes: 'Unified overview is ready for mounting.',
  },
  {
    workspace: 'operations',
    readiness: 88,
    blockers: 1,
    notes: 'Operational monitoring and orchestration are structured.',
  },
  {
    workspace: 'management',
    readiness: 86,
    blockers: 1,
    notes: 'Forms and repository contracts are ready for backend mapping.',
  },
  {
    workspace: 'media',
    readiness: 84,
    blockers: 2,
    notes: 'Storage buckets and upload flow still require real backend connection.',
  },
  {
    workspace: 'publishing',
    readiness: 83,
    blockers: 2,
    notes: 'Publishing APIs are not connected yet by design.',
  },
  {
    workspace: 'analytics',
    readiness: 82,
    blockers: 2,
    notes: 'Analytics models are ready; live ingestion remains future work.',
  },
  {
    workspace: 'ai',
    readiness: 81,
    blockers: 2,
    notes: 'AI provider execution requires protected backend route later.',
  },
  {
    workspace: 'collaboration',
    readiness: 80,
    blockers: 2,
    notes: 'Realtime providers are modeled but not connected.',
  },
  {
    workspace: 'qa',
    readiness: 89,
    blockers: 0,
    notes: 'QA hardening layer is ready.',
  },
  {
    workspace: 'executive',
    readiness: 87,
    blockers: 1,
    notes: 'Executive command layer is ready for submodule-only usage.',
  },
];

export const phase26DefaultProductionState: Phase26ProductionState = {
  loading: false,
  error: null,
  empty: false,
};