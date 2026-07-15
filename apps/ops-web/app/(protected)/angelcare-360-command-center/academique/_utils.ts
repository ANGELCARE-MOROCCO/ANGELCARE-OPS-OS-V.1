export function text(value: unknown, fallback = '—') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

export function num(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function dateText(value: unknown) {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleDateString('fr-FR')
  } catch {
    return '—'
  }
}

export function dateTimeText(value: unknown) {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleString('fr-FR')
  } catch {
    return '—'
  }
}

export function optionValue(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim()
  return raw || null
}

export function numberValue(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function boolValue(value: FormDataEntryValue | null) {
  return String(value || '').trim().toLowerCase() === 'true'
}

export function relatedLabel(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0] as Record<string, unknown> | undefined
    if (!first) return null
    return String(first.full_name || first.name || first.title || first.label || first.id || '').trim() || null
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record.full_name || record.name || record.title || record.label || record.id || '').trim() || null
  }

  return null
}

export const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

export const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

export const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}
