export type CsvDatasetType =
  | "content"
  | "tasks"
  | "partnerships"
  | "leads"
  | "recruitment"
  | "academy"
  | "ambassadors"
  | "analytics"
  | "media"
  | "market_intel"

export type CsvSyncMode = "dry_run" | "create_only" | "upsert" | "update_only"

export type CsvSyncStatus = "draft" | "validated" | "ready" | "synced" | "failed" | "rolled_back"

export type CsvImportJob = {
  id: string
  datasetType: CsvDatasetType
  fileName: string
  rowCount: number
  errorCount: number
  syncMode: CsvSyncMode
  status: CsvSyncStatus
  createdAt: string
  createdBy: string
}

export type CsvSyncPlan = {
  creates: number
  updates: number
  skipped: number
  conflicts: number
  warnings: string[]
}

export type CsvAuditRecord = {
  id: string
  jobId: string
  action: string
  detail: string
  createdAt: string
}