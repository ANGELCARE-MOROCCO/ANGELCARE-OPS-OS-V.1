import type {
  Phase30DependencyPlan,
  Phase30MigrationStep,
  Phase30RolloutChecklistItem,
  Phase30SqlBlueprint,
} from './phase30-migration-types';

export const phase30MigrationSteps: Phase30MigrationStep[] = [
  {
    id: 'step-001',
    stage: 'schema',
    title: 'Create content assets table',
    sqlObject: 'market_content_assets',
    order: 1,
    risk: 'medium',
    ready: true,
    notes: 'Core table for content asset records.',
  },
  {
    id: 'step-002',
    stage: 'schema',
    title: 'Create campaign deliverables table',
    sqlObject: 'market_content_deliverables',
    order: 2,
    risk: 'medium',
    ready: true,
    notes: 'Depends on campaign identifiers being confirmed.',
  },
  {
    id: 'step-003',
    stage: 'relationships',
    title: 'Add campaign relationships',
    sqlObject: 'campaign_id foreign keys',
    order: 3,
    risk: 'high',
    ready: false,
    notes: 'Requires final campaign table name confirmation.',
  },
  {
    id: 'step-004',
    stage: 'rls',
    title: 'Enable RLS policies',
    sqlObject: 'content command RLS policies',
    order: 4,
    risk: 'critical',
    ready: false,
    notes: 'Requires final role/permission model.',
  },
  {
    id: 'step-005',
    stage: 'audit',
    title: 'Create audit log table and trigger plan',
    sqlObject: 'market_content_audit_log',
    order: 5,
    risk: 'high',
    ready: true,
    notes: 'Audit log table blueprint exists; trigger SQL requires final table list.',
  },
  {
    id: 'step-006',
    stage: 'verification',
    title: 'Verify migration integrity',
    sqlObject: 'migration verification checks',
    order: 6,
    risk: 'low',
    ready: true,
    notes: 'Run table existence, indexes, RLS, and insert/read tests.',
  },
];

export const phase30SqlBlueprints: Phase30SqlBlueprint[] = [
  {
    id: 'sql-assets',
    title: 'Content Assets Table',
    tableName: 'market_content_assets',
    safeToRun: false,
    sqlPreview: 'create table market_content_assets (id uuid primary key, title text not null, status text not null, owner_id uuid, campaign_id uuid, metadata jsonb, created_at timestamptz not null, updated_at timestamptz not null);',
  },
  {
    id: 'sql-deliverables',
    title: 'Campaign Deliverables Table',
    tableName: 'market_content_deliverables',
    safeToRun: false,
    sqlPreview: 'create table market_content_deliverables (id uuid primary key, campaign_id uuid not null, title text not null, readiness integer not null, status text not null, blocked_reason text);',
  },
  {
    id: 'sql-approvals',
    title: 'Approvals Table',
    tableName: 'market_content_approvals',
    safeToRun: false,
    sqlPreview: 'create table market_content_approvals (id uuid primary key, target_id uuid not null, reviewer_id uuid, state text not null, comments jsonb, created_at timestamptz not null);',
  },
  {
    id: 'sql-audit',
    title: 'Audit Log Table',
    tableName: 'market_content_audit_log',
    safeToRun: false,
    sqlPreview: 'create table market_content_audit_log (id uuid primary key, actor_id uuid, entity_table text not null, entity_id uuid not null, action text not null, payload jsonb, created_at timestamptz not null);',
  },
];

export const phase30DependencyPlan: Phase30DependencyPlan[] = [
  {
    id: 'dep-campaigns',
    objectName: 'market_content_deliverables.campaign_id',
    dependsOn: ['market_campaigns or existing campaign table'],
    reason: 'Deliverables must link to campaign records.',
  },
  {
    id: 'dep-assets-approvals',
    objectName: 'market_content_approvals.target_id',
    dependsOn: ['market_content_assets', 'market_content_deliverables'],
    reason: 'Approvals can target multiple content entity types.',
  },
  {
    id: 'dep-audit',
    objectName: 'market_content_audit_log',
    dependsOn: ['all mutable content command tables'],
    reason: 'Audit events should be emitted by all major mutations.',
  },
  {
    id: 'dep-rls',
    objectName: 'RLS policies',
    dependsOn: ['profiles / roles / permissions table'],
    reason: 'Policies require confirmed user role and permissions model.',
  },
];

export const phase30RolloutChecklist: Phase30RolloutChecklistItem[] = [
  {
    id: 'check-backup',
    label: 'Confirm database backup before migration',
    completed: false,
    blocker: 'Manual operational confirmation required.',
  },
  {
    id: 'check-campaign-table',
    label: 'Confirm campaign table name',
    completed: false,
    blocker: 'Required before foreign keys.',
  },
  {
    id: 'check-permissions',
    label: 'Confirm role and permission model',
    completed: false,
    blocker: 'Required before RLS migration.',
  },
  {
    id: 'check-sql-review',
    label: 'Review SQL before execution',
    completed: false,
    blocker: 'SQL should be reviewed before running in Supabase.',
  },
  {
    id: 'check-verification',
    label: 'Prepare verification queries',
    completed: true,
    blocker: 'No blocker.',
  },
];