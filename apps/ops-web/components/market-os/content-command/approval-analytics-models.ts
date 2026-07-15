export type WorkflowState =
  | 'draft'
  | 'review'
  | 'revision_requested'
  | 'approved'
  | 'published';

export interface ReviewerAssignment {
  id: string;
  reviewerName: string;
  assignedAt: string;
  state: WorkflowState;
}

export interface ApprovalComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
}

export interface AnalyticsKPI {
  id: string;
  label: string;
  value: number;
  trend?: number;
}
