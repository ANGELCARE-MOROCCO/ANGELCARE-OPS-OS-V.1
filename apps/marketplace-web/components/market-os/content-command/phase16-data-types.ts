export type Phase16DataEntityKind =
  | 'content_asset'
  | 'campaign_deliverable'
  | 'product_service_sheet'
  | 'brand_asset'
  | 'social_publication'
  | 'approval_request'
  | 'automation_rule';

export type Phase16RecordStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export interface Phase16BaseRecord {
  id: string;
  kind: Phase16DataEntityKind;
  title: string;
  status: Phase16RecordStatus;
  owner: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase16CreateRecordInput {
  kind: Phase16DataEntityKind;
  title: string;
  status?: Phase16RecordStatus;
  owner: string;
  campaignId?: string;
}

export interface Phase16UpdateRecordInput {
  id: string;
  title?: string;
  status?: Phase16RecordStatus;
  owner?: string;
  campaignId?: string;
}

export interface Phase16MutationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface Phase16QueryState<T> {
  loading: boolean;
  error: string | null;
  data: T;
}