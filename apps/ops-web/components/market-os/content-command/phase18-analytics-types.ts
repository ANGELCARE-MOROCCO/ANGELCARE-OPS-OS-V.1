export type Phase18Channel =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'print'
  | 'whatsapp';

export type Phase18AssetFormat =
  | 'brochure'
  | 'social_post'
  | 'video'
  | 'presentation'
  | 'landing_page'
  | 'product_sheet'
  | 'newsletter'
  | 'visual';

export interface Phase18ContentPerformance {
  id: string;
  assetTitle: string;
  format: Phase18AssetFormat;
  channel: Phase18Channel;
  views: number;
  engagements: number;
  downloads: number;
  leads: number;
  conversions: number;
  revenueMad: number;
}

export interface Phase18CampaignAttribution {
  id: string;
  campaign: string;
  sourceChannel: Phase18Channel;
  influencedLeads: number;
  influencedConversions: number;
  attributedRevenueMad: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface Phase18FunnelStage {
  id: string;
  label: string;
  count: number;
  conversionRate: number;
}

export interface Phase18ChannelMatrixRow {
  channel: Phase18Channel;
  assets: number;
  reach: number;
  engagementRate: number;
  leadContribution: number;
}

export interface Phase18RoiSummary {
  totalRevenueMad: number;
  totalConversions: number;
  totalLeads: number;
  estimatedRoiPercent: number;
}