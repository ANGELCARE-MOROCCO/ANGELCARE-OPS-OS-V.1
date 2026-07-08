import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import {
  auditReportingEvent,
  asDateOnly,
  asNumber,
  asOptionalString,
  asString,
  buildCode,
  countRows,
  fetchAuditRows,
  getContextOrNull,
  recordToRow,
} from './reporting-helpers'
import {
  angelcare360DocumentAuditQueryFiltersSchema,
  angelcare360DocumentTemplateCreateSchema,
  angelcare360DocumentTemplateUpdateSchema,
  angelcare360ExportAuditQueryFiltersSchema,
  angelcare360ExportAttemptBlockedSchema,
  angelcare360ReportAuditQueryFiltersSchema,
  angelcare360ReportRequestCancelSchema,
  angelcare360ReportRequestCreateSchema,
  angelcare360ReportTemplateCreateSchema,
  angelcare360ReportTemplateUpdateSchema,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360DocumentAuditFilter,
  Angelcare360DocumentGovernanceReadinessRecord,
  Angelcare360DocumentTemplateListRecord,
  Angelcare360DocumentTemplateRecord,
  Angelcare360DocumentsOverviewRecord,
  Angelcare360ExportAuditFilter,
  Angelcare360ExportFileListRecord,
  Angelcare360ExportFileRecord,
  Angelcare360ExportsOverviewRecord,
  Angelcare360ReportAuditFilter,
  Angelcare360ReportCatalogueRecord,
  Angelcare360ReportHistoryRecord,
  Angelcare360ReportRequestListRecord,
  Angelcare360ReportRequestRecord,
  Angelcare360ReportReadinessRecord,
  Angelcare360ReportTemplateListRecord,
  Angelcare360ReportTemplateRecord,
  Angelcare360ReportsOverviewRecord,
} from '@/types/angelcare360/reports'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const REPORT_MODULE = 'rapports'
const EXPORT_MODULE = 'exports'
const DOCUMENT_MODULE = 'documents'
const PDF_LOCK_REASON = 'La génération PDF sera activée après configuration du moteur d’export.'
const CSV_XLSX_LOCK_REASON = 'L’export CSV/XLSX nécessite une infrastructure d’export validée.'
const FILE_DOWNLOAD_LOCK_REASON = 'Aucun fichier ne peut être téléchargé sans génération réelle.'
const DOCUMENT_LOCK_REASON = 'La génération documentaire sera activée dans la phase d’exports finalisée.'

function mapBaseRecord(row: Row) {
  return {
    id: asString(row.id),
    created_at: asString(row.created_at || new Date().toISOString()),
    updated_at: asString(row.updated_at || row.created_at || new Date().toISOString()),
  }
}

function mapReportTemplate(row: Row): Angelcare360ReportTemplateRecord & Partial<Angelcare360ReportTemplateListRecord> {
  const report = recordToRow(row.report)
  return {
    ...mapBaseRecord(row),
    school_id: asString(row.school_id),
    report_id: asString(row.report_id),
    template_code: asString(row.template_code),
    label: asString(row.label),
    module_key: asString(row.module_key || 'rapports'),
    report_family: asString(row.report_family || 'standard'),
    output_format: asString(row.output_format || 'pdf_a4'),
    description: row.description ? asString(row.description) : null,
    status: asString(row.status),
    config_json: (row.config_json as Record<string, unknown>) || {},
    report_code: asString(report.report_code || ''),
    report_label: asString(report.label || ''),
    detail_href: `/angelcare-360-command-center/rapports/modeles/${row.id}`,
  }
}

function mapReportRequest(row: Row): Angelcare360ReportRequestRecord & Partial<Angelcare360ReportRequestListRecord> {
  const report = recordToRow(row.report)
  const template = recordToRow(row.template)
  return {
    ...mapBaseRecord(row),
    school_id: asString(row.school_id),
    report_id: asString(row.report_id),
    report_template_id: row.report_template_id ? asString(row.report_template_id) : null,
    request_code: asString(row.request_code),
    report_code: asString(row.report_code),
    report_family: asString(row.report_family || 'standard'),
    module_key: asString(row.module_key || 'rapports'),
    date_from: row.date_from ? asString(row.date_from) : null,
    date_to: row.date_to ? asString(row.date_to) : null,
    filters_json: (row.filters_json as Record<string, unknown>) || {},
    status: asString(row.status),
    requested_by: row.requested_by ? asString(row.requested_by) : null,
    requested_at: asString(row.requested_at || new Date().toISOString()),
    completed_at: row.completed_at ? asString(row.completed_at) : null,
    result_export_id: row.result_export_id ? asString(row.result_export_id) : null,
    result_document_id: row.result_document_id ? asString(row.result_document_id) : null,
    error_message: row.error_message ? asString(row.error_message) : null,
    report_label: asString(report.label || ''),
    template_label: asString(template.label || ''),
    detail_href: `/angelcare-360-command-center/rapports/demandes`,
  }
}

