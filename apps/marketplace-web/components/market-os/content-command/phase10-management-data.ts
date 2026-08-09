import type { Phase10FormField, Phase10ManagedEntity } from './phase10-management-types';

export const phase10ManagedEntities: Phase10ManagedEntity[] = [
  {
    id: 'asset-001',
    type: 'asset',
    title: 'Core service brochure',
    owner: 'Content Lead',
    status: 'approved',
    campaign: 'Core Services',
    language: 'fr',
    updatedAt: 'Recent',
  },
  {
    id: 'deliverable-001',
    type: 'deliverable',
    title: 'Trust campaign video script',
    owner: 'Copywriter',
    status: 'review',
    campaign: 'Trust Campaign',
    language: 'ar',
    updatedAt: 'Recent',
  },
  {
    id: 'sheet-001',
    type: 'product_sheet',
    title: 'Family support package',
    owner: 'Marketing',
    status: 'draft',
    campaign: 'Product Positioning',
    language: 'fr',
    updatedAt: 'Recent',
  },
];

export const phase10FormFields: Phase10FormField[] = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Enter content title' },
  { key: 'owner', label: 'Owner', required: true, placeholder: 'Assign owner' },
  { key: 'campaign', label: 'Campaign', required: false, placeholder: 'Link campaign' },
  { key: 'language', label: 'Language', required: false, placeholder: 'fr / ar / en' },
];