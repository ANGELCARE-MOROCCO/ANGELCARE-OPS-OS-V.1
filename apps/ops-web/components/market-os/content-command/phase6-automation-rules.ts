import type { AutomationRule } from './phase6-ai-automation-types';

export const contentCommandAutomationRules: AutomationRule[] = [
  {
    id: 'auto-campaign-checklist',
    name: 'Auto-create campaign deliverables checklist',
    description: 'When a campaign is created, generate required content deliverables.',
    trigger: 'campaign_created',
    actions: ['create_deliverable_checklist', 'create_calendar_items', 'notify_owner'],
    enabled: true,
    priority: 'high',
  },
  {
    id: 'auto-asset-tagging',
    name: 'Auto-tag uploaded assets',
    description: 'When an asset is uploaded, apply content tags based on format and campaign.',
    trigger: 'asset_uploaded',
    actions: ['auto_tag_asset'],
    enabled: true,
    priority: 'medium',
  },
  {
    id: 'review-notification',
    name: 'Notify reviewer on submitted content',
    description: 'When content is submitted for review, assign and notify the reviewer.',
    trigger: 'content_submitted_for_review',
    actions: ['assign_reviewer', 'notify_owner'],
    enabled: true,
    priority: 'high',
  },
  {
    id: 'approved-translation-tasks',
    name: 'Generate translation tasks after approval',
    description: 'When content is approved, create missing FR / AR / EN translation tasks.',
    trigger: 'content_approved',
    actions: ['generate_translation_tasks'],
    enabled: true,
    priority: 'medium',
  },
  {
    id: 'deadline-alert',
    name: 'Raise alert when deadline is missed',
    description: 'When a deliverable deadline is missed, create an operational alert.',
    trigger: 'deadline_missed',
    actions: ['raise_quality_alert', 'notify_owner'],
    enabled: true,
    priority: 'urgent',
  },
];

export function getEnabledAutomationRules(): AutomationRule[] {
  return contentCommandAutomationRules.filter((rule) => rule.enabled);
}