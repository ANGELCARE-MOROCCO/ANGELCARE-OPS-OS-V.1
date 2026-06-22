export type ContentCommandWorkspaceKey =
  | 'dashboard'
  | 'content-library'
  | 'creation-studio'
  | 'campaign-assets'
  | 'product-service-sheets'
  | 'brand-governance'
  | 'editorial-calendar'
  | 'social-command'
  | 'approvals'
  | 'analytics'
  | 'ai-agent'
  | 'automations'
  | 'settings';

export interface ContentCommandWorkspaceNavItem {
  key: ContentCommandWorkspaceKey;
  label: string;
  description: string;
  priority: number;
  enabled: boolean;
}

export const contentCommandWorkspaceNavigation: ContentCommandWorkspaceNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Operational command view for content production, blockers, approvals, and readiness.',
    priority: 1,
    enabled: true,
  },
  {
    key: 'content-library',
    label: 'Content Library',
    description: 'Centralized asset repository with metadata, campaign links, statuses, and governance.',
    priority: 2,
    enabled: true,
  },
  {
    key: 'creation-studio',
    label: 'Creation Studio',
    description: 'Workspace for copy, visuals, channel variants, multilingual adaptation, and drafts.',
    priority: 3,
    enabled: true,
  },
  {
    key: 'campaign-assets',
    label: 'Campaign Assets',
    description: 'Deliverables matrix and launch readiness tracking for campaign-linked content.',
    priority: 4,
    enabled: true,
  },
  {
    key: 'product-service-sheets',
    label: 'Product & Service Sheets',
    description: 'Structured marketing sheets with SEO, media, audience, benefits, and export readiness.',
    priority: 5,
    enabled: true,
  },
  {
    key: 'brand-governance',
    label: 'Brand Governance',
    description: 'Brand kit, templates, logos, approved visual rules, and compliance monitoring.',
    priority: 6,
    enabled: true,
  },
  {
    key: 'editorial-calendar',
    label: 'Editorial Calendar',
    description: 'Calendar planning for scheduled publications, owners, campaigns, and channels.',
    priority: 7,
    enabled: true,
  },
  {
    key: 'social-command',
    label: 'Social Command',
    description: 'Platform-specific post preparation, caption variants, media previews, and status tracking.',
    priority: 8,
    enabled: true,
  },
  {
    key: 'approvals',
    label: 'Approvals',
    description: 'Reviewers, revision requests, approvals, comments, timestamps, and audit history.',
    priority: 9,
    enabled: true,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Production output, campaign completion, content usage, bottlenecks, and performance indicators.',
    priority: 10,
    enabled: true,
  },
  {
    key: 'ai-agent',
    label: 'AI Brand Agent',
    description: 'AI-supported generation, rewriting, SEO optimization, translation, and checklist creation.',
    priority: 11,
    enabled: true,
  },
  {
    key: 'automations',
    label: 'Automations',
    description: 'Rules for checklists, tags, notifications, translation tasks, archival, and alerts.',
    priority: 12,
    enabled: true,
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Controlled submodule configuration for content statuses, rules, and workspace behavior.',
    priority: 13,
    enabled: true,
  },
];

export function getEnabledContentCommandNavigation(): ContentCommandWorkspaceNavItem[] {
  return contentCommandWorkspaceNavigation
    .filter((item) => item.enabled)
    .sort((a, b) => a.priority - b.priority);
}