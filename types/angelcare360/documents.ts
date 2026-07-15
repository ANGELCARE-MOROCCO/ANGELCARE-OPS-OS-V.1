export type Angelcare360DocumentOwner = 'operator' | 'customer'
export type Angelcare360DocumentFormat = 'A4' | 'pdf' | 'csv' | 'json' | 'print_view'
export type Angelcare360DocumentOrientation = 'portrait' | 'landscape'
export type Angelcare360DocumentConfidentiality = 'public' | 'internal' | 'confidential' | 'strictly_confidential'

export interface Angelcare360DocumentTemplateDefinition {
  templateKey: string
  title: string
  family: string
  owner: Angelcare360DocumentOwner
  format: Angelcare360DocumentFormat
  orientation: Angelcare360DocumentOrientation
  supportedExports: Angelcare360DocumentFormat[]
  requiredData: string[]
  confidentiality: Angelcare360DocumentConfidentiality
  referencePrefix: string
  serverPdfAvailable: boolean
  browserPrintAvailable: boolean
  csvAvailable: boolean
  xlsxAvailable: boolean
  lockedReason?: string | null
}

export interface Angelcare360A4MetricBlock {
  label: string
  value: string
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

export interface Angelcare360A4Section {
  title: string
  lines: string[]
}

export interface Angelcare360A4Table {
  headers: string[]
  rows: string[][]
}

export interface Angelcare360A4DocumentModel {
  templateKey: string
  title: string
  family: string
  owner: Angelcare360DocumentOwner
  referenceCode: string
  version: string
  issueDate: string
  confidentiality: Angelcare360DocumentConfidentiality
  preparedBy: string
  subject?: string | null
  clientName?: string | null
  tenantName?: string | null
  schoolName?: string | null
  note?: string | null
  summaryLines?: string[]
  metadataLines?: Array<{ label: string; value: string }>
  metrics?: Angelcare360A4MetricBlock[]
  sections?: Angelcare360A4Section[]
  table?: Angelcare360A4Table | null
  footerNote?: string | null
  statusLabel?: string | null
  signatureLabel?: string | null
  signatureName?: string | null
  isPrintPreview?: boolean
}

