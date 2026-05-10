import type {
  Phase39ActivationScore,
  Phase39ActivationStep,
  Phase39EnvironmentCheck,
  Phase39LiveRepositoryContract,
  Phase39RuntimeRiskItem,
  Phase39ServerActionScaffold,
} from './phase39-runtime-activation-types';

export const phase39EnvironmentChecks: Phase39EnvironmentCheck[] = [
  {
    id: 'env-url',
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    purpose: 'Client-safe Supabase project URL.',
    safeClientExposure: true,
  },
  {
    id: 'env-anon',
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    purpose: 'Client-safe anonymous public key for RLS-protected access.',
    safeClientExposure: true,
  },
  {
    id: 'env-service',
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    purpose: 'Server-only privileged operations. Never expose client-side.',
    safeClientExposure: false,
  },
  {
    id: 'env-openai',
    key: 'OPENAI_API_KEY',
    required: false,
    purpose: 'Server-only AI execution provider key.',
    safeClientExposure: false,
  },
];

export const phase39RepositoryContracts: Phase39LiveRepositoryContract[] = [
  {
    id: 'repo-assets-live',
    entity: 'Content Assets',
    tableName: 'market_content_assets',
    requiredMethods: ['list', 'getById', 'create', 'update', 'archive'],
    state: 'ready_to_wire',
    risk: 'medium',
  },
  {
    id: 'repo-deliverables-live',
    entity: 'Campaign Deliverables',
    tableName: 'market_content_deliverables',
    requiredMethods: ['list', 'create', 'update', 'markBlocked', 'complete'],
    state: 'ready_to_wire',
    risk: 'medium',
  },
  {
    id: 'repo-approvals-live',
    entity: 'Approvals',
    tableName: 'market_content_approvals',
    requiredMethods: ['listPending', 'requestApproval', 'approve', 'reject'],
    state: 'needs_review',
    risk: 'high',
  },
  {
    id: 'repo-audit-live',
    entity: 'Audit Log',
    tableName: 'market_content_audit_log',
    requiredMethods: ['recordEvent', 'listForEntity', 'listRecent'],
    state: 'needs_review',
    risk: 'high',
  },
];

export const phase39ServerActionScaffolds: Phase39ServerActionScaffold[] = [
  {
    id: 'action-create',
    actionName: 'createContentCommandAsset',
    mutationType: 'create',
    serverOnly: true,
    requiresAudit: true,
    requiresPermission: true,
    state: 'ready_to_wire',
  },
  {
    id: 'action-update',
    actionName: 'updateContentCommandAsset',
    mutationType: 'update',
    serverOnly: true,
    requiresAudit: true,
    requiresPermission: true,
    state: 'ready_to_wire',
  },
  {
    id: 'action-approval',
    actionName: 'approveContentCommandItem',
    mutationType: 'approve',
    serverOnly: true,
    requiresAudit: true,
    requiresPermission: true,
    state: 'needs_review',
  },
  {
    id: 'action-publish',
    actionName: 'queueContentCommandPublication',
    mutationType: 'publish',
    serverOnly: true,
    requiresAudit: true,
    requiresPermission: true,
    state: 'blocked',
  },
  {
    id: 'action-ai',
    actionName: 'runContentCommandAiAction',
    mutationType: 'ai_execute',
    serverOnly: true,
    requiresAudit: true,
    requiresPermission: true,
    state: 'blocked',
  },
];

export const phase39ActivationSteps: Phase39ActivationStep[] = [
  {
    id: 'step-env',
    area: 'environment',
    title: 'Verify environment variables',
    order: 1,
    state: 'ready_to_wire',
    risk: 'medium',
    instruction: 'Confirm Supabase public keys are present and provider secrets remain server-only.',
  },
  {
    id: 'step-schema',
    area: 'supabase',
    title: 'Confirm schema migration completed',
    order: 2,
    state: 'blocked',
    risk: 'critical',
    instruction: 'Run SQL only after backup, table review, and role model confirmation.',
  },
  {
    id: 'step-repo',
    area: 'repository',
    title: 'Wire repository adapters',
    order: 3,
    state: 'ready_to_wire',
    risk: 'medium',
    instruction: 'Replace in-memory adapters with Supabase-backed implementations after schema exists.',
  },
  {
    id: 'step-server-actions',
    area: 'server_action',
    title: 'Add protected server actions',
    order: 4,
    state: 'needs_review',
    risk: 'high',
    instruction: 'Implement mutating operations server-side with validation, permissions, audit, and rollback.',
  },
  {
    id: 'step-crud',
    area: 'crud',
    title: 'Activate safe CRUD flows',
    order: 5,
    state: 'needs_review',
    risk: 'high',
    instruction: 'Start with list/read, then create/update, then approvals, then publishing.',
  },
  {
    id: 'step-audit',
    area: 'audit',
    title: 'Activate audit persistence',
    order: 6,
    state: 'needs_review',
    risk: 'high',
    instruction: 'Every mutation must write an audit event before production launch.',
  },
  {
    id: 'step-qa',
    area: 'qa',
    title: 'Run runtime QA pass',
    order: 7,
    state: 'ready_to_wire',
    risk: 'medium',
    instruction: 'Validate permissions, rollback, empty states, loading states, and error boundaries.',
  },
];

export const phase39RuntimeRisks: Phase39RuntimeRiskItem[] = [
  {
    id: 'risk-service-key',
    risk: 'Service role key exposed client-side',
    severity: 'critical',
    mitigation: 'Never reference SUPABASE_SERVICE_ROLE_KEY from client components.',
  },
  {
    id: 'risk-no-rls',
    risk: 'Tables used before RLS is correctly enforced',
    severity: 'critical',
    mitigation: 'Do not connect live CRUD until RLS policies are reviewed.',
  },
  {
    id: 'risk-no-audit',
    risk: 'Mutations occur without audit persistence',
    severity: 'high',
    mitigation: 'Require audit event for each mutating server action.',
  },
  {
    id: 'risk-publish-direct',
    risk: 'Publishing action executes without human approval',
    severity: 'critical',
    mitigation: 'Keep publication actions queued and human-approved.',
  },
  {
    id: 'risk-ai-direct',
    risk: 'AI output bypasses review',
    severity: 'high',
    mitigation: 'Route AI output into review state before use.',
  },
];

export const phase39ActivationScores: Phase39ActivationScore[] = [
  {
    label: 'Environment Readiness',
    score: 84,
    blocker: 'Server-only secrets must be verified manually.',
  },
  {
    label: 'Repository Readiness',
    score: 82,
    blocker: 'Requires final schema migration.',
  },
  {
    label: 'Server Action Readiness',
    score: 74,
    blocker: 'Requires permission and audit enforcement.',
  },
  {
    label: 'CRUD Activation Safety',
    score: 71,
    blocker: 'Start with read/list before mutating flows.',
  },
  {
    label: 'Runtime Governance',
    score: 86,
    blocker: 'Human approval boundaries are defined but not enforced live yet.',
  },
];