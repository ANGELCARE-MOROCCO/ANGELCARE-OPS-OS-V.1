import type { SupabaseClient } from "@supabase/supabase-js"
import { cleanNumber, cleanString } from "@/lib/revenue-command-center/canonical-server"

export type RevenueServerClient = SupabaseClient<any, "public", any>

export function isoNow() {
  return new Date().toISOString()
}

export function normalizeAccountPayload(input: unknown) {
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  return {
    account_name: cleanString(payload.accountName ?? payload.account_name ?? payload.name, "Compte sans nom"),
    legal_name: cleanString(payload.legalName ?? payload.legal_name),
    account_type: cleanString(payload.accountType ?? payload.account_type, "organization"),
    segment: cleanString(payload.segment, "b2b"),
    city: cleanString(payload.city, "Non attribuée"),
    territory: cleanString(payload.territory),
    status: cleanString(payload.status, "active"),
    lifecycle_stage: cleanString(payload.lifecycleStage ?? payload.lifecycle_stage, "prospect"),
    priority: cleanString(payload.priority, "medium"),
    owner_name: cleanString(payload.ownerName ?? payload.owner_name ?? payload.owner, "BD Officer"),
    website: cleanString(payload.website),
    domain: cleanString(payload.domain),
    phone: cleanString(payload.phone),
    email: cleanString(payload.email),
    address: cleanString(payload.address),
    industry: cleanString(payload.industry),
    employee_band: cleanString(payload.employeeBand ?? payload.employee_band),
    annual_revenue_mad: cleanNumber(payload.annualRevenueMad ?? payload.annual_revenue_mad, 0),
    registration_number: cleanString(payload.registrationNumber ?? payload.registration_number),
    next_action_at: cleanString(payload.nextActionAt ?? payload.next_action_at) || null,
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
  }
}

export function normalizeContactPayload(input: unknown) {
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  return {
    account_id: cleanString(payload.accountId ?? payload.account_id) || null,
    full_name: cleanString(payload.fullName ?? payload.full_name ?? payload.name, "Contact sans nom"),
    role_title: cleanString(payload.roleTitle ?? payload.role_title),
    department: cleanString(payload.department),
    seniority: cleanString(payload.seniority),
    email: cleanString(payload.email),
    phone: cleanString(payload.phone),
    whatsapp: cleanString(payload.whatsapp),
    influence_level: cleanString(payload.influenceLevel ?? payload.influence_level, "unknown"),
    decision_role: cleanString(payload.decisionRole ?? payload.decision_role, "contact"),
    preferred_channel: cleanString(payload.preferredChannel ?? payload.preferred_channel, "phone"),
    consent_status: cleanString(payload.consentStatus ?? payload.consent_status, "unknown"),
    status: cleanString(payload.status, "active"),
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
  }
}

export function normalizeOpportunityPayload(input: unknown) {
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  return {
    prospect_id: cleanString(payload.prospectId ?? payload.prospect_id) || null,
    account_id: cleanString(payload.accountId ?? payload.account_id) || null,
    contact_id: cleanString(payload.contactId ?? payload.contact_id) || null,
    title: cleanString(payload.title, "Opportunité commerciale"),
    stage: cleanString(payload.stage, "qualification"),
    value_mad: cleanNumber(payload.valueMad ?? payload.value_mad ?? payload.value, 0),
    currency: cleanString(payload.currency, "MAD"),
    probability: cleanNumber(payload.probability, 0),
    expected_close_date: cleanString(payload.expectedCloseDate ?? payload.expected_close_date) || null,
    status: cleanString(payload.status, "open"),
    priority: cleanString(payload.priority, "medium"),
    forecast_category: cleanString(payload.forecastCategory ?? payload.forecast_category, "pipeline"),
    owner: cleanString(payload.owner, "BD Officer"),
    next_step: cleanString(payload.nextStep ?? payload.next_step),
    next_step_at: cleanString(payload.nextStepAt ?? payload.next_step_at) || null,
    source: cleanString(payload.source, "revenue_command_center"),
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
  }
}

export async function optionalSelect<T = any>(
  client: RevenueServerClient,
  table: string,
  select: string,
  configure?: (query: any) => any,
): Promise<{ data: T[]; available: boolean; error?: string }> {
  let query = client.from(table).select(select)
  if (configure) query = configure(query)
  const result = await query
  if (!result.error) return { data: (result.data || []) as T[], available: true }

  const missing = /relation .* does not exist|table .* does not exist|schema cache/i.test(result.error.message || "")
  if (missing) return { data: [], available: false, error: result.error.message }
  throw new Error(result.error.message)
}

export async function optionalSingle<T = any>(
  client: RevenueServerClient,
  table: string,
  select: string,
  configure: (query: any) => any,
): Promise<{ data: T | null; available: boolean; error?: string }> {
  const result = await configure(client.from(table).select(select)).maybeSingle()
  if (!result.error) return { data: (result.data || null) as T | null, available: true }

  const missing = /relation .* does not exist|table .* does not exist|schema cache/i.test(result.error.message || "")
  if (missing) return { data: null, available: false, error: result.error.message }
  throw new Error(result.error.message)
}
