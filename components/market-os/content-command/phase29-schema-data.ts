import type {
  Phase29MigrationReadiness,
  Phase29RelationshipMap,
  Phase29RlsPolicyPlan,
  Phase29TableBlueprint,
} from './phase29-schema-types';

export const phase29TableBlueprints: Phase29TableBlueprint[] = [
  {
    id: 'table-assets',
    tableName: 'market_content_assets',
    purpose: 'Stores content assets, metadata, status, owner, campaign link, and media references.',
    rlsRequired: true,
    auditRequired: true,
    columns: [
      { name: 'id', type: 'uuid', required: true, indexed: true, notes: 'Primary key.' },
      { name: 'title', type: 'text', required: true, indexed: true, notes: 'Asset title.' },
      { name: 'status', type: 'enum', required: true, indexed: true, notes: 'Draft, review, approved, scheduled, published, archived.' },
      { name: 'owner_id', type: 'uuid', required: false, indexed: true, notes: 'Assigned owner profile.' },
      { name: 'campaign_id', type: 'uuid', required: false, indexed: true, notes: 'Optional campaign relation.' },
      { name: 'metadata', type: 'jsonb', required: false, indexed: false, notes: 'Flexible tags, language, channel, and file metadata.' },
      { name: 'created_at', type: 'timestamp', required: true, indexed: true, notes: 'Creation timestamp.' },
      { name: 'updated_at', type: 'timestamp', required: true, indexed: true, notes: 'Last update timestamp.' },
    ],
  },
  {
    id: 'table-deliverables',
    tableName: 'market_content_deliverables',
    purpose: 'Stores campaign deliverables, readiness, deadlines, blockers, and execution owners.',
    rlsRequired: true,
    auditRequired: true,
    columns: [
      { name: 'id', type: 'uuid', required: true, indexed: true, notes: 'Primary key.' },
      { name: 'campaign_id', type: 'uuid', required: true, indexed: true, notes: 'Parent campaign.' },
      { name: 'title', type: 'text', required: true, indexed: true, notes: 'Deliverable title.' },
      { name: 'readiness', type: 'integer', required: true, indexed: false, notes: '0-100 readiness score.' },
      { name: 'status', type: 'enum', required: true, indexed: true, notes: 'Workflow status.' },
      { name: 'blocked_reason', type: 'text', required: false, indexed: false, notes: 'Reason if blocked.' },
    ],
  },
  {
    id: 'table-product-sheets',
    tableName: 'market_product_service_sheets',
    purpose: 'Stores structured product/service marketing sheets with SEO and media data.',
    rlsRequired: true,
    auditRequired: true,
    columns: [
      { name: 'id', type: 'uuid', required: true, indexed: true, notes: 'Primary key.' },
      { name: 'title', type: 'text', required: true, indexed: true, notes: 'Service or product title.' },
      { name: 'category', type: 'text', required: true, indexed: true, notes: 'Service category.' },
      { name: 'seo_score', type: 'integer', required: false, indexed: false, notes: 'SEO readiness score.' },
      { name: 'content', type: 'jsonb', required: false, indexed: false, notes: 'Benefits, audience, CTA, translation, pricing notes.' },
    ],
  },
  {
    id: 'table-approvals',
    tableName: 'market_content_approvals',
    purpose: 'Stores approval requests, reviewer assignments, comments, decisions, and timestamps.',
    rlsRequired: true,
    auditRequired: true,
    columns: [
      { name: 'id', type: 'uuid', required: true, indexed: true, notes: 'Primary key.' },
      { name: 'target_id', type: 'uuid', required: true, indexed: true, notes: 'Linked asset, deliverable, or publication.' },
      { name: 'reviewer_id', type: 'uuid', required: false, indexed: true, notes: 'Assigned reviewer.' },
      { name: 'state', type: 'enum', required: true, indexed: true, notes: 'Review, revision_requested, approved, rejected.' },
      { name: 'comments', type: 'jsonb', required: false, indexed: false, notes: 'Threaded review notes.' },
    ],
  },
  {
    id: 'table-audit',
    tableName: 'market_content_audit_log',
    purpose: 'Stores immutable operational audit events for content command center changes.',
    rlsRequired: true,
    auditRequired: false,
    columns: [
      { name: 'id', type: 'uuid', required: true, indexed: true, notes: 'Primary key.' },
      { name: 'actor_id', type: 'uuid', required: false, indexed: true, notes: 'User who performed action.' },
      { name: 'entity_table', type: 'text', required: true, indexed: true, notes: 'Affected table.' },
      { name: 'entity_id', type: 'uuid', required: true, indexed: true, notes: 'Affected record.' },
      { name: 'action', type: 'text', required: true, indexed: true, notes: 'Created, updated, archived, approved, etc.' },
      { name: 'payload', type: 'jsonb', required: false, indexed: false, notes: 'Change context.' },
    ],
  },
];

export const phase29Relationships: Phase29RelationshipMap[] = [
  {
    id: 'rel-campaign-assets',
    fromTable: 'market_campaigns',
    toTable: 'market_content_assets',
    relation: 'one_to_many',
    notes: 'One campaign can own many assets.',
  },
  {
    id: 'rel-campaign-deliverables',
    fromTable: 'market_campaigns',
    toTable: 'market_content_deliverables',
    relation: 'one_to_many',
    notes: 'One campaign can own many deliverables.',
  },
  {
    id: 'rel-assets-approvals',
    fromTable: 'market_content_assets',
    toTable: 'market_content_approvals',
    relation: 'one_to_many',
    notes: 'One asset can have multiple approval events.',
  },
  {
    id: 'rel-entities-audit',
    fromTable: 'market_content_assets',
    toTable: 'market_content_audit_log',
    relation: 'one_to_many',
    notes: 'Every entity can emit many audit log entries.',
  },
];

export const phase29RlsPolicies: Phase29RlsPolicyPlan[] = [
  {
    id: 'policy-assets-select',
    tableName: 'market_content_assets',
    action: 'select',
    policyName: 'Content assets visible to authorized marketing users',
    ruleDescription: 'Allow read access to authenticated users with Market-OS content permissions.',
    readyForMigration: false,
  },
  {
    id: 'policy-assets-insert',
    tableName: 'market_content_assets',
    action: 'insert',
    policyName: 'Content creators can create assets',
    ruleDescription: 'Allow insert for users with creator/admin role inside Content Command Center.',
    readyForMigration: false,
  },
  {
    id: 'policy-approvals-update',
    tableName: 'market_content_approvals',
    action: 'update',
    policyName: 'Reviewers can update assigned approval requests',
    ruleDescription: 'Allow reviewers to update only approvals assigned to them or admins.',
    readyForMigration: false,
  },
  {
    id: 'policy-audit-select',
    tableName: 'market_content_audit_log',
    action: 'select',
    policyName: 'Audit log visible to authorized admins',
    ruleDescription: 'Restrict audit log visibility to command/admin roles.',
    readyForMigration: false,
  },
];

export const phase29MigrationReadiness: Phase29MigrationReadiness[] = [
  {
    label: 'Table Blueprint',
    percent: 88,
    blocker: 'Needs final confirmation before SQL generation.',
  },
  {
    label: 'Relationships',
    percent: 82,
    blocker: 'Requires final campaign table naming confirmation.',
  },
  {
    label: 'RLS Planning',
    percent: 64,
    blocker: 'Needs final role/permission model.',
  },
  {
    label: 'Audit Persistence',
    percent: 86,
    blocker: 'Ready for migration planning.',
  },
];