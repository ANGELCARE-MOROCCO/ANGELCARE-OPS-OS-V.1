export const B2B_IMPORT_FIELDS = [
  'name', 'sector', 'city', 'address', 'website', 'phone', 'email', 'decision_maker_name', 'decision_maker_role',
  'decision_maker_phone', 'decision_maker_email', 'priority_score', 'potential_service_fit', 'estimated_annual_value',
] as const

export function normalizeImportRow(row: Record<string, unknown>) {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase().replace(/\s+/g, '_')] = String(value ?? '').trim()
  }
  return normalized
}

export function validateImportProspect(row: Record<string, unknown>) {
  const errors: string[] = []
  if (!String(row.name || '').trim()) errors.push('Le nom du prospect est obligatoire.')
  if (!String(row.sector || '').trim()) errors.push('Le secteur est obligatoire.')
  return { ok: errors.length === 0, errors }
}
