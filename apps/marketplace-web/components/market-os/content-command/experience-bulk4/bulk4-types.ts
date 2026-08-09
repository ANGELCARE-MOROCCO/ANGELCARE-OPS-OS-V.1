export type Bulk4TemplateFamily = "digital" | "print" | "document" | "accelerator"
export type Bulk4StudioMode = "universe" | "templates" | "digital" | "print" | "documents" | "quick-create" | "assets" | "active-assets"
export type Bulk4ReadinessTone = "neutral" | "info" | "success" | "warning" | "danger" | "violet"

export type TemplateSlot = {
  id: string
  label: string
  kind: "headline" | "body" | "image" | "cta" | "logo" | "proof" | "footer" | "metadata" | "table" | "signature" | "qr" | "section"
  required: boolean
  locked?: boolean
  limit?: string
}

export type OutputProfile = {
  id: string
  label: string
  dimensions: string
  orientation: "square" | "portrait" | "landscape" | "document" | "physical"
  channel: string
  safeZone: string
}

export type TemplateDNA = {
  id: string
  code: string
  name: string
  family: Bulk4TemplateFamily
  category: string
  purpose: string
  businessObjective: string
  services: string[]
  audiences: string[]
  channels: string[]
  languages: string[]
  cities: string[]
  anatomy: string[]
  slots: TemplateSlot[]
  outputProfiles: OutputProfile[]
  lockedZones: string[]
  variableZones: string[]
  rules: string[]
  evidence: string[]
  accessibility: string[]
  allowedAdaptations: string[]
  prohibitedAdaptations: string[]
  owner: string
  authority: string
  version: string
  status: "Active" | "Approved" | "Draft" | "Limited" | "Superseded"
  tone: Bulk4ReadinessTone
}

export type ApiTemplateRecord = {
  id: string
  name: string
  family: string
  familyId?: string
  family_id?: string
  category: string
  subcategory: string
  modalScope?: string
  modal_scope?: string
  output?: string
  channel?: string
  owner?: string
  status?: string
  usage?: number
  usage_count?: number
  readiness?: number
  tone?: string
  icon?: string
  icon_key?: string
  rules?: unknown[]
  matchedParams?: unknown[]
  matched_params?: unknown[]
  lastUpdated?: string
}

export type CreativeAssetRecord = {
  id: string
  family: string
  title: string
  category?: string | null
  subcategory?: string | null
  output?: string | null
  channel?: string | null
  service_product?: string | null
  owner?: string | null
  status: string
  priority?: string | null
  storage_path?: string | null
  preview_url?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type CreativeDocumentRecord = {
  id: string
  title: string
  document_type?: string | null
  category?: string | null
  subcategory?: string | null
  owner?: string | null
  version?: string | null
  status: string
  confidentiality?: string | null
  storage_path?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type Bulk4CreativeContext = {
  dossierId?: string
  dossierTitle?: string
  briefId?: string
  missionId?: string
  taskId?: string
  templateId?: string
  assetId?: string
  studio?: Exclude<Bulk4StudioMode, "universe" | "assets" | "active-assets">
  returnTo: string
  sourceHref: string
  updatedAt: string
}

export type PreflightCheck = {
  id: string
  label: string
  detail: string
  passed: boolean
  blocking: boolean
}
