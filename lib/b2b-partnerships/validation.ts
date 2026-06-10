import {
  B2B_CRM_STATUSES,
  B2B_MEETING_STATUSES,
  B2B_OUTREACH_CHANNELS,
  B2B_OUTREACH_OUTCOMES,
  B2B_PRIORITY_SCORES,
  B2B_PROPOSAL_STATUSES,
  B2B_RELATIONSHIP_WARMTH,
  B2B_SECTORS,
  B2B_TASK_PRIORITIES,
  B2B_TASK_STATUSES,
} from './constants'
import type { B2BProspectInput } from './types'

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value as T[number])
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function score(value: unknown, field: string): number | null {
  const n = optionalNumber(value)
  if (n === null) return null
  if (n < 1 || n > 10) throw new Error(`${field} must be between 1 and 10`)
  return n
}

export function validateProspectPayload(raw: unknown): ValidationResult<B2BProspectInput> {
  try {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid payload.' }

    const body = raw as Record<string, unknown>
    const name = optionalString(body.name)
    if (!name) return { ok: false, error: 'Prospect name is required.' }

    const sector = body.sector ?? 'Other'
    if (!isOneOf(sector, B2B_SECTORS)) return { ok: false, error: 'Invalid sector.' }

    const status = body.status ?? 'New'
    if (!isOneOf(status, B2B_CRM_STATUSES)) return { ok: false, error: 'Invalid CRM status.' }

    const priority = body.priority_score ?? 'B'
    if (!isOneOf(priority, B2B_PRIORITY_SCORES)) return { ok: false, error: 'Invalid priority score.' }

    const warmth = body.relationship_warmth ?? 'Cold'
    if (!isOneOf(warmth, B2B_RELATIONSHIP_WARMTH)) return { ok: false, error: 'Invalid relationship warmth.' }

    return {
      ok: true,
      value: {
        name,
        sector,
        sub_sector: optionalString(body.sub_sector),
        city: optionalString(body.city),
        address: optionalString(body.address),
        website: optionalString(body.website),
        instagram: optionalString(body.instagram),
        linkedin: optionalString(body.linkedin),
        google_maps_url: optionalString(body.google_maps_url),
        phone: optionalString(body.phone),
        email: optionalString(body.email),
        main_contact_name: optionalString(body.main_contact_name),
        main_contact_role: optionalString(body.main_contact_role),
        decision_maker_name: optionalString(body.decision_maker_name),
        decision_maker_role: optionalString(body.decision_maker_role),
        decision_maker_phone: optionalString(body.decision_maker_phone),
        decision_maker_email: optionalString(body.decision_maker_email),
        status,
        priority_score: priority,
        fit_score: score(body.fit_score, 'fit_score'),
        urgency_score: score(body.urgency_score, 'urgency_score'),
        decision_power_score: score(body.decision_power_score, 'decision_power_score'),
        revenue_potential_score: score(body.revenue_potential_score, 'revenue_potential_score'),
        relationship_warmth: warmth,
        potential_service_fit: optionalString(body.potential_service_fit),
        current_family_services: optionalString(body.current_family_services),
        pain_points: optionalString(body.pain_points),
        opportunity_description: optionalString(body.opportunity_description),
        estimated_monthly_value: optionalNumber(body.estimated_monthly_value),
        estimated_annual_value: optionalNumber(body.estimated_annual_value),
        assigned_owner_id: optionalString(body.assigned_owner_id),
        last_contact_at: optionalString(body.last_contact_at),
        next_follow_up_at: optionalString(body.next_follow_up_at),
        next_action: optionalString(body.next_action),
      },
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Invalid prospect payload.' }
  }
}

export function validateStatus(value: unknown) {
  return isOneOf(value, B2B_CRM_STATUSES)
}

export function validateOutreachChannel(value: unknown) {
  return isOneOf(value, B2B_OUTREACH_CHANNELS)
}

export function validateOutreachOutcome(value: unknown) {
  return isOneOf(value, B2B_OUTREACH_OUTCOMES)
}

export function validateMeetingStatus(value: unknown) {
  return isOneOf(value, B2B_MEETING_STATUSES)
}

export function validateProposalStatus(value: unknown) {
  return isOneOf(value, B2B_PROPOSAL_STATUSES)
}

export function validateTaskStatus(value: unknown) {
  return isOneOf(value, B2B_TASK_STATUSES)
}

export function validateTaskPriority(value: unknown) {
  return isOneOf(value, B2B_TASK_PRIORITIES)
}
