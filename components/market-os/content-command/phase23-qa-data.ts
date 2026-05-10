import type {
  Phase23AuditCheck,
  Phase23FallbackState,
  Phase23ReadinessScore,
  Phase23SafetyGate,
} from './phase23-qa-types';

export const phase23SafetyGates: Phase23SafetyGate[] = [
  {
    id: 'gate-scope',
    title: 'Submodule scope isolation',
    area: 'Architecture',
    severity: 'critical',
    passed: true,
    recommendation: 'Keep all files inside components/market-os/content-command.',
  },
  {
    id: 'gate-ts',
    title: 'TypeScript explicit contracts',
    area: 'Build Safety',
    severity: 'critical',
    passed: true,
    recommendation: 'Continue using typed interfaces for every model and workspace.',
  },
  {
    id: 'gate-parent',
    title: 'No parent Market-OS modification',
    area: 'Routing',
    severity: 'critical',
    passed: true,
    recommendation: 'Do not patch the Market-OS main page from this pack.',
  },
];

export const phase23FallbackStates: Phase23FallbackState[] = [
  { id: 'fallback-empty', component: 'Content Library', fallbackType: 'empty', implemented: true },
  { id: 'fallback-loading', component: 'Repository Adapter', fallbackType: 'loading', implemented: true },
  { id: 'fallback-error', component: 'Publishing Queue', fallbackType: 'error', implemented: true },
  { id: 'fallback-permission', component: 'Approvals', fallbackType: 'permission', implemented: false },
  { id: 'fallback-offline', component: 'Realtime Collaboration', fallbackType: 'offline', implemented: false },
];

export const phase23AuditChecks: Phase23AuditCheck[] = [
  { id: 'audit-001', title: 'No global provider edits required', category: 'scope', passed: true },
  { id: 'audit-002', title: 'All phase exports are local', category: 'typescript', passed: true },
  { id: 'audit-003', title: 'UI workspaces are optional imports', category: 'ui', passed: true },
  { id: 'audit-004', title: 'Data layer remains backend-ready but not forced', category: 'data', passed: true },
  { id: 'audit-005', title: 'Workflow states are typed', category: 'workflow', passed: true },
];

export const phase23ReadinessScores: Phase23ReadinessScore[] = [
  { label: 'Architecture Safety', score: 95 },
  { label: 'TypeScript Safety', score: 92 },
  { label: 'UI Fallback Readiness', score: 78 },
  { label: 'Workflow QA', score: 88 },
  { label: 'Integration Safety', score: 84 },
];