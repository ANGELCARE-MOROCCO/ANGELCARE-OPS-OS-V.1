import type {
  Phase31ApiContract,
  Phase31ApiEndpoint,
  Phase31ApiQaCheck,
  Phase31ServerActionPlan,
} from './phase31-api-types';

export const phase31ApiEndpoints: Phase31ApiEndpoint[] = [
  {
    id: 'endpoint-assets-list',
    method: 'GET',
    path: '/api/market-os/content-command/assets',
    purpose: 'List content assets with filters and pagination.',
    risk: 'medium',
    readyForImplementation: true,
  },
  {
    id: 'endpoint-assets-create',
    method: 'POST',
    path: '/api/market-os/content-command/assets',
    purpose: 'Create a new content asset record.',
    risk: 'high',
    readyForImplementation: false,
  },
  {
    id: 'endpoint-approvals-update',
    method: 'PATCH',
    path: '/api/market-os/content-command/approvals/:id',
    purpose: 'Update approval state, comments, and reviewer decisions.',
    risk: 'high',
    readyForImplementation: false,
  },
  {
    id: 'endpoint-publish',
    method: 'POST',
    path: '/api/market-os/content-command/publishing/:id/queue',
    purpose: 'Queue approved content for publication handoff.',
    risk: 'critical',
    readyForImplementation: false,
  },
  {
    id: 'endpoint-ai-run',
    method: 'POST',
    path: '/api/market-os/content-command/ai/run',
    purpose: 'Execute a protected AI task through a server-side provider.',
    risk: 'critical',
    readyForImplementation: false,
  },
];

export const phase31ApiContracts: Phase31ApiContract[] = [
  {
    id: 'contract-assets-list',
    endpointId: 'endpoint-assets-list',
    requestShape: ['query.search?', 'query.status?', 'query.campaignId?', 'query.page?'],
    responseShape: ['items[]', 'total', 'page', 'pageSize'],
    validationRequired: true,
  },
  {
    id: 'contract-assets-create',
    endpointId: 'endpoint-assets-create',
    requestShape: ['title', 'status', 'ownerId?', 'campaignId?', 'metadata?'],
    responseShape: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
    validationRequired: true,
  },
  {
    id: 'contract-approval-update',
    endpointId: 'endpoint-approvals-update',
    requestShape: ['state', 'comment?', 'reviewerId?'],
    responseShape: ['id', 'state', 'updatedAt', 'auditId'],
    validationRequired: true,
  },
  {
    id: 'contract-ai-run',
    endpointId: 'endpoint-ai-run',
    requestShape: ['action', 'language', 'input', 'campaignId?', 'assetId?'],
    responseShape: ['taskId', 'output', 'qualityScore', 'requiresApproval'],
    validationRequired: true,
  },
];

export const phase31ServerActionPlans: Phase31ServerActionPlan[] = [
  {
    id: 'action-create-asset',
    actionName: 'createContentAsset',
    entity: 'Content Asset',
    mutation: 'create',
    requiresAudit: true,
    requiresPermission: true,
  },
  {
    id: 'action-approve-content',
    actionName: 'approveContentItem',
    entity: 'Approval Request',
    mutation: 'approve',
    requiresAudit: true,
    requiresPermission: true,
  },
  {
    id: 'action-archive-asset',
    actionName: 'archiveContentAsset',
    entity: 'Content Asset',
    mutation: 'archive',
    requiresAudit: true,
    requiresPermission: true,
  },
  {
    id: 'action-publish-item',
    actionName: 'queuePublication',
    entity: 'Publication Queue',
    mutation: 'publish',
    requiresAudit: true,
    requiresPermission: true,
  },
];

export const phase31ApiQaChecks: Phase31ApiQaCheck[] = [
  {
    id: 'qa-auth-boundary',
    label: 'Auth boundary must be server-side only',
    passed: false,
    blocker: 'Requires final role/permission model before implementation.',
  },
  {
    id: 'qa-validation',
    label: 'All mutating endpoints require validation',
    passed: true,
    blocker: 'No blocker.',
  },
  {
    id: 'qa-audit',
    label: 'All mutating endpoints emit audit events',
    passed: true,
    blocker: 'Audit table must exist before runtime implementation.',
  },
  {
    id: 'qa-ai-secret',
    label: 'AI provider keys never exposed client-side',
    passed: true,
    blocker: 'Use protected server route only.',
  },
  {
    id: 'qa-publishing',
    label: 'Publishing endpoint requires final provider selection',
    passed: false,
    blocker: 'External publishing provider not selected yet.',
  },
];