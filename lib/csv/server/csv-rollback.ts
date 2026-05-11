import { createCsvImportSupabaseClient } from "./supabase-import-client"

export async function createRollbackSnapshot(input: {
  jobId: string
  datasetType: string
  targetTable: string
  rows: Record<string, unknown>[]
}) {
  const supabase = createCsvImportSupabaseClient()

  const { data, error } = await supabase
    .from("market_csv_import_rollback_snapshots")
    .insert({
      job_id: input.jobId,
      dataset_type: input.datasetType,
      target_table: input.targetTable,
      snapshot: input.rows,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listRollbackSnapshots(jobId: string) {
  const supabase = createCsvImportSupabaseClient()

  const { data, error } = await supabase
    .from("market_csv_import_rollback_snapshots")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}