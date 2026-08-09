export type Phase12EntityKind =
  | 'asset'
  | 'campaign_deliverable'
  | 'product_sheet'
  | 'brand_rule'
  | 'social_post'
  | 'approval'
  | 'automation_rule';

export type Phase12ActivityVerb =
  | 'created'
  | 'updated'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'exported'
  | 'imported';

export interface Phase12RepositoryEntity {
  id: string;
  kind: Phase12EntityKind;
  title: string;
  status: string;
  owner: string;
  updatedAt: string;
}

export interface Phase12ActivityLogEntry {
  id: string;
  entityId: string;
  entityKind: Phase12EntityKind;
  verb: Phase12ActivityVerb;
  actor: string;
  message: string;
  createdAt: string;
}

export interface Phase12ExportPayload {
  exportedAt: string;
  source: 'content_command_center';
  entities: Phase12RepositoryEntity[];
  activity: Phase12ActivityLogEntry[];
}

export interface Phase12ServiceHealth {
  service: string;
  status: 'ready' | 'needs_configuration' | 'disabled';
  notes: string;
}