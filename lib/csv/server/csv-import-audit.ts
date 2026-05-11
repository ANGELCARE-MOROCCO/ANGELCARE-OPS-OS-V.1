import { createCsvImportSupabaseClient } from "./supabase-import-client"

export async function createCsvImportJob(input: {
  datasetType: string
  fileName: string
  rowCount: number
  errorCount: number
  syncMode: string
  status: string
}) {
  const supabase = createCsvImportSupabaseClient()

  const { data, error } = await supabase
    .from("market_csv_import_jobs")
    .insert({
      dataset_type: input.datasetType,
      file_name: input.fileName,
      row_count: input.rowCount,
      error_count: input.errorCount,
      sync_mode: input.syncMode,
      status: input.status,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function recordCsvImportAudit(input: {
  jobId: string
  action: string
  detail: string
  payload?: Record<string, unknown>
}) {
  const supabase = createCsvImportSupabaseClient()

  const { error } = await supabase.from("market_csv_import_audit").insert({
    job_id: input.jobId,
    action: input.action,
    detail: input.detail,
    payload: input.payload ?? {},
  })

  if (error) throw new Error(error.message)
}

export async function listCsvImportJobs() {
  const supabase = createCsvImportSupabaseClient()

  const { data, error } = await supabase
    .from("market_csv_import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data ?? []
}