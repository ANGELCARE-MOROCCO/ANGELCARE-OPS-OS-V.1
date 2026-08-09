import type {
  Phase16BaseRecord,
  Phase16CreateRecordInput,
  Phase16MutationResult,
  Phase16UpdateRecordInput,
} from './phase16-data-types';

export interface Phase16RepositoryAdapter {
  list(): Promise<Phase16MutationResult<Phase16BaseRecord[]>>;
  getById(id: string): Promise<Phase16MutationResult<Phase16BaseRecord>>;
  create(input: Phase16CreateRecordInput): Promise<Phase16MutationResult<Phase16BaseRecord>>;
  update(input: Phase16UpdateRecordInput): Promise<Phase16MutationResult<Phase16BaseRecord>>;
  archive(id: string): Promise<Phase16MutationResult<Phase16BaseRecord>>;
}

export const phase16InitialRecords: Phase16BaseRecord[] = [
  {
    id: 'phase16-asset-001',
    kind: 'content_asset',
    title: 'Core service brochure',
    status: 'approved',
    owner: 'Content Lead',
    campaignId: 'core-services',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phase16-sheet-001',
    kind: 'product_service_sheet',
    title: 'Family support package',
    status: 'review',
    owner: 'Marketing',
    campaignId: 'family-care',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function createPhase16MemoryAdapter(seed: Phase16BaseRecord[] = phase16InitialRecords): Phase16RepositoryAdapter {
  let records = [...seed];

  return {
    async list() {
      return { ok: true, data: [...records] };
    },

    async getById(id: string) {
      const record = records.find((item) => item.id === id);
      return record ? { ok: true, data: record } : { ok: false, error: 'Record not found.' };
    },

    async create(input) {
      const now = new Date().toISOString();
      const record: Phase16BaseRecord = {
        id: `record-${Math.random().toString(36).slice(2)}`,
        kind: input.kind,
        title: input.title,
        status: input.status ?? 'draft',
        owner: input.owner,
        campaignId: input.campaignId,
        createdAt: now,
        updatedAt: now,
      };

      records = [record, ...records];
      return { ok: true, data: record };
    },

    async update(input) {
      const existing = records.find((item) => item.id === input.id);
      if (!existing) return { ok: false, error: 'Record not found.' };

      const updated: Phase16BaseRecord = {
        ...existing,
        title: input.title ?? existing.title,
        status: input.status ?? existing.status,
        owner: input.owner ?? existing.owner,
        campaignId: input.campaignId ?? existing.campaignId,
        updatedAt: new Date().toISOString(),
      };

      records = records.map((item) => (item.id === input.id ? updated : item));
      return { ok: true, data: updated };
    },

    async archive(id) {
      const existing = records.find((item) => item.id === id);
      if (!existing) return { ok: false, error: 'Record not found.' };

      const archived: Phase16BaseRecord = {
        ...existing,
        status: 'archived',
        updatedAt: new Date().toISOString(),
      };

      records = records.map((item) => (item.id === id ? archived : item));
      return { ok: true, data: archived };
    },
  };
}