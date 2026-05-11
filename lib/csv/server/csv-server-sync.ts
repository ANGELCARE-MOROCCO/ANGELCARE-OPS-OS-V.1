import type { CsvDatasetType, CsvSyncMode } from "../sync-types"
import { validateCsvRows } from "../validators"
import { getTargetTableForDataset } from "./dataset-table-map"
import { createCsvImportSupabaseClient } from "./supabase-import-client"
import { createCsvImportJob, recordCsvImportAudit } from "./csv-import-audit"
import { createRollbackSnapshot } from "./csv-rollback"

function normalizeRow(row: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim(),
      value === "" ? null : value,
    ])
  )
}

export async function runCsvServerSync(input: {
  datasetType: CsvDatasetType
  fileName: string
  syncMode: CsvSyncMode
  rows: Record<string, string>[]
}) {
  const validation = validateCsvRows(input.rows)

  const job = await createCsvImportJob({
    datasetType: input.datasetType,
    fileName: input.fileName,
    rowCount: input.rows.length,
    errorCount: validation.errors.length,
    syncMode: input.syncMode,
    status: validation.errors.length > 0 ? "failed" : "validated",
  })

  await recordCsvImportAudit({
    jobId: job.id,
    action: "validation",
    detail: validation.errors.length > 0 ? "CSV validation failed" : "CSV validation passed",
    payload: { errors: validation.errors },
  })

  if (validation.errors.length > 0) {
    return { ok: false, job, errors: validation.errors }
  }

  if (input.syncMode === "dry_run") {
    await recordCsvImportAudit({
      jobId: job.id,
      action: "dry_run",
      detail: "Dry-run completed. No database mutation executed.",
      payload: { rowCount: input.rows.length },
    })

    return {
      ok: true,
      job,
      mode: "dry_run",
      message: "Dry-run completed. No rows were written.",
    }
  }

  const targetTable = getTargetTableForDataset(input.datasetType)
  const supabase = createCsvImportSupabaseClient()
  const normalizedRows = input.rows.map(normalizeRow)

  await createRollbackSnapshot({
    jobId: job.id,
    datasetType: input.datasetType,
    targetTable,
    rows: normalizedRows,
  })

  await recordCsvImportAudit({
    jobId: job.id,
    action: "rollback_snapshot_created",
    detail: "Rollback snapshot created before sync mutation.",
    payload: { targetTable },
  })

  if (input.syncMode === "create_only") {
    const { data, error } = await supabase
      .from(targetTable)
      .insert(normalizedRows)
      .select("*")

    if (error) throw new Error(error.message)

    await recordCsvImportAudit({
      jobId: job.id,
      action: "create_only_sync",
      detail: `Inserted ${data?.length ?? 0} rows into ${targetTable}.`,
      payload: { targetTable },
    })

    return { ok: true, job, data, targetTable }
  }

  if (input.syncMode === "upsert") {
    const { data, error } = await supabase
      .from(targetTable)
      .upsert(normalizedRows, { onConflict: "id" })
      .select("*")

    if (error) throw new Error(error.message)

    await recordCsvImportAudit({
      jobId: job.id,
      action: "upsert_sync",
      detail: `Upserted ${data?.length ?? 0} rows into ${targetTable}.`,
      payload: { targetTable },
    })

    return { ok: true, job, data, targetTable }
  }

  return {
    ok: false,
    job,
    error: "update_only mode requires custom table-specific update logic.",
  }
}