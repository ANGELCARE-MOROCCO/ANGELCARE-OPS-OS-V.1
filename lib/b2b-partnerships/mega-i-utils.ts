export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data }, init)
}

export function jsonError(error: string, status = 500) {
  return Response.json({ ok: false, error }, { status })
}

export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function numberValue(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function normalizeImportRow(raw: Record<string, unknown>, defaults: Record<string, unknown> = {}) {
  const name = text(raw.name ?? raw.company ?? raw.company_name ?? raw.prospect_name)
  const sector = text(raw.sector ?? defaults.default_sector, 'Other')
  return {
    name,
    sector,
    city: nullableText(raw.city ?? defaults.default_city),
    address: nullableText(raw.address),
    website: nullableText(raw.website),
    phone: nullableText(raw.phone),
    email: nullableText(raw.email),
    decision_maker_name: nullableText(raw.decision_maker_name ?? raw.contact_name),
    decision_maker_role: nullableText(raw.decision_maker_role ?? raw.contact_role),
    decision_maker_phone: nullableText(raw.decision_maker_phone ?? raw.mobile),
    decision_maker_email: nullableText(raw.decision_maker_email ?? raw.contact_email),
    priority_score: text(raw.priority_score ?? defaults.default_priority, 'B'),
    potential_service_fit: nullableText(raw.potential_service_fit),
    opportunity_description: nullableText(raw.opportunity_description),
  }
}

export function validateNormalizedProspect(row: Record<string, unknown>) {
  const errors: string[] = []
  if (!text(row.name)) errors.push('Prospect name is required')
  return errors
}
