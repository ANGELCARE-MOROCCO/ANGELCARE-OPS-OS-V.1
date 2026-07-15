import type {
  ContentCommandAssetRecord,
  ContentCommandRepository,
  CreateContentCommandAssetInput,
  RepositoryResult,
} from './content-command-repository-template';

export function createSupabaseContentCommandRepository(): ContentCommandRepository {
  return {
    async listAssets(): Promise<RepositoryResult<ContentCommandAssetRecord[]>> {
      return { ok: false, error: 'Wire Supabase server client here after schema is live.' };
    },

    async getAsset(): Promise<RepositoryResult<ContentCommandAssetRecord>> {
      return { ok: false, error: 'Wire Supabase server client here after schema is live.' };
    },

    async createAsset(_input: CreateContentCommandAssetInput): Promise<RepositoryResult<ContentCommandAssetRecord>> {
      return { ok: false, error: 'Wire Supabase server client + validation + audit here.' };
    },

    async updateAsset(): Promise<RepositoryResult<ContentCommandAssetRecord>> {
      return { ok: false, error: 'Wire Supabase server client + validation + audit here.' };
    },

    async archiveAsset(): Promise<RepositoryResult<ContentCommandAssetRecord>> {
      return { ok: false, error: 'Wire Supabase server client + validation + audit here.' };
    },
  };
}