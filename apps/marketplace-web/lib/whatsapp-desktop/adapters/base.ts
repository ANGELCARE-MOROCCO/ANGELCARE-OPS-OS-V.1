import type { WhatsAppContextPriority, WhatsAppContextType } from "@/lib/whatsapp-desktop/context-types"

export interface WhatsAppModuleAdapter {
  id: string
  moduleLabel: string
  contextTypes: WhatsAppContextType[]
  tableCandidates: string[]
  nameFields: string[]
  phoneFields: string[]
  stageFields: string[]
  assigneeFields: string[]
  priorityFields: string[]
  languageFields: string[]
  documentFields: string[]
  sourceRoute: (type: WhatsAppContextType, id: string) => string
  defaultPurpose: string
  defaultOutcome: string
  defaultMessage: string
  fallbackPriority?: WhatsAppContextPriority
}

export function firstValue(row: Record<string, any>, fields: string[]) {
  for (const field of fields) {
    const value = row?.[field]
    if (value !== null && value !== undefined && String(value).trim()) return value
  }
  return null
}

export const commonNameFields = ["display_name", "full_name", "name", "contact_name", "company_name", "organization_name", "title", "subject"]
export const commonPhoneFields = ["whatsapp_phone", "phone_number", "phone", "mobile", "mobile_phone", "contact_phone", "parent_phone", "recipient_phone"]
export const commonStageFields = ["stage", "status", "pipeline_stage", "current_stage", "lifecycle_stage"]
export const commonAssigneeFields = ["assigned_user_id", "assignee_id", "owner_id", "responsible_user_id", "created_by"]
export const commonPriorityFields = ["priority", "risk_level", "urgency"]
export const commonLanguageFields = ["preferred_language", "language", "locale"]
export const commonDocumentFields = ["document_url", "proposal_url", "quotation_url", "invoice_url", "attachment_url", "brochure_url", "evidence_url"]
