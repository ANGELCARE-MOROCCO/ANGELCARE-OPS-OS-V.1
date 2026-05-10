import type {
  Phase33ConnectionScore,
  Phase33CutoverChecklistItem,
  Phase33Dependency,
  Phase33ReadinessItem,
} from './phase33-implementation-types';

export const phase33ReadinessItems: Phase33ReadinessItem[] = [
  {
    id: 'ready-data',
    area: 'data',
    title: 'Supabase repository connection',
    state: 'ready_to_connect',
    priority: 'critical',
    nextStep: 'Convert repository adapter contracts into real Supabase queries after schema confirmation.',
  },
  {
    id: 'ready-api',
    area: 'api',
    title: 'Protected API route implementation',
    state: 'ready_to_connect',
    priority: 'critical',
    nextStep: 'Create server-side API routes from Phase 31 contracts.',
  },
  {
    id: 'ready-media',
    area: 'media',
    title: 'Media upload pipeline',
    state: 'ready_to_connect',
    priority: 'high',
    nextStep: 'Map Phase 19 storage buckets to Supabase Storage or a selected media provider.',
  },
  {
    id: 'ready-ai',
    area: 'ai',
    title: 'AI provider execution',
    state: 'ready_to_connect',
    priority: 'high',
    nextStep: 'Create protected server action/API route for AI task execution.',
  },
  {
    id: 'ready-analytics',
    area: 'analytics',
    title: 'Analytics ingestion',
    state: 'mock',
    priority: 'medium',
    nextStep: 'Define first-party manual analytics logging before external platform integrations.',
  },
  {
    id: 'ready-publishing',
    area: 'publishing',
    title: 'Publishing handoff',
    state: 'mock',
    priority: 'medium',
    nextStep: 'Keep manual handoff first, then add external publishing provider later.',
  },
  {
    id: 'ready-realtime',
    area: 'realtime',
    title: 'Realtime collaboration',
    state: 'mock',
    priority: 'medium',
    nextStep: 'Connect presence and notifications after core data layer is live.',
  },
  {
    id: 'ready-permissions',
    area: 'permissions',
    title: 'Permission enforcement',
    state: 'ready_to_connect',
    priority: 'critical',
    nextStep: 'Map Phase 32 permission matrix into actual app role source.',
  },
  {
    id: 'ready-qa',
    area: 'qa',
    title: 'Production QA gates',
    state: 'ready_to_connect',
    priority: 'high',
    nextStep: 'Attach QA checks to real mutations and publication workflow.',
  },
];

export const phase33Dependencies: Phase33Dependency[] = [
  {
    id: 'dep-schema-before-repo',
    title: 'Schema before repository live connection',
    dependsOn: ['Phase 29 schema confirmation', 'Phase 30 migration review'],
    blocker: 'Database tables must exist before repository adapters go live.',
    resolved: false,
  },
  {
    id: 'dep-permissions-before-rls',
    title: 'Permissions before RLS',
    dependsOn: ['Phase 32 permission matrix', 'Actual user role source'],
    blocker: 'RLS policies need real role source.',
    resolved: false,
  },
  {
    id: 'dep-api-before-ai',
    title: 'API before AI execution',
    dependsOn: ['Protected API route', 'Server-side AI provider key'],
    blocker: 'AI keys must never run client-side.',
    resolved: false,
  },
  {
    id: 'dep-storage-before-media',
    title: 'Storage before media upload',
    dependsOn: ['Storage bucket creation', 'Upload permission policy'],
    blocker: 'Media upload requires configured storage provider.',
    resolved: false,
  },
];

export const phase33CutoverChecklist: Phase33CutoverChecklistItem[] = [
  {
    id: 'cutover-backup',
    label: 'Confirm Supabase backup before database migration',
    completed: false,
    risk: 'critical',
  },
  {
    id: 'cutover-schema',
    label: 'Approve final table names and relationships',
    completed: false,
    risk: 'critical',
  },
  {
    id: 'cutover-roles',
    label: 'Confirm actual role/permission source',
    completed: false,
    risk: 'critical',
  },
  {
    id: 'cutover-api',
    label: 'Create protected API routes only after schema is live',
    completed: false,
    risk: 'high',
  },
  {
    id: 'cutover-media',
    label: 'Create storage buckets and upload policies',
    completed: false,
    risk: 'high',
  },
  {
    id: 'cutover-ai',
    label: 'Store AI provider keys server-side only',
    completed: false,
    risk: 'critical',
  },
];

export const phase33ConnectionScores: Phase33ConnectionScore[] = [
  {
    label: 'Data Layer',
    score: 86,
    recommendation: 'Strong readiness, pending schema execution.',
  },
  {
    label: 'API Layer',
    score: 82,
    recommendation: 'Contracts are defined; runtime routes still pending.',
  },
  {
    label: 'Media Layer',
    score: 78,
    recommendation: 'Storage plan is ready; provider must be configured.',
  },
  {
    label: 'AI Layer',
    score: 80,
    recommendation: 'AI orchestration ready; protected backend execution needed.',
  },
  {
    label: 'Governance',
    score: 88,
    recommendation: 'Permission planning is strong; live role mapping needed.',
  },
];