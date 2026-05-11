import type { CsvImportJob, CsvSyncPlan } from "./sync-types"

export function createCsvSyncPlan(rows: Record<string, string>[]): CsvSyncPlan {
  const seen = new Set<string>()
  let conflicts = 0
  let skipped = 0

  rows.forEach((row) => {
    if (!row.id) skipped += 1
    if (row.id && seen.has(row.id)) conflicts += 1
    if (row.id) seen.add(row.id)
  })

  return {
    creates: rows.filter((row) => row.id && !row.existing_id).length,
    updates: rows.filter((row) => row.existing_id).length,
    skipped,
    conflicts,
    warnings: [
      "Phase 2 runs dry-run planning only.",
      "Production sync requires Phase 3 server action + Supabase wiring.",
      "Review conflicts before upsert mode.",
    ],
  }
}

export function createImportJob(input: {
  datasetType: CsvImportJob["datasetType"]
  fileName: string
  rowCount: number
  errorCount: number
}): CsvImportJob {
  return {
    id: `import-${Date.now()}`,
    datasetType: input.datasetType,
    fileName: input.fileName,
    rowCount: input.rowCount,
    errorCount: input.errorCount,
    syncMode: "dry_run",
    status: input.errorCount > 0 ? "draft" : "ready",
    createdAt: new Date().toISOString(),
    createdBy: "local-operator",
  }
}