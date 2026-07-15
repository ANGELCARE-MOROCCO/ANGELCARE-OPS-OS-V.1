import type { Phase9DetailPanelRecord, Phase9TaskCard, Phase9WorkspaceAction } from './phase9-action-types';

export const phase9WorkspaceActions: Phase9WorkspaceAction[] = [
  {
    id: 'create-asset',
    kind: 'create_asset',
    label: 'Create Asset',
    description: 'Start a new content asset with owner, status, format, campaign, and language.',
    status: 'available',
    targetWorkspace: 'Content Library',
  },
  {
    id: 'create-deliverable',
    kind: 'create_campaign_deliverable',
    label: 'Create Campaign Deliverable',
    description: 'Add a missing campaign deliverable and assign ownership.',
    status: 'recommended',
    targetWorkspace: 'Campaign Assets',
  },
  {
    id: 'create-product-sheet',
    kind: 'create_product_sheet',
    label: 'Create Product Sheet',
    description: 'Build a structured product/service marketing sheet with SEO and media fields.',
    status: 'available',
    targetWorkspace: 'Product & Service Sheets',
  },
  {
    id: 'request-approval',
    kind: 'request_approval',
    label: 'Request Approval',
    description: 'Send draft content into the approval workflow.',
    status: 'available',
    targetWorkspace: 'Approvals',
  },
  {
    id: 'schedule-publication',
    kind: 'schedule_publication',
    label: 'Schedule Publication',
    description: 'Move approved content into the editorial calendar.',
    status: 'blocked',
    targetWorkspace: 'Editorial Calendar',
  },
  {
    id: 'run-ai-review',
    kind: 'run_ai_review',
    label: 'Run AI Review',
    description: 'Score clarity, SEO, brand fit, completeness, and conversion strength.',
    status: 'recommended',
    targetWorkspace: 'AI Brand Agent',
  },
];

export const phase9TaskCards: Phase9TaskCard[] = [
  {
    id: 'task-001',
    title: 'Complete missing Arabic translation for care brochure',
    owner: 'Content Team',
    workspace: 'library',
    status: 'todo',
    priority: 'high',
  },
  {
    id: 'task-002',
    title: 'Review campaign social pack before scheduling',
    owner: 'Brand Reviewer',
    workspace: 'approvals',
    status: 'review',
    priority: 'urgent',
  },
  {
    id: 'task-003',
    title: 'Add SEO metadata to family support product sheet',
    owner: 'Marketing',
    workspace: 'products',
    status: 'doing',
    priority: 'medium',
  },
  {
    id: 'task-004',
    title: 'Replace outdated flyer template',
    owner: 'Designer',
    workspace: 'brand',
    status: 'blocked',
    priority: 'high',
  },
];

export const phase9DetailRecords: Phase9DetailPanelRecord[] = [
  {
    id: 'detail-asset-001',
    title: 'AngelCare service brochure',
    subtitle: 'Content Library / PDF / French',
    status: 'Approved',
    owner: 'Content Lead',
    metadata: [
      { label: 'Campaign', value: 'Core Services' },
      { label: 'Language', value: 'FR' },
      { label: 'Last Update', value: 'Recent' },
      { label: 'Usage', value: 'Website + Print' },
    ],
  },
  {
    id: 'detail-deliverable-001',
    title: 'Trust Campaign video script',
    subtitle: 'Campaign Assets / Video Script',
    status: 'Draft',
    owner: 'Copywriter',
    metadata: [
      { label: 'Campaign', value: 'Trust Campaign' },
      { label: 'Readiness', value: '47%' },
      { label: 'Priority', value: 'High' },
      { label: 'Next Step', value: 'Review draft angle' },
    ],
  },
];