function mapReportHistoryFromRequest(row: Row): Angelcare360ReportHistoryRecord {
  const report = recordToRow(row.report)
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    history_type: 'request',
    entity_id: asString(row.id),
    entity_code: asString(row.request_code || ''),
    label: asString(report.label || ''),
    status: asString(row.status),
    requested_at: row.requested_at ? asString(row.requested_at) : null,
    completed_at: row.completed_at ? asString(row.completed_at) : null,
    report_label: asString(report.label || ''),
    export_format: row.result_export_id ? 'export' : null,
    module_key: asString(row.module_key || 'rapports'),
    detail_href: `/angelcare-360-command-center/rapports/demandes`,
  }
}

function mapReportHistoryFromExport(row: Row): Angelcare360ReportHistoryRecord {
  const report = recordToRow(row.report)
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    history_type: 'export',
    entity_id: asString(row.id),
    entity_code: asString(row.export_code || ''),
    label: asString(report.label || ''),
    status: asString(row.status),
    requested_at: row.requested_at ? asString(row.requested_at) : null,
    completed_at: row.completed_at ? asString(row.completed_at) : null,
    file_name: row.file_document_id ? asString(recordToRow(row.file_document).file_name || '') : null,
    file_path: row.file_document_id ? asString(recordToRow(row.file_document).file_path || '') : null,
    report_label: asString(report.label || ''),
    export_format: asString(row.export_format || 'pdf'),
    module_key: 'exports',
    detail_href: `/angelcare-360-command-center/exports/files`,
  }
}

function mapExportFile(row: Row): Angelcare360ExportFileRecord & Partial<Angelcare360ExportFileListRecord> {
  const reportExport = recordToRow(row.report_export)
  const report = recordToRow(reportExport.report)
  return {
    ...mapBaseRecord(row),
    school_id: asString(row.school_id),
    report_export_id: row.report_export_id ? asString(row.report_export_id) : null,
    export_code: asString(row.export_code),
    file_code: asString(row.file_code),
    file_name: asString(row.file_name),
    file_path: asString(row.file_path),
    storage_provider: asString(row.storage_provider || 'supabase'),
    mime_type: row.mime_type ? asString(row.mime_type) : null,
    file_size_bytes: asNumber(row.file_size_bytes),
    export_format: asString(row.export_format || 'pdf_a4'),
    status: asString(row.status),
    metadata_json: (row.metadata_json as Record<string, unknown>) || {},
    report_code: asString(report.report_code || ''),
    report_label: asString(report.label || ''),
    detail_href: `/angelcare-360-command-center/exports/files`,
  }
}

function mapDocumentTemplate(row: Row): Angelcare360DocumentTemplateRecord & Partial<Angelcare360DocumentTemplateListRecord> {
  return {
    ...mapBaseRecord(row),
    school_id: asString(row.school_id),
    template_code: asString(row.template_code),
    label: asString(row.label),
    document_type: asString(row.document_type || 'general'),
    output_format: asString(row.output_format || 'pdf_a4'),
    description: row.description ? asString(row.description) : null,
    retention_days: row.retention_days === null || row.retention_days === undefined ? null : Number(row.retention_days),
    status: asString(row.status),
    config_json: (row.config_json as Record<string, unknown>) || {},
    detail_href: `/angelcare-360-command-center/documents/templates`,
  }
}

async function getCurrentSchoolContext(schoolId?: string | null) {
  const context = await getContextOrNull(schoolId)
  return context
}

async function queryReports(supabase: SupabaseClient, schoolId: string) {
  const [reports, templates, requests, exportsRows] = await Promise.all([
    supabase.from('angelcare360_reports').select('*').eq('school_id', schoolId).order('label', { ascending: true }),
    supabase.from('angelcare360_report_templates').select('*, report:angelcare360_reports(id, report_code, label, report_family, status)').eq('school_id', schoolId).order('label', { ascending: true }),
    supabase.from('angelcare360_report_requests').select('*, report:angelcare360_reports(id, report_code, label, report_family, status), template:angelcare360_report_templates(id, label, template_code, status)').eq('school_id', schoolId).order('requested_at', { ascending: false }),
    supabase.from('angelcare360_report_exports').select('*, report:angelcare360_reports(id, report_code, label, report_family, status), file_document:angelcare360_documents(id, file_name, file_path, status)').eq('school_id', schoolId).order('requested_at', { ascending: false }),
  ])
  return {
    reports: (reports.data || []) as Row[],
    templates: (templates.data || []) as Row[],
    requests: (requests.data || []) as Row[],
    exports: (exportsRows.data || []) as Row[],
  }
}

