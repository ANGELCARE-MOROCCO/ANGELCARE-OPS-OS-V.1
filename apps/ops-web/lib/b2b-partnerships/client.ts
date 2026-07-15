export async function b2bJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.ok === false) throw new Error(json?.error || `Request failed: ${url}`)
  return json.data as T
}

export function mad(value: unknown) {
  const n = Number(value || 0)
  return `${n.toLocaleString('fr-MA')} MAD`
}

export function niceDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
