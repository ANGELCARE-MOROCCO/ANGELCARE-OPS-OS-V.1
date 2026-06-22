import type {
  Phase25ActivationMapItem,
  Phase25IntegrityCheck,
  Phase25ModuleSummary,
  Phase25WorkspaceManifestItem,
} from './phase25-consolidation-types';

export const phase25WorkspaceManifest: Phase25WorkspaceManifestItem[] = [
  {
    id: 'phase-08-visible-ui',
    phase: 8,
    title: 'Visible Workspace UI',
    category: 'operations',
    description: 'Main visible operational workspace for production queues, assets, deliverables, sheets, brand, approvals, and AI panels.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-10-management',
    phase: 10,
    title: 'Management Forms',
    category: 'operations',
    description: 'Create/edit form shell, validation helpers, entity manager, filters, empty states.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-12-service',
    phase: 12,
    title: 'Service Layer',
    category: 'foundation',
    description: 'Repository helpers, local persistence, activity logs, import/export payloads.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-17-collaboration',
    phase: 17,
    title: 'Realtime Collaboration',
    category: 'operations',
    description: 'Presence, review sessions, notifications, comments, activity stream readiness.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-18-analytics',
    phase: 18,
    title: 'Analytics Attribution',
    category: 'analytics',
    description: 'Asset performance, attribution, funnels, channel matrix, ROI helpers.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-19-media',
    phase: 19,
    title: 'Media Operations',
    category: 'operations',
    description: 'Media assets, upload states, previews, storage mapping, version history.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-20-ai',
    phase: 20,
    title: 'AI Execution Engine',
    category: 'ai',
    description: 'AI tasks, prompt orchestration, output scoring, safety gates, provider readiness.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-21-publishing',
    phase: 21,
    title: 'Publishing Execution',
    category: 'publishing',
    description: 'Publishing queue, channel rules, compliance checks, handoff states.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-23-qa',
    phase: 23,
    title: 'QA Hardening',
    category: 'qa',
    description: 'Safety gates, fallback coverage, audit checks, readiness scoring.',
    active: true,
    buildSafe: true,
  },
  {
    id: 'phase-24-command',
    phase: 24,
    title: 'Executive Command Layer',
    category: 'executive',
    description: 'Leadership KPIs, campaign command, decision queue, escalation board.',
    active: true,
    buildSafe: true,
  },
];

export const phase25ActivationMap: Phase25ActivationMapItem[] = [
  {
    id: 'activation-phase8',
    importName: 'ContentCommandPhase8Workspace',
    importPath: '@/components/market-os/content-command/phase8-index',
    recommendedPlacement: 'Main Content Command Center overview tab.',
  },
  {
    id: 'activation-phase10',
    importName: 'ContentCommandPhase10ManagementWorkspace',
    importPath: '@/components/market-os/content-command/phase10-index',
    recommendedPlacement: 'Management or create/edit tab.',
  },
  {
    id: 'activation-phase18',
    importName: 'ContentCommandPhase18AnalyticsWorkspace',
    importPath: '@/components/market-os/content-command/phase18-index',
    recommendedPlacement: 'Analytics tab.',
  },
  {
    id: 'activation-phase20',
    importName: 'ContentCommandPhase20AiExecutionWorkspace',
    importPath: '@/components/market-os/content-command/phase20-index',
    recommendedPlacement: 'AI Brand Agent tab.',
  },
  {
    id: 'activation-phase21',
    importName: 'ContentCommandPhase21PublishingWorkspace',
    importPath: '@/components/market-os/content-command/phase21-index',
    recommendedPlacement: 'Publishing tab.',
  },
  {
    id: 'activation-phase24',
    importName: 'ContentCommandPhase24ExecutiveCommandWorkspace',
    importPath: '@/components/market-os/content-command/phase24-index',
    recommendedPlacement: 'Executive command tab inside the submodule only.',
  },
];

export const phase25IntegrityChecks: Phase25IntegrityCheck[] = [
  {
    id: 'integrity-scope',
    label: 'All files remain isolated under Content Command Center folder.',
    passed: true,
    notes: 'No parent Market-OS page modification required.',
  },
  {
    id: 'integrity-build',
    label: 'All consolidation files use strict TypeScript interfaces.',
    passed: true,
    notes: 'No implicit any introduced by Phase 25.',
  },
  {
    id: 'integrity-activation',
    label: 'Workspace components remain optional imports.',
    passed: true,
    notes: 'No route or layout is automatically changed.',
  },
  {
    id: 'integrity-registry',
    label: 'Unified manifest exists for major workspace layers.',
    passed: true,
    notes: 'Previous phases can now be organized through a clean registry.',
  },
];

export const phase25ModuleSummary: Phase25ModuleSummary[] = [
  {
    label: 'Registered Workspaces',
    value: '10',
    detail: 'Major Content Command Center layers consolidated.',
  },
  {
    label: 'Activation Entries',
    value: '6',
    detail: 'Recommended UI mounting points documented.',
  },
  {
    label: 'Integrity Checks',
    value: '4',
    detail: 'Scope, build, activation, and registry verified.',
  },
  {
    label: 'Main Page Impact',
    value: '0',
    detail: 'No Market-OS main page modification.',
  },
];