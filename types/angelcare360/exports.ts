export type Angelcare360ExportScope = 'customer' | 'operator'
export type Angelcare360ExportKind =
  | 'clients'
  | 'invoices'
  | 'payments'
  | 'students'
  | 'attendance'
  | 'documents'
  | 'reports'
  | 'files'

export type Angelcare360ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf_a4' | 'print_view'

export interface Angelcare360ExportDefinition {
  exportKey: string
  title: string
  scope: Angelcare360ExportScope
  kind: Angelcare360ExportKind
  format: Angelcare360ExportFormat
  supportedFormats: Angelcare360ExportFormat[]
  lockedReason?: string | null
  csvAvailable: boolean
  xlsxAvailable: boolean
  pdfAvailable: boolean
}

export interface Angelcare360ExportResult {
  ok: boolean
  locked?: boolean
  reason?: string | null
  fileName?: string | null
  contentType?: string | null
  csv?: string | null
}

