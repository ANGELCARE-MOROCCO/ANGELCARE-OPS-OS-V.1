export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ContentCommandAssetRecord {
  id: string;
  title: string;
  status: string;
  owner_id?: string | null;
  campaign_id?: string | null;
  channel?: string | null;
  scheduled_date?: string | null;
  due_date?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateContentCommandAssetInput {
  title: string;
  status?: string;
  owner_id?: string;
  campaign_id?: string;
  channel?: string;
  scheduled_date?: string;
  due_date?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentCommandRepository {
  listAssets(): Promise<RepositoryResult<ContentCommandAssetRecord[]>>;
  getAsset(id: string): Promise<RepositoryResult<ContentCommandAssetRecord>>;
  createAsset(input: CreateContentCommandAssetInput): Promise<RepositoryResult<ContentCommandAssetRecord>>;
  updateAsset(id: string, input: Partial<CreateContentCommandAssetInput>): Promise<RepositoryResult<ContentCommandAssetRecord>>;
  archiveAsset(id: string): Promise<RepositoryResult<ContentCommandAssetRecord>>;
}