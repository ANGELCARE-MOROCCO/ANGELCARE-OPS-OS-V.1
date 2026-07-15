import type { Phase16BaseRecord } from './phase16-data-types';

export interface Phase16SupabaseTableMap {
  entityKind: Phase16BaseRecord['kind'];
  tableName: string;
  notes: string;
}

export const phase16SupabaseTableMap: Phase16SupabaseTableMap[] = [
  {
    entityKind: 'content_asset',
    tableName: 'market_content_assets',
    notes: 'Stores uploaded or authored marketing content assets.',
  },
  {
    entityKind: 'campaign_deliverable',
    tableName: 'market_content_deliverables',
    notes: 'Stores campaign-linked content deliverables and readiness status.',
  },
  {
    entityKind: 'product_service_sheet',
    tableName: 'market_product_service_sheets',
    notes: 'Stores structured marketing sheets for AngelCare services and packages.',
  },
  {
    entityKind: 'brand_asset',
    tableName: 'market_brand_assets',
    notes: 'Stores approved logos, templates, colors, fonts, and guidelines.',
  },
  {
    entityKind: 'social_publication',
    tableName: 'market_social_publications',
    notes: 'Stores social post drafts, schedules, statuses, and platform variants.',
  },
  {
    entityKind: 'approval_request',
    tableName: 'market_content_approvals',
    notes: 'Stores review requests, approval states, revision notes, and audit data.',
  },
  {
    entityKind: 'automation_rule',
    tableName: 'market_content_automation_rules',
    notes: 'Stores configurable automation triggers and actions.',
  },
];

export function getPhase16TableName(kind: Phase16BaseRecord['kind']): string {
  return phase16SupabaseTableMap.find((item) => item.entityKind === kind)?.tableName ?? 'market_content_records';
}