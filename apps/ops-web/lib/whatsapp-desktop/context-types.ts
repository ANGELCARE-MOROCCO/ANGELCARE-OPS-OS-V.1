export type WhatsAppContextType =
  | "b2b_prospect" | "b2b_partner" | "commercial_opportunity"
  | "academy_learner" | "academy_partner" | "training_session"
  | "parent" | "customer" | "admission" | "support_case"
  | "quotation" | "invoice" | "payment_followup"
  | "recruitment_candidate" | "refferq_member" | "incident"
  | "appointment" | "custom"

export type WhatsAppContextPriority = "low" | "normal" | "high" | "critical"
export type WhatsAppPhoneStatus = "validated" | "needs_confirmation" | "incomplete" | "unsupported" | "missing"
export type WhatsAppMessageMode = "corporate" | "commercial_direct" | "customer_care" | "executive" | "urgent_operations" | "recruitment" | "training_academy" | "payment_followup"

export interface WhatsAppPhoneNormalization {
  raw: string
  normalized_e164: string | null
  whatsapp_digits: string | null
  country_code: string | null
  national_number: string | null
  status: WhatsAppPhoneStatus
  is_mobile: boolean | null
  is_landline: boolean | null
  reason: string
}

export interface WhatsAppResolvedEntity {
  context_type: WhatsAppContextType
  entity_id: string
  entity_name: string
  phone_number_raw: string | null
  phone: WhatsAppPhoneNormalization
  module_label: string
  source_route: string
  current_stage: string | null
  assigned_user_id: string | null
  priority: WhatsAppContextPriority
  preferred_language: string
  communication_purpose: string
  expected_outcome: string | null
  prepared_message: string | null
  variables: Record<string, string>
  documents: Array<{ id?: string; label: string; category: string; url: string; filename?: string | null }>
  adapter_id: string
  source_table: string | null
  source_snapshot: Record<string, unknown>
}

export interface WhatsAppBusinessContext {
  id: string
  workspace_id: string
  user_id: string
  device_id: string | null
  context_type: WhatsAppContextType
  entity_id: string
  entity_name: string
  phone_number_raw: string | null
  phone_number_e164: string | null
  phone_status: WhatsAppPhoneStatus
  module_label: string
  source_route: string
  communication_purpose: string
  current_stage: string | null
  assigned_user_id: string | null
  priority: WhatsAppContextPriority
  preferred_language: string
  expected_outcome: string | null
  prepared_message: string | null
  status: "draft" | "ready" | "opened" | "awaiting_outcome" | "completed" | "cancelled"
  source_snapshot: Record<string, unknown>
  created_at: string
  updated_at: string
  attempts?: Record<string, unknown>[]
  notes?: Record<string, unknown>[]
  tasks?: Record<string, unknown>[]
  appointments?: Record<string, unknown>[]
  documents?: Record<string, unknown>[]
  handoffs?: Record<string, unknown>[]
  escalations?: Record<string, unknown>[]
  timeline?: Record<string, unknown>[]
}

export const WHATSAPP_CONTEXT_TYPES: WhatsAppContextType[] = [
  "b2b_prospect", "b2b_partner", "commercial_opportunity", "academy_learner",
  "academy_partner", "training_session", "parent", "customer", "admission",
  "support_case", "quotation", "invoice", "payment_followup", "recruitment_candidate",
  "refferq_member", "incident", "appointment", "custom",
]

export const WHATSAPP_OUTCOMES = [
  "message_sent", "message_not_sent", "invalid_number", "contact_unavailable",
  "reply_received", "appointment_obtained", "quotation_requested", "quotation_sent",
  "followup_required", "opportunity_created", "payment_promised", "payment_confirmed",
  "refused", "call_back", "escalation_required", "other",
] as const
export type WhatsAppOutcomeStatus = typeof WHATSAPP_OUTCOMES[number]
