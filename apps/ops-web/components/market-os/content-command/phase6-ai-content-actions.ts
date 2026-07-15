import type { AiActionType, ContentChannel, ContentLanguage } from './phase6-ai-automation-types';

export interface AiActionDefinition {
  type: AiActionType;
  label: string;
  description: string;
  supportedLanguages: ContentLanguage[];
  supportedChannels: ContentChannel[];
}

export const aiContentActions: AiActionDefinition[] = [
  {
    type: 'generate_caption',
    label: 'Generate Caption',
    description: 'Create a platform-ready caption for a marketing post.',
    supportedLanguages: ['fr', 'ar', 'en'],
    supportedChannels: ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'],
  },
  {
    type: 'rewrite_professional',
    label: 'Rewrite Professionally',
    description: 'Improve tone, clarity, structure, and business credibility.',
    supportedLanguages: ['fr', 'ar', 'en'],
    supportedChannels: ['website', 'print', 'internal', 'linkedin'],
  },
  {
    type: 'translate',
    label: 'Translate',
    description: 'Produce multilingual FR / AR / EN content variants.',
    supportedLanguages: ['fr', 'ar', 'en'],
    supportedChannels: ['website', 'instagram', 'facebook', 'linkedin', 'print', 'internal'],
  },
  {
    type: 'seo_optimize',
    label: 'SEO Optimize',
    description: 'Improve keywords, title, metadata, and search clarity.',
    supportedLanguages: ['fr', 'ar', 'en'],
    supportedChannels: ['website'],
  },
  {
    type: 'generate_campaign_variants',
    label: 'Generate Campaign Variants',
    description: 'Create channel-specific adaptations from one campaign message.',
    supportedLanguages: ['fr', 'ar', 'en'],
    supportedChannels: ['website', 'instagram', 'facebook', 'linkedin', 'tiktok', 'print'],
  },
];

export function getAiActionsForChannel(channel: ContentChannel): AiActionDefinition[] {
  return aiContentActions.filter((action) => action.supportedChannels.includes(channel));
}