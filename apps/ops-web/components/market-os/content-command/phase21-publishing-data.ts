import type {
  Phase21ChannelRule,
  Phase21ComplianceCheck,
  Phase21PublicationQueueItem,
  Phase21PublishingHandoff,
} from './phase21-publishing-types';

export const phase21PublicationQueue: Phase21PublicationQueueItem[] = [
  { id: 'pub-001', title: 'Core services website update', channel: 'website', campaign: 'Core Services', owner: 'Marketing Ops', status: 'scheduled', scheduledWindow: 'This week', readiness: 92 },
  { id: 'pub-002', title: 'Trust campaign Instagram carousel', channel: 'instagram', campaign: 'Trust Campaign', owner: 'Social Media', status: 'queued', scheduledWindow: 'Tomorrow', readiness: 84 },
  { id: 'pub-003', title: 'Family care WhatsApp visual pack', channel: 'whatsapp', campaign: 'Family Care', owner: 'Marketing Ops', status: 'blocked', scheduledWindow: 'Today', readiness: 58 },
  { id: 'pub-004', title: 'Partnership LinkedIn deck post', channel: 'linkedin', campaign: 'Partnership Push', owner: 'Marketing Lead', status: 'approved', scheduledWindow: 'Next week', readiness: 76 },
];

export const phase21ChannelRules: Phase21ChannelRule[] = [
  { id: 'rule-website-seo', channel: 'website', title: 'SEO metadata required', description: 'Website publications must include title, meta description, and primary keyword.', required: true },
  { id: 'rule-instagram-ratio', channel: 'instagram', title: 'Visual ratio validation', description: 'Instagram assets should match approved visual dimensions and safe margins.', required: true },
  { id: 'rule-linkedin-tone', channel: 'linkedin', title: 'Professional tone validation', description: 'LinkedIn publications should use formal business language.', required: true },
  { id: 'rule-whatsapp-short', channel: 'whatsapp', title: 'Short CTA required', description: 'WhatsApp-ready messages should be short, clear, and action-oriented.', required: true },
];

export const phase21ComplianceChecks: Phase21ComplianceCheck[] = [
  { id: 'check-001', publicationId: 'pub-001', label: 'SEO metadata complete', passed: true, severity: 'high' },
  { id: 'check-002', publicationId: 'pub-002', label: 'Brand visual approved', passed: true, severity: 'critical' },
  { id: 'check-003', publicationId: 'pub-003', label: 'Translation verified', passed: false, severity: 'high' },
  { id: 'check-004', publicationId: 'pub-003', label: 'Final approval attached', passed: false, severity: 'critical' },
];

export const phase21PublishingHandoffs: Phase21PublishingHandoff[] = [
  { id: 'handoff-001', publicationId: 'pub-001', fromOwner: 'Content Lead', toOwner: 'Marketing Ops', state: 'accepted', notes: 'Website update ready for final publication.' },
  { id: 'handoff-002', publicationId: 'pub-003', fromOwner: 'Designer', toOwner: 'Marketing Ops', state: 'blocked', notes: 'Waiting for translation and approval checks.' },
];