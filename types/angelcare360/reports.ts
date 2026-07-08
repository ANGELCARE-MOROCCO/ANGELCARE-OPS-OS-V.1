import type { Angelcare360AuditRecord } from './audit'
import type { Angelcare360BaseRecord, Angelcare360Json, Angelcare360UUID } from './database'

export type Angelcare360ReportTemplateStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type Angelcare360ReportRequestStatus = 'draft' | 'requested' | 'processing_locked' | 'ready' | 'failed' | 'cancelled'
export type Angelcare360ExportStatus = 'queued' | 'processing_locked' | 'completed' | 'failed' | 'cancelled' | 'blocked_not_configured'
export type Angelcare360DocumentTemplateStatus = 'draft' | 'ready' | 'archived' | 'blocked_not_configured'
export type Angelcare360ExportFormat = 'pdf_a4' | 'csv' | 'xlsx' | 'json' | 'print_view'

export interface Angelcare360ReportCatalogueRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  report_code: string
  report_family: string
  label: string
  description?: string | null
  owner_role?: string | null
  status: string
  template_count?: number
  request_count?: number
  history_count?: number
  export_count?: number
  module_key?: string | null
  detail_href?: string
}

export interface Angelcare360ReportTemplateRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  report_id: Angelcare360UUID
  template_code: string
  label: string
  module_key: string
  report_family: string
  output_format: Angelcare360ExportFormat | string
  description?: string | null
  status: Angelcare360ReportTemplateStatus | string
  config_json?: Angelcare360Json
}

export interface Angelcare360ReportTemplateListRecord extends Angelcare360ReportTemplateRecord {
  report_code?: string | null
  report_label?: string | null
  detail_href?: string
}

export interface Angelcare360ReportRequestRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  report_id: Angelcare360UUID
  report_template_id?: Angelcare360UUID | null
  request_code: string
  report_code: string
  module_key: string
  date_from?: string | null
  date_to?: string | null
  filters_json?: Angelcare360Json
  status: Angelcare360ReportRequestStatus | string
  requested_by?: Angelcare360UUID | null
  requested_at: string
  completed_at?: string | null
  result_export_id?: Angelcare360UUID | null
  result_document_id?: Angelcare360UUID | null
  error_message?: string | null
}

export interface Angelcare360ReportRequestListRecord extends Angelcare360ReportRequestRecord {
  report_label?: string | null
  template_label?: string | null
  report_family?: string | null
  detail_href?: string
}

export interface Angelcare360ReportHistoryRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  history_type: 'request' | 'export'
  entity_id: Angelcare360UUID
  entity_code?: string | null
  label?: string | null
  status: string
  requested_at?: string | null
  completed_at?: string | null
  file_name?: string | null
  file_path?: string | null
  report_label?: string | null
  export_format?: string | null
  module_key?: string | null
  detail_href?: string
}

export interface Angelcare360ExportFileRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  report_export_id?: Angelcare360UUID | null
  export_code: string
  file_code: string
  file_name: string
  file_path: string
  storage_provider: string
  mime_type?: string | null
  file_size_bytes?: number | null
  export_format?: Angelcare360ExportFormat | string
  status: Angelcare360ExportStatus | string
  metadata_json?: Angelcare360Json
}

export interface Angelcare360ExportFileListRecord extends Angelcare360ExportFileRecord {
  report_code?: string | null
  report_label?: string | null
  detail_href?: string
}

export interface Angelcare360DocumentTemplateRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  template_code: string
  label: string
  document_type: string
  output_format: Angelcare360ExportFormat | string
  description?: string | null
  retention_days?: number | null
  status: Angelcare360DocumentTemplateStatus | string
  config_json?: Angelcare360Json
}

export interface Angelcare360DocumentTemplateListRecord extends Angelcare360DocumentTemplateRecord {
  detail_href?: string
}

export interface Angelcare360ReportReadinessRecord {
  reportCatalogueReady: boolean
  reportTemplateReady: boolean
  reportRequestReady: boolean
  exportReady: boolean
  pdfA4Ready: boolean
  csvXlsxReady: boolean
  documentReady: boolean
  storageReady: boolean
}

export interface Angelcare360ReportsOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  reportCount: number
  templateCount: number
  requestCount: number
  historyCount: number
  exportCount: number
  documentCount: number
  readiness: Angelcare360ReportReadinessRecord
  risks: string[]
  latestAuditEvents: Angelcare360AuditRecord[]
}

export interface Angelcare360ExportsOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  exportFileCount: number
  exportHistoryCount: number
  reportExportCount: number
  blockedExportAttemptCount: number
  pdfA4Ready: boolean
  csvXlsxReady: boolean
  fileStorageReady: boolean
  risks: string[]
  latestAuditEvents: Angelcare360AuditRecord[]
}

export interface Angelcare360DocumentsOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  generatedDocumentCount: number
  templateCount: number
  governanceReady: boolean
  storageReady: boolean
  auditReady: boolean
  risks: string[]
  latestAuditEvents: Angelcare360AuditRecord[]
}

export interface Angelcare360DocumentGovernanceReadinessRecord {
  templateReady: boolean
  storageReady: boolean
  retentionReady: boolean
  auditReady: boolean
  exportReady: boolean
  permissionReady: boolean
  reason: string
}

export interface Angelcare360ReportAuditFilter {
  schoolId?: Angelcare360UUID | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: Angelcare360UUID | null
  actorUserId?: Angelcare360UUID | null
  search?: string | null
  status?: string | null
  from?: string | null
  to?: string | null
  reportCode?: string | null
}

export interface Angelcare360ExportAuditFilter extends Angelcare360ReportAuditFilter {
  format?: string | null
}

export interface Angelcare360DocumentAuditFilter extends Angelcare360ReportAuditFilter {
  documentType?: string | null
}

export interface Angelcare360ReportMutationResult<T = unknown> {
  ok: boolean
  record?: T | null
  records?: T[]
  error?: string
  warning?: string | null
  idempotent?: boolean
  locked?: boolean
  reason?: string | null
}
