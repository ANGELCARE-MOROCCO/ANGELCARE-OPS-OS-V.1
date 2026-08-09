export type Phase17PresenceStatus = 'online' | 'editing' | 'reviewing' | 'idle' | 'offline';

export type Phase17ActivityVerb =
  | 'viewed'
  | 'edited'
  | 'commented'
  | 'requested_revision'
  | 'approved'
  | 'scheduled'
  | 'published';

export type Phase17NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Phase17PresenceUser {
  id: string;
  name: string;
  role: string;
  status: Phase17PresenceStatus;
  currentArea: string;
  lastSeen: string;
}

export interface Phase17ActivityEvent {
  id: string;
  actor: string;
  verb: Phase17ActivityVerb;
  targetTitle: string;
  targetType: 'asset' | 'deliverable' | 'product_sheet' | 'social_post' | 'brand_asset';
  createdAt: string;
}

export interface Phase17ReviewSession {
  id: string;
  title: string;
  assetTitle: string;
  reviewer: string;
  status: 'open' | 'in_review' | 'revision_requested' | 'approved' | 'closed';
  openComments: number;
  dueLabel: string;
}

export interface Phase17CommentThread {
  id: string;
  targetTitle: string;
  author: string;
  message: string;
  status: 'open' | 'resolved';
  repliesCount: number;
}

export interface Phase17Notification {
  id: string;
  title: string;
  message: string;
  priority: Phase17NotificationPriority;
  read: boolean;
}