export async function getAngelcare360ReportsOverview(options?: { schoolId?: string | null }): Promise<Angelcare360ReportsOverviewRecord | null> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const school = context.school
  const schoolId = school.id
  const [reportCount, templateCount, requestCount, exportCount, documentCount, latestAuditEvents] = await Promise.all([
    countRows(supabase, 'angelcare360_reports', schoolId),
    countRows(supabase, 'angelcare360_report_templates', schoolId),
    countRows(supabase, 'angelcare360_report_requests', schoolId),
    countRows(supabase, 'angelcare360_report_exports', schoolId),
    countRows(supabase, 'angelcare360_documents', schoolId),
    fetchAuditRows({ schoolId, modules: [REPORT_MODULE, EXPORT_MODULE, DOCUMENT_MODULE], limit: 8 }),
  ])

  const readiness: Angelcare360ReportReadinessRecord = {
    reportCatalogueReady: reportCount > 0,
    reportTemplateReady: templateCount > 0,
    reportRequestReady: requestCount > 0,
    exportReady: false,
    pdfA4Ready: false,
    csvXlsxReady: false,
    documentReady: documentCount > 0,
    storageReady: documentCount > 0,
  }

  const risks = [
    reportCount === 0 ? 'Aucun rapport catalogue n’est encore enregistré.' : null,
    templateCount === 0 ? 'Les modèles de rapport ne sont pas encore configurés.' : null,
    requestCount === 0 ? 'Aucune demande de rapport n’est en attente.' : null,
    readiness.pdfA4Ready ? null : PDF_LOCK_REASON,
    readiness.csvXlsxReady ? null : CSV_XLSX_LOCK_REASON,
    readiness.documentReady ? null : DOCUMENT_LOCK_REASON,
  ].filter(Boolean) as string[]

  return {
    schoolId,
    schoolName: school.name,
    activeAcademicYearId: context.academicYear?.id || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
    reportCount,
    templateCount,
    requestCount,
    historyCount: requestCount + exportCount,
    exportCount,
    documentCount,
    readiness,
    risks,
    latestAuditEvents,
  }
}

export async function listAngelcare360ReportCatalogue(options?: { schoolId?: string | null }): Promise<Angelcare360ReportCatalogueRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const schoolId = school.id
  const { reports, templates, requests, exports } = await queryReports(supabase, schoolId)
  const templateCountByReport = new Map<string, number>()
  const requestCountByReport = new Map<string, number>()
  const exportCountByReport = new Map<string, number>()
  for (const template of templates) {
    const reportId = asString(template.report_id)
    templateCountByReport.set(reportId, (templateCountByReport.get(reportId) || 0) + 1)
  }
  for (const request of requests) {
    const reportId = asString(request.report_id)
    requestCountByReport.set(reportId, (requestCountByReport.get(reportId) || 0) + 1)
  }
  for (const exportRow of exports) {
    const reportId = asString(exportRow.report_id)
    exportCountByReport.set(reportId, (exportCountByReport.get(reportId) || 0) + 1)
  }
  return reports.map((report) => ({
    id: asString(report.id),
    school_id: schoolId,
    report_code: asString(report.report_code),
    report_family: asString(report.report_family || 'standard'),
    label: asString(report.label),
    description: report.description ? asString(report.description) : null,
    owner_role: report.owner_role ? asString(report.owner_role) : null,
    status: asString(report.status),
    template_count: templateCountByReport.get(asString(report.id)) || 0,
    request_count: requestCountByReport.get(asString(report.id)) || 0,
    history_count: (requestCountByReport.get(asString(report.id)) || 0) + (exportCountByReport.get(asString(report.id)) || 0),
    export_count: exportCountByReport.get(asString(report.id)) || 0,
    module_key: asString(recordToRow(report.config_json).module_key || 'rapports'),
    detail_href: '/angelcare-360-command-center/rapports/catalogue',
  }))
}

export async function listAngelcare360ReportTemplates(options?: { schoolId?: string | null }): Promise<Angelcare360ReportTemplateListRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_report_templates')
    .select('*, report:angelcare360_reports(id, report_code, label, report_family, status)')
    .eq('school_id', school.id)
    .order('label', { ascending: true })
  return ((data || []) as Row[]).map(mapReportTemplate)
}

