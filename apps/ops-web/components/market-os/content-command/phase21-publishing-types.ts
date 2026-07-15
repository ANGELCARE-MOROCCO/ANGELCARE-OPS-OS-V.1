export type Phase21PublishingChannel =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'print'
  | 'whatsapp';

export type Phase21PublicationStatus =
  | 'draft'
  | 'approved'
  | 'queued'
  | 'scheduled'
  | 'published'
  | 'blocked'
  | 'archived';

export interface Phase21PublicationQueueItem {
  id: string;
  title: string;
  channel: Phase21PublishingChannel;
  campaign: string;
  owner: string;
  status: Phase21PublicationStatus;
  scheduledWindow: string;
  readiness: number;
}

export interface Phase21ChannelRule {
  id: string;
  channel: Phase21PublishingChannel;
  title: string;
  description: string;
  required: boolean;
}

export interface Phase21ComplianceCheck {
  id: string;
  publicationId: string;
  label: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Phase21PublishingHandoff {
  id: string;
  publicationId: string;
  fromOwner: string;
  toOwner: string;
  state: 'pending' | 'accepted' | 'blocked' | 'completed';
  notes: string;
}