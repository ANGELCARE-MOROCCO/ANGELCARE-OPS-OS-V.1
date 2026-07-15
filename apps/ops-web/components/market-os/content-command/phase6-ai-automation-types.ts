export type ContentLanguage = 'fr' | 'ar' | 'en';
export type ContentChannel = 'website' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'print' | 'internal';
export type ContentPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ContentLifecycleState =
  | 'idea'
  | 'draft'
  | 'review'
  | 'revision_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export type AiActionType =
  | 'generate_caption'
  | 'rewrite_professional'
  | 'translate'
  | 'seo_optimize'
  | 'generate_cta'
  | 'generate_hashtags'
  | 'detect_missing_deliverables'
  | 'score_content_quality'
  | 'generate_campaign_variants';

export type AutomationTrigger =
  | 'campaign_created'
  | 'asset_uploaded'
  | 'content_submitted_for_review'
  | 'content_approved'
  | 'content_scheduled'
  | 'content_published'
  | 'deadline_missed'
  | 'brand_asset_expired';

export type AutomationAction =
  | 'create_deliverable_checklist'
  | 'create_calendar_items'
  | 'assign_reviewer'
  | 'notify_owner'
  | 'generate_translation_tasks'
  | 'auto_tag_asset'
  | 'archive_expired_content'
  | 'raise_quality_alert';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AiContentRequest {
  id: string;
  action: AiActionType;
  input: string;
  language: ContentLanguage;
  channel: ContentChannel;
  campaignId?: string;
  assetId?: string;
  priority: ContentPriority;
  requestedBy: string;
  createdAt: string;
}

export interface AiContentResult {
  id: string;
  requestId: string;
  output: string;
  qualityScore: number;
  suggestions: string[];
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  priority: ContentPriority;
}

export interface OperationalAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  linkedCampaignId?: string;
  linkedAssetId?: string;
  resolved: boolean;
  createdAt: string;
}

export interface ContentQualityScore {
  contentId: string;
  seo: number;
  clarity: number;
  brandFit: number;
  conversionStrength: number;
  completeness: number;
  total: number;
}