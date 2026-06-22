import type { Phase11ConfigOption, Phase11GovernanceRule, Phase11SlaRule } from './phase11-settings-types';

export const phase11ConfigOptions: Phase11ConfigOption[] = [
  { id: 'status-draft', scope: 'statuses', label: 'Draft', description: 'Content is being prepared.', enabled: true, locked: true },
  { id: 'status-review', scope: 'statuses', label: 'Review', description: 'Content is waiting for review.', enabled: true, locked: true },
  { id: 'status-approved', scope: 'statuses', label: 'Approved', description: 'Content is approved for use.', enabled: true, locked: true },
  { id: 'status-scheduled', scope: 'statuses', label: 'Scheduled', description: 'Content is scheduled for publication.', enabled: true },
  { id: 'status-published', scope: 'statuses', label: 'Published', description: 'Content has been published.', enabled: true },
  { id: 'priority-low', scope: 'priorities', label: 'Low', description: 'Non-urgent item.', enabled: true },
  { id: 'priority-medium', scope: 'priorities', label: 'Medium', description: 'Normal production priority.', enabled: true },
  { id: 'priority-high', scope: 'priorities', label: 'High', description: 'Important delivery item.', enabled: true },
  { id: 'priority-urgent', scope: 'priorities', label: 'Urgent', description: 'Immediate action required.', enabled: true },
  { id: 'lang-fr', scope: 'languages', label: 'French', description: 'French content variant.', enabled: true },
  { id: 'lang-ar', scope: 'languages', label: 'Arabic', description: 'Arabic content variant.', enabled: true },
  { id: 'lang-en', scope: 'languages', label: 'English', description: 'English content variant.', enabled: true },
  { id: 'channel-website', scope: 'channels', label: 'Website', description: 'Website and landing page content.', enabled: true },
  { id: 'channel-social', scope: 'channels', label: 'Social Media', description: 'Instagram, Facebook, LinkedIn, TikTok, YouTube.', enabled: true },
  { id: 'channel-print', scope: 'channels', label: 'Print', description: 'Brochures, flyers, posters, and PDF exports.', enabled: true },
  { id: 'type-brochure', scope: 'content_types', label: 'Brochure', description: 'Marketing brochure asset.', enabled: true },
  { id: 'type-social-post', scope: 'content_types', label: 'Social Post', description: 'Platform-ready social content.', enabled: true },
  { id: 'type-product-sheet', scope: 'content_types', label: 'Product Sheet', description: 'Structured product/service marketing sheet.', enabled: true },
];

export const phase11GovernanceRules: Phase11GovernanceRule[] = [
  {
    id: 'brand-approved-assets',
    title: 'Approved brand assets required',
    description: 'Published content should use approved logos, templates, and visual rules.',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'translation-completeness',
    title: 'Translation completeness check',
    description: 'Campaign content should identify whether FR / AR / EN versions are required.',
    severity: 'high',
    enabled: true,
  },
  {
    id: 'seo-required',
    title: 'SEO metadata required for website content',
    description: 'Website-ready content should include SEO title, description, and primary keyword.',
    severity: 'high',
    enabled: true,
  },
];

export const phase11SlaRules: Phase11SlaRule[] = [
  { id: 'sla-review', title: 'Review SLA', targetHours: 24, appliesTo: 'Review-stage content', enabled: true },
  { id: 'sla-urgent', title: 'Urgent production SLA', targetHours: 8, appliesTo: 'Urgent content tasks', enabled: true },
  { id: 'sla-brand', title: 'Brand validation SLA', targetHours: 12, appliesTo: 'Brand governance issues', enabled: true },
];