import type {
  Phase18CampaignAttribution,
  Phase18ChannelMatrixRow,
  Phase18ContentPerformance,
  Phase18FunnelStage,
} from './phase18-analytics-types';

export const phase18ContentPerformance: Phase18ContentPerformance[] = [
  {
    id: 'perf-1',
    assetTitle: 'Core service brochure',
    format: 'brochure',
    channel: 'website',
    views: 2400,
    engagements: 420,
    downloads: 180,
    leads: 52,
    conversions: 11,
    revenueMad: 38500,
  },
  {
    id: 'perf-2',
    assetTitle: 'Trust campaign carousel',
    format: 'social_post',
    channel: 'instagram',
    views: 9100,
    engagements: 760,
    downloads: 0,
    leads: 31,
    conversions: 7,
    revenueMad: 21000,
  },
  {
    id: 'perf-3',
    assetTitle: 'Family support product sheet',
    format: 'product_sheet',
    channel: 'website',
    views: 1750,
    engagements: 290,
    downloads: 96,
    leads: 44,
    conversions: 9,
    revenueMad: 31500,
  },
  {
    id: 'perf-4',
    assetTitle: 'LinkedIn partnership presentation',
    format: 'presentation',
    channel: 'linkedin',
    views: 1200,
    engagements: 165,
    downloads: 38,
    leads: 18,
    conversions: 4,
    revenueMad: 28000,
  },
];

export const phase18CampaignAttribution: Phase18CampaignAttribution[] = [
  {
    id: 'attr-1',
    campaign: 'Core Services',
    sourceChannel: 'website',
    influencedLeads: 52,
    influencedConversions: 11,
    attributedRevenueMad: 38500,
    confidence: 'high',
  },
  {
    id: 'attr-2',
    campaign: 'Trust Campaign',
    sourceChannel: 'instagram',
    influencedLeads: 31,
    influencedConversions: 7,
    attributedRevenueMad: 21000,
    confidence: 'medium',
  },
  {
    id: 'attr-3',
    campaign: 'Partnership Push',
    sourceChannel: 'linkedin',
    influencedLeads: 18,
    influencedConversions: 4,
    attributedRevenueMad: 28000,
    confidence: 'medium',
  },
];

export const phase18FunnelStages: Phase18FunnelStage[] = [
  { id: 'funnel-1', label: 'Reached', count: 14450, conversionRate: 100 },
  { id: 'funnel-2', label: 'Engaged', count: 1635, conversionRate: 11.3 },
  { id: 'funnel-3', label: 'Leads', count: 145, conversionRate: 8.9 },
  { id: 'funnel-4', label: 'Conversions', count: 31, conversionRate: 21.4 },
];

export const phase18ChannelMatrix: Phase18ChannelMatrixRow[] = [
  {
    channel: 'website',
    assets: 6,
    reach: 4150,
    engagementRate: 16.9,
    leadContribution: 96,
  },
  {
    channel: 'instagram',
    assets: 12,
    reach: 9100,
    engagementRate: 8.4,
    leadContribution: 31,
  },
  {
    channel: 'linkedin',
    assets: 5,
    reach: 1200,
    engagementRate: 13.8,
    leadContribution: 18,
  },
  {
    channel: 'whatsapp',
    assets: 4,
    reach: 1100,
    engagementRate: 22.5,
    leadContribution: 24,
  },
];