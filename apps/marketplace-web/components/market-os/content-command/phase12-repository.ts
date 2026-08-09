import type { Phase12ActivityLogEntry, Phase12RepositoryEntity } from './phase12-service-types';

export const phase12RepositorySeed: Phase12RepositoryEntity[] = [
  {
    id: 'repo-asset-001',
    kind: 'asset',
    title: 'Core service brochure',
    status: 'approved',
    owner: 'Content Lead',
    updatedAt: 'Recent',
  },
  {
    id: 'repo-product-001',
    kind: 'product_sheet',
    title: 'Family support package',
    status: 'draft',
    owner: 'Marketing',
    updatedAt: 'Recent',
  },
  {
    id: 'repo-social-001',
    kind: 'social_post',
    title: 'LinkedIn trust post',
    status: 'scheduled',
    owner: 'Marketing',
    updatedAt: 'Recent',
  },
];

export const phase12ActivitySeed: Phase12ActivityLogEntry[] = [
  {
    id: 'log-001',
    entityId: 'repo-asset-001',
    entityKind: 'asset',
    verb: 'approved',
    actor: 'Brand Reviewer',
    message: 'Approved service brochure for campaign usage.',
    createdAt: 'Recent',
  },
  {
    id: 'log-002',
    entityId: 'repo-product-001',
    entityKind: 'product_sheet',
    verb: 'updated',
    actor: 'Marketing',
    message: 'Updated SEO and audience fields.',
    createdAt: 'Recent',
  },
];

export function listPhase12Entities(): Phase12RepositoryEntity[] {
  return [...phase12RepositorySeed];
}

export function findPhase12EntityById(id: string): Phase12RepositoryEntity | undefined {
  return phase12RepositorySeed.find((entity) => entity.id === id);
}

export function listPhase12Activity(): Phase12ActivityLogEntry[] {
  return [...phase12ActivitySeed];
}