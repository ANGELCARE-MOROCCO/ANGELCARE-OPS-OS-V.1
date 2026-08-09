export type Phase9ActionKind =
  | 'create_asset'
  | 'edit_asset'
  | 'create_campaign_deliverable'
  | 'create_product_sheet'
  | 'request_approval'
  | 'approve_content'
  | 'request_revision'
  | 'schedule_publication'
  | 'archive_content'
  | 'run_ai_review';

export type Phase9ActionStatus = 'available' | 'recommended' | 'blocked';

export interface Phase9WorkspaceAction {
  id: string;
  kind: Phase9ActionKind;
  label: string;
  description: string;
  status: Phase9ActionStatus;
  targetWorkspace: string;
}

export interface Phase9TaskCard {
  id: string;
  title: string;
  owner: string;
  workspace: 'library' | 'campaigns' | 'products' | 'brand' | 'social' | 'approvals';
  status: 'todo' | 'doing' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Phase9DetailPanelRecord {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  owner: string;
  metadata: Array<{ label: string; value: string }>;
}