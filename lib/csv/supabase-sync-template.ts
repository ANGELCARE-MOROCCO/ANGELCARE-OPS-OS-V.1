import type { CsvDatasetType, CsvSyncMode } from "./sync-types"

export async function syncCsvRowsToSupabaseTemplate(input: {
  datasetType: CsvDatasetType
  mode: CsvSyncMode
  rows: Record<string, string>[]
}) {
  // Phase 2 template only.
  // Real implementation belongs in Phase 3 server actions/API routes.
  // Never sync from client directly in production.
  return {
    ok: false,
    message: "Supabase sync not active in Phase 2. Use dry-run plan only.",
    receivedRows: input.rows.length,
    datasetType: input.datasetType,
    mode: input.mode,
  }
}