export async function getAngelcare360ReportTemplateById(options: { schoolId?: string | null; id: string }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_report_templates')
    .select('*, report:angelcare360_reports(id, report_code, label, report_family, status)')
    .eq('school_id', school.id)
    .eq('id', options.id)
    .maybeSingle()
  return data ? (mapReportTemplate(data as Row) as Angelcare360ReportTemplateListRecord) : null
}

export async function createAngelcare360ReportTemplate(input: Record<string, unknown>) {
  const parsed = angelcare360ReportTemplateCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Modèle de rapport invalide.' }
  const context = await requireAngelcare360Permission('rapports.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const school = context.school!
  const { data: report } = await supabase.from('angelcare360_reports').select('*').eq('school_id', school.id).eq('id', parsed.data.reportId).maybeSingle()
  if (!report) return { ok: false, error: 'Le rapport catalogue est introuvable.' }
  const existing = await supabase.from('angelcare360_report_templates').select('*').eq('school_id', school.id).eq('template_code', parsed.data.templateCode).maybeSingle()
  if (existing.data && asString(existing.data.label) === parsed.data.label && asString(existing.data.output_format) === parsed.data.outputFormat && asString(existing.data.status) === parsed.data.status) {
    return { ok: true, record: mapReportTemplate({ ...(existing.data as Row), report }) as Angelcare360ReportTemplateListRecord, idempotent: true }
  }
  const payload = {
    school_id: school.id,
    report_id: parsed.data.reportId,
    template_code: parsed.data.templateCode,
    label: parsed.data.label,
    module_key: parsed.data.moduleKey,
    report_family: parsed.data.reportFamily,
    output_format: parsed.data.outputFormat,
    description: parsed.data.description,
    config_json: parsed.data.configJson || {},
    status: parsed.data.status || 'draft',
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const { data, error } = await supabase.from('angelcare360_report_templates').insert(payload).select('*, report:angelcare360_reports(id, report_code, label, report_family, status)').single()
  if (error || !data) {
    return { ok: false, error: error?.message || 'Impossible d’enregistrer le modèle de rapport.' }
  }
  await auditReportingEvent({
    category: 'reports',
    module: REPORT_MODULE,
    action: 'report_template.created',
    schoolId: school.id,
    entityType: 'angelcare360_report_templates',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: mapReportTemplate(data as Row) as Angelcare360ReportTemplateListRecord }
}

export async function updateAngelcare360ReportTemplate(input: Record<string, unknown>) {
  const parsed = angelcare360ReportTemplateUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Modèle de rapport invalide.' }
  const context = await requireAngelcare360Permission('rapports.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const school = context.school!
  const { data: current } = await supabase.from('angelcare360_report_templates').select('*, report:angelcare360_reports(id, report_code, label, report_family, status)').eq('school_id', school.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Modèle de rapport introuvable.' }
  const next = {
    report_id: parsed.data.reportId,
    template_code: parsed.data.templateCode,
    label: parsed.data.label,
    module_key: parsed.data.moduleKey,
    report_family: parsed.data.reportFamily,
    output_format: parsed.data.outputFormat,
    description: parsed.data.description,
    config_json: parsed.data.configJson || {},
    status: parsed.data.status,
    updated_by: context.user.id,
  }
  const { data, error } = await supabase.from('angelcare360_report_templates').update(next).eq('school_id', school.id).eq('id', parsed.data.id).select('*, report:angelcare360_reports(id, report_code, label, report_family, status)').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de mettre à jour le modèle de rapport.' }
  await auditReportingEvent({
    category: 'reports',
    module: REPORT_MODULE,
    action: 'report_template.updated',
    schoolId: school.id,
    entityType: 'angelcare360_report_templates',
    entityId: String(data.id),
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: mapReportTemplate(data as Row) as Angelcare360ReportTemplateListRecord }
}

export async function listAngelcare360ReportRequests(options?: { schoolId?: string | null }): Promise<Angelcare360ReportRequestListRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_report_requests')
    .select('*, report:angelcare360_reports(id, report_code, label, report_family, status), template:angelcare360_report_templates(id, label, template_code, status)')
    .eq('school_id', school.id)
    .order('requested_at', { ascending: false })
  return ((data || []) as Row[]).map(mapReportRequest)
}

export async function getAngelcare360ReportRequestById(options: { schoolId?: string | null; id: string }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_report_requests')
    .select('*, report:angelcare360_reports(id, report_code, label, report_family, status), template:angelcare360_report_templates(id, label, template_code, status)')
    .eq('school_id', school.id)
    .eq('id', options.id)
    .maybeSingle()
  return data ? (mapReportRequest(data as Row) as Angelcare360ReportRequestListRecord) : null
}

export async function createAngelcare360ReportRequest(input: Record<string, unknown>) {
  const parsed = angelcare360ReportRequestCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Demande de rapport invalide.' }
  const context = await requireAngelcare360Permission('rapports.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const school = context.school!
  const { data: report } = await supabase.from('angelcare360_reports').select('*').eq('school_id', school.id).eq('id', parsed.data.reportId).maybeSingle()
  if (!report) return { ok: false, error: 'Le rapport catalogue est introuvable.' }
  let templateRow: Row | null = null
  if (parsed.data.reportTemplateId) {
    const { data } = await supabase.from('angelcare360_report_templates').select('*').eq('school_id', school.id).eq('id', parsed.data.reportTemplateId).maybeSingle()
    templateRow = (data as Row | null) || null
    if (!templateRow) return { ok: false, error: 'Le modèle de rapport est introuvable.' }
  }
  const existing = await supabase.from('angelcare360_report_requests').select('*').eq('school_id', school.id).eq('request_code', parsed.data.requestCode).maybeSingle()
  if (existing.data && asString(existing.data.status) === parsed.data.status) {
    return { ok: true, record: mapReportRequest({ ...(existing.data as Row), report, template: templateRow || undefined }) as Angelcare360ReportRequestListRecord, idempotent: true }
  }
  const payload = {
    school_id: school.id,
    report_id: parsed.data.reportId,
    report_template_id: parsed.data.reportTemplateId || null,
    request_code: parsed.data.requestCode,
    report_code: asString(report.report_code),
    report_family: asString(report.report_family || 'standard'),
    module_key: asString(parsed.data.moduleKey || templateRow?.module_key || 'rapports'),
    date_from: parsed.data.dateFrom || null,
    date_to: parsed.data.dateTo || null,
    filters_json: parsed.data.filtersJson || {},
    status: parsed.data.status || 'requested',
    requested_by: context.user.id,
    requested_at: new Date().toISOString(),
    completed_at: null,
    result_export_id: null,
    result_document_id: null,
    error_message: null,
    metadata_json: parsed.data.metadataJson || {},
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const { data, error } = await supabase.from('angelcare360_report_requests').insert(payload).select('*, report:angelcare360_reports(id, report_code, label, report_family, status), template:angelcare360_report_templates(id, label, template_code, status)').single()
  if (error || !data) {
    return { ok: false, error: error?.message || 'Impossible d’enregistrer la demande de rapport.' }
  }
  await auditReportingEvent({
    category: 'reports',
    module: REPORT_MODULE,
    action: 'report_request.created',
    schoolId: school.id,
    entityType: 'angelcare360_report_requests',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: mapReportRequest(data as Row) as Angelcare360ReportRequestListRecord }
}

export async function cancelAngelcare360ReportRequest(input: Record<string, unknown>) {
  const parsed = angelcare360ReportRequestCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Annulation de demande invalide.' }
  const context = await requireAngelcare360Permission('rapports.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const school = context.school!
  const { data: current } = await supabase.from('angelcare360_report_requests').select('*, report:angelcare360_reports(id, report_code, label, report_family, status), template:angelcare360_report_templates(id, label, template_code, status)').eq('school_id', school.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Demande de rapport introuvable.' }
  if (asString(current.status) === 'cancelled') return { ok: true, record: mapReportRequest(current as Row), idempotent: true }
  const { data, error } = await supabase
    .from('angelcare360_report_requests')
    .update({
      status: 'cancelled',
      error_message: parsed.data.reason || null,
      updated_by: context.user.id,
    })
    .eq('school_id', school.id)
    .eq('id', parsed.data.id)
    .select('*, report:angelcare360_reports(id, report_code, label, report_family, status), template:angelcare360_report_templates(id, label, template_code, status)')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’annuler la demande de rapport.' }
  await auditReportingEvent({
    category: 'reports',
    module: REPORT_MODULE,
    action: 'report_request.cancelled',
    schoolId: school.id,
    entityType: 'angelcare360_report_requests',
    entityId: String(data.id),
    severity: 'warning',
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    metadata: { reason: parsed.data.reason },
  })
  return { ok: true, record: mapReportRequest(data as Row) }
}

export async function listAngelcare360ReportHistory(options?: { schoolId?: string | null }): Promise<Angelcare360ReportHistoryRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const [requestsResponse, exportsResponse] = await Promise.all([
    supabase.from('angelcare360_report_requests').select('*, report:angelcare360_reports(id, report_code, label, report_family, status)').eq('school_id', school.id).order('requested_at', { ascending: false }),
    supabase.from('angelcare360_report_exports').select('*, report:angelcare360_reports(id, report_code, label, report_family, status), file_document:angelcare360_documents(id, file_name, file_path, status)').eq('school_id', school.id).order('requested_at', { ascending: false }),
  ])
  const requestRows = ((requestsResponse.data || []) as Row[]).map(mapReportHistoryFromRequest)
  const exportRows = ((exportsResponse.data || []) as Row[]).map(mapReportHistoryFromExport)
  return [...requestRows, ...exportRows].sort((a, b) => (a.requested_at || a.completed_at || '') < (b.requested_at || b.completed_at || '') ? 1 : -1)
}

export async function listAngelcare360ReportAuditEvents(options: { schoolId?: string | null; filters?: Angelcare360ReportAuditFilter }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return []
  const school = context.school
  return fetchAuditRows({
    schoolId: school.id,
    modules: [REPORT_MODULE, EXPORT_MODULE, DOCUMENT_MODULE],
    filters: options.filters || {},
    limit: 200,
  })
}

export async function getAngelcare360ExportOverview(options?: { schoolId?: string | null }): Promise<Angelcare360ExportsOverviewRecord | null> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const school = context.school
  const schoolId = school.id
  const [exportFileCount, exportHistoryCount, reportExportCount, blockedCount, latestAuditEvents] = await Promise.all([
    countRows(supabase, 'angelcare360_export_files', schoolId),
    countRows(supabase, 'angelcare360_export_files', schoolId),
    countRows(supabase, 'angelcare360_report_exports', schoolId),
    countRows(supabase, 'angelcare360_audit_logs', schoolId, [['module', 'eq', EXPORT_MODULE], ['action', 'eq', 'export_attempt.blocked_not_configured']]),
    fetchAuditRows({ schoolId, modules: [EXPORT_MODULE, REPORT_MODULE], limit: 8 }),
  ])
  return {
    schoolId,
    schoolName: school.name,
    activeAcademicYearId: context.academicYear?.id || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
    exportFileCount,
    exportHistoryCount,
    reportExportCount,
    blockedExportAttemptCount: blockedCount,
    pdfA4Ready: false,
    csvXlsxReady: false,
    fileStorageReady: exportFileCount > 0,
    risks: [
      PDF_LOCK_REASON,
      CSV_XLSX_LOCK_REASON,
      FILE_DOWNLOAD_LOCK_REASON,
      exportFileCount === 0 ? 'Aucun fichier d’export réel n’est disponible.' : null,
    ].filter(Boolean) as string[],
    latestAuditEvents,
  }
}

export async function getAngelcare360PdfA4Readiness(options?: { schoolId?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null
  return {
    ready: false,
    pdfEngineReady: false,
    a4TemplateReady: false,
    storageReady: false,
    permissionReady: true,
    reason: PDF_LOCK_REASON,
  }
}

export async function getAngelcare360CsvXlsxReadiness(options?: { schoolId?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null
  return {
    ready: false,
    csvReady: false,
    xlsxReady: false,
    storageReady: false,
    permissionReady: true,
    reason: CSV_XLSX_LOCK_REASON,
  }
}

export async function listAngelcare360ExportFiles(options?: { schoolId?: string | null }): Promise<Angelcare360ExportFileListRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_export_files')
    .select('*, report_export:angelcare360_report_exports(id, export_code, export_format, requested_at, completed_at, status, report:angelcare360_reports(id, report_code, label, report_family, status))')
    .eq('school_id', school.id)
    .order('created_at', { ascending: false })
  return ((data || []) as Row[]).map(mapExportFile)
}

export async function listAngelcare360ExportHistory(options?: { schoolId?: string | null }): Promise<Angelcare360ReportHistoryRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const [filesResponse, exportsResponse] = await Promise.all([
    supabase.from('angelcare360_export_files').select('*, report_export:angelcare360_report_exports(id, export_code, export_format, requested_at, completed_at, status, report:angelcare360_reports(id, report_code, label, report_family, status), file_document:angelcare360_documents(id, file_name, file_path, status))').eq('school_id', school.id).order('created_at', { ascending: false }),
    supabase.from('angelcare360_report_exports').select('*, report:angelcare360_reports(id, report_code, label, report_family, status), file_document:angelcare360_documents(id, file_name, file_path, status)').eq('school_id', school.id).order('requested_at', { ascending: false }),
  ])
  const fileRows = ((filesResponse.data || []) as Row[]).map((row) => {
    const reportExport = recordToRow(row.report_export)
    const report = recordToRow(reportExport.report)
    return {
      id: asString(row.id),
      school_id: asString(row.school_id),
      history_type: 'export' as const,
      entity_id: asString(row.id),
      entity_code: asString(row.export_code),
      label: asString(report.label || ''),
      status: asString(row.status),
      requested_at: reportExport.requested_at ? asString(reportExport.requested_at) : null,
      completed_at: reportExport.completed_at ? asString(reportExport.completed_at) : null,
      file_name: asString(row.file_name),
      file_path: asString(row.file_path),
      report_label: asString(report.label || ''),
      export_format: asString(row.export_format || 'pdf_a4'),
      module_key: EXPORT_MODULE,
      detail_href: '/angelcare-360-command-center/exports/files',
    } satisfies Angelcare360ReportHistoryRecord
  })
  const reportRows = ((exportsResponse.data || []) as Row[]).map(mapReportHistoryFromExport)
  return [...fileRows, ...reportRows].sort((a, b) => (a.requested_at || a.completed_at || '') < (b.requested_at || b.completed_at || '') ? 1 : -1)
}

export async function blockAngelcare360ExportAttempt(input: Record<string, unknown>) {
  const parsed = angelcare360ExportAttemptBlockedSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Blocage d’export invalide.' }
  const context = await requireAngelcare360Permission('exports.create', { schoolId: parsed.data.schoolId })
  const school = context.school!
  const audit = await auditReportingEvent({
    category: 'exports',
    module: EXPORT_MODULE,
    action: 'export_attempt.blocked_not_configured',
    schoolId: school.id,
    entityType: 'angelcare360_export_files',
    entityId: parsed.data.exportCode || buildCode('EXP'),
    severity: 'warning',
    metadata: {
      format: parsed.data.format,
      reason: parsed.data.reason,
    },
  })
  return {
    ok: true,
    locked: true,
    reason: parsed.data.reason,
    audit,
  }
}

export async function listAngelcare360ExportAuditEvents(options: { schoolId?: string | null; filters?: Angelcare360ExportAuditFilter }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return []
  const school = context.school
  return fetchAuditRows({
    schoolId: school.id,
    modules: [EXPORT_MODULE, REPORT_MODULE],
    filters: options.filters || {},
    limit: 200,
  })
}

export async function getAngelcare360DocumentsOverview(options?: { schoolId?: string | null }): Promise<Angelcare360DocumentsOverviewRecord | null> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const school = context.school
  const schoolId = school.id
  const [generatedDocumentCount, templateCount, latestAuditEvents] = await Promise.all([
    countRows(supabase, 'angelcare360_documents', schoolId),
    countRows(supabase, 'angelcare360_document_templates', schoolId),
    fetchAuditRows({ schoolId, modules: [DOCUMENT_MODULE], limit: 8 }),
  ])
  return {
    schoolId,
    schoolName: school.name,
    activeAcademicYearId: context.academicYear?.id || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
    generatedDocumentCount,
    templateCount,
    governanceReady: templateCount > 0 && generatedDocumentCount > 0,
    storageReady: generatedDocumentCount > 0,
    auditReady: latestAuditEvents.length > 0,
    risks: [
      templateCount === 0 ? 'Aucun template documentaire n’est encore enregistré.' : null,
      generatedDocumentCount === 0 ? 'Aucun document généré réel n’est disponible.' : null,
      DOCUMENT_LOCK_REASON,
    ].filter(Boolean) as string[],
    latestAuditEvents,
  }
}

export async function listAngelcare360GeneratedDocuments(options?: { schoolId?: string | null }): Promise<Array<import('@/types/angelcare360/people').Angelcare360DocumentListRecord>> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_documents')
    .select('*')
    .eq('school_id', school.id)
    .order('created_at', { ascending: false })
  return ((data || []) as Row[]).map((row) => ({
    ...mapBaseRecord(row),
    school_id: asString(row.school_id),
    status: asString(row.status || 'active'),
    document_code: asString(row.document_code),
    documentable_type: asString(row.documentable_type),
    documentable_id: asString(row.documentable_id),
    category: asString(row.category),
    title: asString(row.title),
    file_name: asString(row.file_name),
    file_path: asString(row.file_path),
    storage_provider: asString(row.storage_provider || 'supabase'),
    mime_type: row.mime_type ? asString(row.mime_type) : null,
    file_size_bytes: asNumber(row.file_size_bytes),
    visibility: asString(row.visibility || 'private'),
    uploaded_by: row.uploaded_by ? asString(row.uploaded_by) : null,
    verified_by: row.verified_by ? asString(row.verified_by) : null,
    verified_at: row.verified_at ? asString(row.verified_at) : null,
    metadata_json: (row.metadata_json as Record<string, unknown>) || {},
  })) as Array<import('@/types/angelcare360/people').Angelcare360DocumentListRecord>
}

export async function listAngelcare360DocumentTemplates(options?: { schoolId?: string | null }): Promise<Angelcare360DocumentTemplateListRecord[]> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  const school = context.school
  const { data } = await supabase
    .from('angelcare360_document_templates')
    .select('*')
    .eq('school_id', school.id)
    .order('label', { ascending: true })
  return ((data || []) as Row[]).map(mapDocumentTemplate)
}

export async function createAngelcare360DocumentTemplate(input: Record<string, unknown>) {
  const parsed = angelcare360DocumentTemplateCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Template documentaire invalide.' }
  const context = await requireAngelcare360Permission('documents.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const school = context.school!
  const existing = await supabase.from('angelcare360_document_templates').select('*').eq('school_id', school.id).eq('template_code', parsed.data.templateCode).maybeSingle()
  if (existing.data && asString(existing.data.label) === parsed.data.label && asString(existing.data.status) === parsed.data.status) {
    return { ok: true, record: mapDocumentTemplate(existing.data as Row), idempotent: true }
  }
  const payload = {
    school_id: school.id,
    template_code: parsed.data.templateCode,
    label: parsed.data.label,
    document_type: parsed.data.documentType,
    output_format: parsed.data.outputFormat,
    description: parsed.data.description,
    retention_days: parsed.data.retentionDays ?? null,
    config_json: parsed.data.configJson || {},
    status: parsed.data.status || 'draft',
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const { data, error } = await supabase.from('angelcare360_document_templates').insert(payload).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer le template documentaire.' }
  await auditReportingEvent({
    category: 'documents',
    module: DOCUMENT_MODULE,
    action: 'document_template.created',
    schoolId: school.id,
    entityType: 'angelcare360_document_templates',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: mapDocumentTemplate(data as Row) }
}

export async function updateAngelcare360DocumentTemplate(input: Record<string, unknown>) {
  const parsed = angelcare360DocumentTemplateUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Template documentaire invalide.' }
  const context = await requireAngelcare360Permission('documents.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const school = context.school!
  const { data: current } = await supabase.from('angelcare360_document_templates').select('*').eq('school_id', school.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Template documentaire introuvable.' }
  const { data, error } = await supabase.from('angelcare360_document_templates').update({
    template_code: parsed.data.templateCode,
    label: parsed.data.label,
    document_type: parsed.data.documentType,
    output_format: parsed.data.outputFormat,
    description: parsed.data.description,
    retention_days: parsed.data.retentionDays ?? null,
    config_json: parsed.data.configJson || {},
    status: parsed.data.status,
    updated_by: context.user.id,
  }).eq('school_id', school.id).eq('id', parsed.data.id).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de mettre à jour le template documentaire.' }
  await auditReportingEvent({
    category: 'documents',
    module: DOCUMENT_MODULE,
    action: 'document_template.updated',
    schoolId: school.id,
    entityType: 'angelcare360_document_templates',
    entityId: String(data.id),
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: mapDocumentTemplate(data as Row) }
}

export async function getAngelcare360DocumentGovernanceReadiness(options?: { schoolId?: string | null }): Promise<Angelcare360DocumentGovernanceReadinessRecord | null> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const school = context.school
  const [templateCount, documentCount, auditCount] = await Promise.all([
    countRows(supabase, 'angelcare360_document_templates', school.id),
    countRows(supabase, 'angelcare360_documents', school.id),
    countRows(supabase, 'angelcare360_audit_logs', school.id, [['module', 'eq', DOCUMENT_MODULE]]),
  ])
  return {
    templateReady: templateCount > 0,
    storageReady: documentCount > 0,
    retentionReady: templateCount > 0,
    auditReady: auditCount > 0,
    exportReady: false,
    permissionReady: true,
    reason: DOCUMENT_LOCK_REASON,
  }
}

export async function listAngelcare360DocumentAuditEvents(options: { schoolId?: string | null; filters?: Angelcare360DocumentAuditFilter }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return []
  const school = context.school
  return fetchAuditRows({
    schoolId: school.id,
    modules: [DOCUMENT_MODULE],
    filters: options.filters || {},
    limit: 200,
  })
}
